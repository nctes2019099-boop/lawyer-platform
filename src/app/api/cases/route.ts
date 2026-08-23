import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createSchema = z.object({
  caseNumber: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().default("مدني"),
  status: z.string().default("قيد النظر"),
  priority: z.string().default("عادية"),
  court: z.string().optional(),
  judge: z.string().optional(),
  clientId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 60, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { ownerId: user.id };
  if (status) where.status = status;
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { caseNumber: { contains: search } },
    ];
  }

  const cases = await prisma.case.findMany({
    where,
    include: { client: true, sessions: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(cases);
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

    const case_ = await prisma.case.create({
      data: { ...data, ownerId: user.id },
      include: { client: true },
    });

    await prisma.activity.create({
      data: {
        type: "case_created",
        title: `قضية جديدة: ${case_.title}`,
        caseId: case_.id,
        ownerId: user.id,
      },
    });

    return NextResponse.json(case_);
  } catch (error) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
