import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  isAdmin: z.boolean().optional(),
  password: z.string().min(6).max(100).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentUser();
  if (!admin?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const data = updateSchema.parse(await req.json());

    // Prevent an admin from removing their own admin status (avoids lockout).
    if (id === admin.id && data.isAdmin === false) {
      return NextResponse.json({ error: "لا يمكن إزالة صلاحيتك كمسؤول" }, { status: 400 });
    }

    if (data.email) {
      const clash = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
      if (clash) return NextResponse.json({ error: "البريد مستخدم" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.email !== undefined) update.email = data.email;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.role !== undefined) update.role = data.role;
    if (data.isAdmin !== undefined) update.isAdmin = data.isAdmin;
    if (data.password) update.password = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.update({
      where: { id },
      data: update,
      select: { id: true, name: true, email: true, phone: true, role: true, isAdmin: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch (e) {
    const message = e instanceof z.ZodError ? e.errors.map((x) => x.message).join(", ") : "Invalid";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentUser();
  if (!admin?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === admin.id) return NextResponse.json({ error: "لا يمكن حذف حسابك" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
