import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { transactionId } = await req.json();
  const payment = await prisma.payment.findFirst({
    where: { transactionId, userId: user.id },
    include: { plan: true },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCESS", paidAt: new Date() },
  });

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (payment.plan?.durationDays || 30));

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      planId: payment.planId!,
      status: "ACTIVE",
      startDate: new Date(),
      endDate,
    },
    update: {
      planId: payment.planId!,
      status: "ACTIVE",
      startDate: new Date(),
      endDate,
    },
  });

  return NextResponse.json({ success: true });
}
