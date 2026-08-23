import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const caseId = searchParams.get("caseId");
  const status = searchParams.get("status");

  const where: any = { ownerId: user.id };
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
    const body = await req.json();
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status || "pending",
        priority: body.priority || "عادية",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        caseId: body.caseId || null,
        ownerId: user.id,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
