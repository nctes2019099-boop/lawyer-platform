import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getPagination } from "@/lib/pagination";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { limit, offset } = getPagination(req as any, { defaultLimit: 20, maxLimit: 100 });
  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: { plan: { select: { name: true } } },
  });
  const total = await prisma.payment.count({ where: { userId: user.id } });
  return NextResponse.json({ payments, total });
}
