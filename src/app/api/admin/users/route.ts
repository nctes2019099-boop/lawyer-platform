import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getPagination } from "@/lib/pagination";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  phone: z.string().optional(),
  role: z.string().default("lawyer"),
  isAdmin: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { limit, offset, searchParams } = getPagination(req, { defaultLimit: 50, maxLimit: 200 });
  const q = searchParams.get("q")?.trim();

  const where = q
    ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
    : undefined;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: { id: true, name: true, email: true, phone: true, role: true, isAdmin: true, createdAt: true, _count: { select: { cases: true, clients: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total });
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = createSchema.parse(await req.json());
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return NextResponse.json({ error: "البريد مستخدم بالفعل" }, { status: 400 });

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        phone: data.phone,
        role: data.role,
        isAdmin: data.isAdmin,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, isAdmin: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    const message = e instanceof z.ZodError ? e.errors.map((x) => x.message).join(", ") : "Invalid data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
