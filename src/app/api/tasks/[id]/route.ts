import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";
import { userOwnsResources } from "@/lib/authorization";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  priority: z.enum(["عادية", "مهمة", "عاجلة", "حرجة"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  caseId: z.string().optional().nullable(),
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

    if (body.caseId !== undefined) {
      if (!(await userOwnsResources(user.id, { caseId: body.caseId }))) {
        return NextResponse.json({ error: "Invalid case" }, { status: 400 });
      }
    }

    const existing = await prisma.task.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.status !== undefined) data.status = body.status;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.caseId !== undefined) data.caseId = body.caseId;
    data.completedAt = body.status === "completed" ? new Date() : body.status ? null : undefined;
    // Preserve completedAt when status isn't changing.
    if (body.status === undefined) delete data.completedAt;

    const task = await prisma.task.update({
      where: { id },
      data,
    });
    return NextResponse.json(task);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors.map((e) => e.message).join(", ")
        : "Failed to update task";
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
    await prisma.task.deleteMany({ where: { id, ownerId: user.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
