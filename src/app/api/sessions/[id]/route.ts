import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const ALLOWED = ["date", "location", "status", "notes"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const k of ALLOWED) if (k in body) data[k] = body[k];
  if (typeof data.date === "string") data.date = new Date(data.date);

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "No fields" }, { status: 400 });

  // session -> case -> ownerId must match
  const result = await prisma.session.updateMany({
    where: { id, case: { ownerId: user.id } },
    data,
  });
  if (result.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.session.deleteMany({ where: { id, case: { ownerId: user.id } } });
  return NextResponse.json({ success: true });
}
