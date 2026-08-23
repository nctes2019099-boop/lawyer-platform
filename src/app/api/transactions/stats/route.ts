import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const months: { month: string; income: number; expenses: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const income = await prisma.transaction.aggregate({
      where: {
        ownerId: user.id,
        type: "income",
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    const expenses = await prisma.transaction.aggregate({
      where: {
        ownerId: user.id,
        type: "expense",
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    months.push({
      month: d.toLocaleDateString("ar-EG", { month: "short" }),
      income: income._sum.amount || 0,
      expenses: Math.abs(expenses._sum.amount || 0),
    });
  }

  return NextResponse.json({ months });
}
