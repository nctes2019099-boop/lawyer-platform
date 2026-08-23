import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, paymentMethod } = await req.json();
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      planId,
      amount: plan.price,
      currency: plan.currency,
      paymentMethod,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    paymentId: payment.id,
    transactionId: payment.transactionId,
    amount: plan.price,
    paymentUrl: paymentMethod === "zaincash" ? "https://mock-payment.example.com" : null,
  });
}
