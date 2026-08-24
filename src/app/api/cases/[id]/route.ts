import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// Whitelist of fields a user is allowed to update on their own cases.
// Prevents mass-assignment of ownerId / id / createdAt, etc.
const ALLOWED_FIELDS = [
  "caseNumber",
  "title",
  "description",
  "type",
  "status",
  "priority",
  "court",
  "judge",
  "clientId",
] as const;

function pickAllowed(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) data[key] = body[key];
  }
  return data;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const case_ = await prisma.case.findFirst({
    where: { id, ownerId: user.id },
    include: {
      client: true,
      sessions: { orderBy: { date: "asc" } },
      documents: true,
      petitions: true,
      appointments: true,
    },
  });

  if (!case_) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(case_);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data = pickAllowed(body);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Ensure the referenced client belongs to the same owner.
  if (typeof data.clientId === "string" && data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId as string, ownerId: user.id },
    });
    if (!client) return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }

  const case_ = await prisma.case.updateMany({
    where: { id, ownerId: user.id },
    data,
  });

  if (case_.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.case.deleteMany({ where: { id, ownerId: user.id } });
  return NextResponse.json({ success: true });
}
