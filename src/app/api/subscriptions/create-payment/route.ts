import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";
import { initPayment, type Provider } from "@/lib/payments";

const schema = z.object({
  planId: z.string().min(1),
  paymentMethod: z.enum(["card", "zaincash", "mock"]).default("mock"),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { planId, paymentMethod } = parsed.data;

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Free plan: activate immediately, no payment needed.
  if (plan.price === 0) {
    const now = new Date();
    const end = new Date(now.getTime() + plan.durationDays * 86400000);
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { planId: plan.id, status: "ACTIVE", startDate: now, endDate: end, autoRenew: false },
      create: { userId: user.id, planId: plan.id, status: "ACTIVE", startDate: now, endDate: end, autoRenew: false },
    });
    return NextResponse.json({ paymentId: null, activated: true, plan: plan.name });
  }

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      planId,
      provider: paymentMethod === "zaincash" ? "zaincash" : paymentMethod === "card" ? "card" : "mock",
      amount: plan.price,
      currency: plan.currency,
      paymentMethod,
      status: "PENDING",
    },
  });

  try {
    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;

    const init = await initPayment({
      provider: paymentMethod as Provider,
      amount: plan.price,
      orderId: payment.transactionId,
      label: `اشتراك ${plan.name}`,
      baseUrl,
    });

    if (init.providerRef) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerPaymentId: init.providerRef },
      });
    }

    return NextResponse.json({
      paymentId: payment.id,
      transactionId: payment.transactionId,
      amount: plan.price,
      paymentUrl: init.paymentUrl,
      provider: init.provider,
      // Mock/sandbox: the client may verify immediately to simulate completion.
      autoVerify: init.completed === true,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Payment initialization failed";
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", metadata: message } });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
