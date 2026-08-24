import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });
  if (!sub) return NextResponse.json({ error: "No subscription" }, { status: 404 });

  const updated = await prisma.subscription.update({
    where: { userId: user.id },
    data: { autoRenew: false },
  });

  return NextResponse.json({ success: true, autoRenew: updated.autoRenew });
}
