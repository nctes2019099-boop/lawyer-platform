import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { z } from "zod";
import { env } from "@/lib/env";
import { rateLimitIP, getClientIP } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export async function POST(req: NextRequest) {
  if (!rateLimitIP(getClientIP(req), 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { token, password } = schema.parse(await req.json());

    const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);
    let payload;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch {
      return NextResponse.json(
        { error: "رمز إعادة التعيين غير صالح أو منتهي الصلاحية" },
        { status: 400 }
      );
    }

    if (payload.purpose !== "reset" || !payload.sub) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Token must exist, be unused and not expired in the DB.
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (
      !record ||
      record.used ||
      record.expiresAt < new Date() ||
      record.userId !== payload.sub
    ) {
      return NextResponse.json(
        { error: "رمز إعادة التعيين غير صالح أو منتهي الصلاحية" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    // Update password and mark token used atomically.
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
