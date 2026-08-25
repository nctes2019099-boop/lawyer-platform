import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { rateLimitIP, getClientIP, isLockedOut, recordFailedLogin, clearFailedLogins } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (!rateLimitIP(getClientIP(req), 10, 60_000)) {
    return NextResponse.json(
      { error: "عدد محاولات تسجيل الدخول كبير، حاول لاحقاً." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { email, password } = schema.parse(body);
    const normalizedEmail = email.toLowerCase();
    const ip = getClientIP(req);

    // Lock an account/IP after 5 failed attempts within 15 minutes.
    const lockKey = `login:${normalizedEmail}`;
    if (isLockedOut(lockKey) || isLockedOut(`ip:${ip}`)) {
      return NextResponse.json(
        { error: "تم قفل الحساب مؤقتاً بسبب محاولات فاشلة كثيرة. حاول بعد 15 دقيقة." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    // Compare against a dummy hash for unknown users to keep timing constant
    // (prevents account enumeration via response time).
    const valid = await bcrypt.compare(
      password,
      user?.password || "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.a5o7Z0VQ7Q0Q7Q0Q7Q0Q7Q0Q7Q0Q"
    );
    if (!user || !valid) {
      recordFailedLogin(lockKey);
      recordFailedLogin(`ip:${ip}`);
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    clearFailedLogins(lockKey);
    clearFailedLogins(`ip:${ip}`);
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 400 }
    );
  }
}
