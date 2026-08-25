import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SignJWT } from "jose";
import { z } from "zod";
import { env } from "@/lib/env";
import { rateLimitIP, getClientIP } from "@/lib/rate-limit";
import { sendEmail, passwordResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

const RESET_TOKEN_TTL = "1h";

export async function POST(req: NextRequest) {
  if (!rateLimitIP(getClientIP(req), 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { email } = schema.parse(await req.json());

    // Always look up the user but never reveal whether the email exists,
    // to prevent account enumeration.
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);
      const token = await new SignJWT({ sub: user.id, purpose: "reset" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(RESET_TOKEN_TTL)
        .sign(secret);

      // Store a hashed/opaque record so tokens can be revoked.
      // Note: production should email this link instead of returning it.
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const base =
        env.NEXTAUTH_URL ||
        env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000";
      const resetUrl = `${base.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

      if (!env.isProduction) {
        // eslint-disable-next-line no-console
        console.log(`[dev] Password reset link for ${email}: ${resetUrl}`);
      }

      // Best-effort; never block the generic response on email failure so we
      // don't leak account existence or bounce the request.
      void sendEmail({
        to: user.email,
        ...passwordResetEmail({ name: user.name || "مستخدم", resetUrl }),
      });
    }

    // Generic response regardless of whether the user exists.
    return NextResponse.json({
      success: true,
      message:
        "إذا كان البريد مسجلاً، فسيتم إرسال رابط إعادة تعيين كلمة المرور.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
