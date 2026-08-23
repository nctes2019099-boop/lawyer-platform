import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

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
  const body = await req.json();

  const case_ = await prisma.case.updateMany({
    where: { id, ownerId: user.id },
    data: body,
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
