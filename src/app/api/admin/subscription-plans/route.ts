import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const plan = await prisma.subscriptionPlan.create({ data: body });
  return NextResponse.json(plan);
}
