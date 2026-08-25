import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";
import { userOwnsResources } from "@/lib/authorization";

const createSchema = z
  .object({
    description: z.string().max(5000).optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
    duration: z.number().int().nonnegative().optional(),
    billable: z.boolean().default(true),
    hourlyRate: z.number().nonnegative().default(0),
    caseId: z.string().optional(),
  })
  .refine(
    (v) => !v.endTime || new Date(v.endTime) >= new Date(v.startTime),
    { message: "endTime must be after startTime", path: ["endTime"] }
  );

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const caseId = searchParams.get("caseId");

  const entries = await prisma.timeEntry.findMany({
    where: { ownerId: user.id, ...(caseId && { caseId }) },
    include: { case: { select: { title: true, caseNumber: true } } },
    orderBy: { startTime: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = createSchema.parse(await req.json());

    if (!(await userOwnsResources(user.id, { caseId: body.caseId }))) {
      return NextResponse.json({ error: "Invalid case" }, { status: 400 });
    }

    let duration = body.duration;
    if (duration === undefined && body.endTime) {
      duration = Math.max(
        0,
        Math.round((new Date(body.endTime).getTime() - new Date(body.startTime).getTime()) / 1000)
      );
    }

    const entry = await prisma.timeEntry.create({
      data: {
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        duration: duration ?? 0,
        billable: body.billable,
        hourlyRate: body.hourlyRate,
        caseId: body.caseId || null,
        ownerId: user.id,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors.map((e) => e.message).join(", ")
        : "Failed to create time entry";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
