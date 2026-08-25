import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  description: z.string().max(5000).optional(),
  endTime: z.string().datetime().optional().nullable(),
  duration: z.number().int().nonnegative().optional(),
  billable: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const data: Record<string, unknown> = {};
    if (body.description !== undefined) data.description = body.description;
    if (body.endTime !== undefined) data.endTime = body.endTime ? new Date(body.endTime) : null;
    if (body.duration !== undefined) data.duration = body.duration;
    if (body.billable !== undefined) data.billable = body.billable;

    const entry = await prisma.timeEntry.updateMany({
      where: { id, ownerId: user.id },
      data,
    });
    if (entry.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors.map((e) => e.message).join(", ")
        : "Failed to update";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.timeEntry.deleteMany({ where: { id, ownerId: user.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
