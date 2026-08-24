import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { getPagination } from "@/lib/pagination";
import { checkQuota } from "@/lib/quotas";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  governorate: z.string().optional(),
  category: z.string().default("عامة"),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 60, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const { limit } = getPagination(req, { defaultLimit: 50, maxLimit: 200 });
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const thisMonth = searchParams.get("thisMonth");

  const where: Record<string, unknown> = { ownerId: user.id };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  if (thisMonth === "true") {
    const now = new Date();
    where.createdAt = {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  }

  const clients = await prisma.client.findMany({
    where,
    include: { cases: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (thisMonth === "true") {
    return NextResponse.json({ count: clients.length });
  }

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 60, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    // Enforce plan quota on number of clients.
    const clientCount = await prisma.client.count({ where: { ownerId: user.id } });
    const quota = await checkQuota(user.id, "maxClients", clientCount);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.message, upgradeRequired: true }, { status: 402 });
    }

    const client = await prisma.client.create({
      data: { ...data, ownerId: user.id },
    });
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
