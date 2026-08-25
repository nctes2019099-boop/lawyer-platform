import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

import { userOwnsResources } from "@/lib/authorization";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.string().default("عريضة"),
  status: z.string().default("قيد التنفيذ"),
  caseId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 60, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { ownerId: user.id };
  if (status) where.status = status;

  const petitions = await prisma.petition.findMany({
    where,
    include: { case: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(petitions);
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

    if (!(await userOwnsResources(user.id, { caseId: data.caseId }))) {
      return NextResponse.json({ error: "Invalid case" }, { status: 400 });
    }

    const petition = await prisma.petition.create({
      data: { ...data, ownerId: user.id },
      include: { case: true },
    });
    return NextResponse.json(petition);
  } catch (error) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
