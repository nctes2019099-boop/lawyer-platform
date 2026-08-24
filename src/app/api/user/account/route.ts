import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Delete the authenticated user's own account and all their data.
const schema = z.object({
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  confirmation: z.string().refine((v) => v === "حذف", "اكتب كلمة حذف للتأكيد"),
});

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { password } = schema.parse(await req.json());
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const valid = await bcrypt.compare(password, dbUser.password);
    if (!valid) return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 400 });

    // Prevent an admin from deleting the only admin account.
    if (dbUser.isAdmin) {
      const adminCount = await prisma.user.count({ where: { isAdmin: true } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "لا يمكن حذف حساب المسؤول الوحيد" }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id: user.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof z.ZodError ? e.errors.map((x) => x.message).join(", ") : "Invalid";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
