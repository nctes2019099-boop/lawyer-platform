import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { transactionId } = (await req.json().catch(() => ({}))) as {
    transactionId?: string;
  };
  if (typeof transactionId !== "string") {
    return NextResponse.json({ error: "transactionId required" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { transactionId, userId: user.id },
    include: { plan: true },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  // Idempotency: already completed.
  if (payment.status === "SUCCESS") {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  // Only the built-in "mock" provider may be confirmed client-side, and only
  // outside production. Real providers (e.g. ZainCash) must be confirmed via
  // the signed server-to-server webhook — never by trusting the client.
  if (payment.provider !== "mock" || env.isProduction) {
    return NextResponse.json(
      { error: "لا يمكن تأكيد الدفع يدوياً؛ سيتم التأكيد عبر مزود الخدمة." },
      { status: 400 }
    );
  }

  // Re-fetch the current price to avoid trusting a stale/tampered amount.
  const plan = payment.planId
    ? await prisma.subscriptionPlan.findUnique({ where: { id: payment.planId } })
    : null;
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Plan unavailable" }, { status: 400 });
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationDays);

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS", amount: plan.price, paidAt: new Date() },
    }),
    prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        planId: plan.id,
        status: "ACTIVE",
        startDate: new Date(),
        endDate,
      },
      update: {
        planId: plan.id,
        status: "ACTIVE",
        startDate: new Date(),
        endDate,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
