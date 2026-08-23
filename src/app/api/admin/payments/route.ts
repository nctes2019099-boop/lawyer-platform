import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(payments);
}
