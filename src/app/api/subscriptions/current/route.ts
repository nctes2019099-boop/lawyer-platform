import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    include: { plan: true },
  });

  if (!subscription) {
    return NextResponse.json({ subscription: null });
  }

  const daysRemaining = subscription.endDate
    ? Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return NextResponse.json({ subscription: { ...subscription, daysRemaining } });
}
