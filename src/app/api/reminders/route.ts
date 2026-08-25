import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueAt: z.string().datetime(),
  type: z.enum(["session", "deadline", "payment", "general"]).default("general"),
  caseId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming");

  const where: Record<string, unknown> = { ownerId: user.id };
  if (upcoming === "true") {
    where.dueAt = { gte: new Date() };
    where.status = "pending";
  }

  const reminders = await prisma.reminder.findMany({
    where,
    orderBy: { dueAt: "asc" },
    take: upcoming === "true" ? 20 : 100,
  });
  return NextResponse.json(reminders);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = createSchema.parse(await req.json());
    const reminder = await prisma.reminder.create({
      data: {
        ...data,
        dueAt: new Date(data.dueAt),
        ownerId: user.id,
      },
    });
    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors.map((e) => e.message).join(", ")
        : "Invalid data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
