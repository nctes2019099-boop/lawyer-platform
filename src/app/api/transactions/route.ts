import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number(),
  type: z.enum(["income", "expense"]),
  category: z.string().default("مصاريف محكمة"),
  caseId: z.string().optional(),
  clientId: z.string().optional(),
  date: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 60, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = { ownerId: user.id };
  if (type) where.type = type;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { case: true, client: true },
    orderBy: { date: "desc" },
    take: limit,
  });

  const stats = await prisma.transaction.aggregate({
    where: { ownerId: user.id },
    _sum: { amount: true },
  });

  const income = await prisma.transaction.aggregate({
    where: { ownerId: user.id, type: "income" },
    _sum: { amount: true },
  });

  const expenses = await prisma.transaction.aggregate({
    where: { ownerId: user.id, type: "expense" },
    _sum: { amount: true },
  });

  return NextResponse.json({
    transactions,
    stats: {
      totalIncome: income._sum.amount || 0,
      totalExpenses: Math.abs(expenses._sum.amount || 0),
      net: (income._sum.amount || 0) - Math.abs(expenses._sum.amount || 0),
    },
  });
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
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        date: data.date ? new Date(data.date) : new Date(),
        ownerId: user.id,
      },
    });
    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
