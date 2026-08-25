import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  caseId: z.string().min(1),
  date: z.string().datetime(),
  location: z.string().max(200).optional(),
  status: z.string().default("قادمة"),
  notes: z.string().max(5000).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const caseId = searchParams.get("caseId");
  const where: Record<string, unknown> = caseId ? { caseId } : {};

  if (caseId) {
    // ensure the case belongs to the user
    const c = await prisma.case.findFirst({
      where: { id: caseId, ownerId: user.id },
      select: { id: true },
    });
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } else {
    // only sessions of cases owned by the user
    where.case = { ownerId: user.id };
  }

  const sessions = await prisma.session.findMany({
    where,
    include: { case: { select: { id: true, title: true, caseNumber: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = createSchema.parse(await req.json());

    const c = await prisma.case.findFirst({
      where: { id: data.caseId, ownerId: user.id },
      select: { id: true },
    });
    if (!c) return NextResponse.json({ error: "Invalid case" }, { status: 400 });

    const session = await prisma.session.create({
      data: {
        caseId: data.caseId,
        date: new Date(data.date),
        location: data.location,
        status: data.status,
        notes: data.notes,
      },
    });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors.map((e) => e.message).join(", ")
        : "Invalid data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
