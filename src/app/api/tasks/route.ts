import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";
import { userOwnsResources } from "@/lib/authorization";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  priority: z.enum(["عادية", "مهمة", "عاجلة", "حرجة"]).default("عادية"),
  dueDate: z.string().datetime().optional(),
  caseId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const caseId = searchParams.get("caseId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { ownerId: user.id };
  if (caseId) where.caseId = caseId;
  if (status) where.status = status;

  const tasks = await prisma.task.findMany({
    where,
    include: { case: { select: { id: true, title: true, caseNumber: true } } },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = createSchema.parse(await req.json());

    if (!(await userOwnsResources(user.id, { caseId: data.caseId }))) {
      return NextResponse.json({ error: "Invalid case" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        caseId: data.caseId || null,
        ownerId: user.id,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors.map((e) => e.message).join(", ")
        : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
