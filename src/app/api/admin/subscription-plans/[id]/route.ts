import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const planSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().nonnegative(),
  currency: z.string().min(1).max(10).default("IQD"),
  durationDays: z.number().int().positive(),
  features: z.string().optional().nullable(),
  limits: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const data = planSchema.partial().parse(await req.json());
    const plan = await prisma.subscriptionPlan.update({ where: { id }, data });
    return NextResponse.json(plan);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors.map((e) => e.message).join(", ")
        : "Invalid data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  // Soft-delete: deactivate instead of removing (preserves payment history).
  await prisma.subscriptionPlan.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
}
