import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().optional(),
  caseId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  date: z.string().datetime().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 30, 60_000)) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  try {
    const { id } = await params;
    const existing = await prisma.transaction.findFirst({ where: { id, ownerId: user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = updateSchema.parse(await req.json());
    const updated = await prisma.transaction.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: e instanceof z.ZodError ? e.errors[0].message : "Invalid" }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 30, 60_000)) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const { id } = await params;
  const existing = await prisma.transaction.findFirst({ where: { id, ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
