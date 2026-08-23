import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

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
    const body = await req.json();
    const entry = await prisma.timeEntry.create({
      data: {
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        duration: body.duration || 0,
        billable: body.billable ?? true,
        hourlyRate: body.hourlyRate || 0,
        caseId: body.caseId || null,
        ownerId: user.id,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 });
  }
}
