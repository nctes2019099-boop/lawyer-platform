import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getPagination } from "@/lib/pagination";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { limit, offset } = getPagination(req, { defaultLimit: 50, maxLimit: 200 });

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(payments);
}
