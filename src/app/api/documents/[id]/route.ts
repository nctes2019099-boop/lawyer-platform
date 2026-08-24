import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 20, 60_000)) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const { id } = await params;
  const existing = await prisma.document.findFirst({ where: { id, ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
