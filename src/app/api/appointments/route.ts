import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

import { userOwnsResources } from "@/lib/authorization";
import { getPagination } from "@/lib/pagination";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().datetime(),
  location: z.string().max(200).optional(),
  type: z.string().default("جلسة"),
  status: z.string().default("قادمة"),
  notes: z.string().optional(),
  caseId: z.string().optional(),
  clientId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 60, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming");
  const { limit } = getPagination(req, { defaultLimit: 50, maxLimit: 200 });

  const where: Record<string, unknown> = { ownerId: user.id };

  if (upcoming === "true") {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    where.date = { gte: now, lte: nextWeek };
    where.status = "قادمة";
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { case: true, client: true },
    orderBy: { date: "asc" },
    take: limit,
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 20, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    if (!(await userOwnsResources(user.id, { caseId: data.caseId, clientId: data.clientId }))) {
      return NextResponse.json({ error: "Invalid case or client" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        date: new Date(data.date),
        ownerId: user.id,
      },
      include: { case: true },
    });
    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
