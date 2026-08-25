import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPayment, type Provider } from "@/lib/payments";

/**
 * Payment provider webhook / redirect handler.
 *
 * ZainCash redirects the user back here after payment with query params
 * (id, status). We look up the payment by its providerPaymentId, verify the
 * status server-to-server, and activate the subscription on success.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(req.url);
  const ref = url.searchParams.get("id") || url.searchParams.get("transactionId");

  if (provider !== "zaincash" || !ref) {
    return NextResponse.redirect(new URL("/?payment=failed", req.url));
  }

  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: ref, provider: "zaincash" },
    include: { plan: true },
  });

  if (!payment) return NextResponse.redirect(new URL("/?payment=notfound", req.url));

  try {
    const result = await verifyPayment({ provider: provider as Provider, providerRef: ref, amount: payment.amount });
    if (!result.success) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      return NextResponse.redirect(new URL("/subscriptions?payment=failed", req.url));
    }

    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "COMPLETED", paidAt: result.paidAt || new Date() } }),
      prisma.subscription.upsert({
        where: { userId: payment.userId },
        update: {
          planId: payment.planId!,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: payment.plan ? new Date(Date.now() + payment.plan.durationDays * 86400000) : undefined,
          autoRenew: true,
        },
        create: {
          userId: payment.userId,
          planId: payment.planId!,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: payment.plan ? new Date(Date.now() + payment.plan.durationDays * 86400000) : new Date(),
          autoRenew: true,
        },
      }),
    ]);

    return NextResponse.redirect(new URL("/subscriptions?payment=success", req.url));
  } catch {
    return NextResponse.redirect(new URL("/subscriptions?payment=failed", req.url));
  }
}

// Also accept POST for providers that post server-to-server callbacks.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  return GET(req, ctx);
}
