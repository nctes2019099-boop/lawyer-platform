import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

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

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      planId,
      provider: paymentMethod === "zaincash" ? "zaincash" : "mock",
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
    paymentUrl:
      paymentMethod === "zaincash" ? "https://mock-payment.example.com" : null,
  });
}
