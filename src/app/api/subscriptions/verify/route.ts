import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const schema = z.object({ paymentId: z.string().min(1) });

// Verify (and in this mock flow, complete) a payment, then activate the subscription.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { paymentId } = schema.parse(await req.json());

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: user.id },
      include: { plan: true },
    });
    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    if (payment.status !== "COMPLETED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "COMPLETED", paidAt: new Date() },
      });
    }

    const plan = payment.plan;
    if (!plan) return NextResponse.json({ error: "Plan missing" }, { status: 400 });

    const now = new Date();
    const end = new Date(now.getTime() + plan.durationDays * 86400000);

    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        planId: plan.id,
        status: "ACTIVE",
        startDate: now,
        endDate: end,
        autoRenew: true,
      },
      create: {
        userId: user.id,
        planId: plan.id,
        status: "ACTIVE",
        startDate: now,
        endDate: end,
        autoRenew: true,
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (e) {
    const message = e instanceof z.ZodError ? e.errors.map((x) => x.message).join(", ") : "Invalid";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
