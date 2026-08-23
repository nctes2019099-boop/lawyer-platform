import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalUsers, totalPayments, totalSubscriptions, totalCases] = await Promise.all([
    prisma.user.count(),
    prisma.payment.count(),
    prisma.subscription.count(),
    prisma.case.count(),
  ]);

  return NextResponse.json({ totalUsers, totalPayments, totalSubscriptions, totalCases });
}
