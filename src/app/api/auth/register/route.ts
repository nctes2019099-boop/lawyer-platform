import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitIP, getClientIP } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail, welcomeEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export async function POST(req: NextRequest) {
  if (!rateLimitIP(getClientIP(req), 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    // Auto-assign the free plan if one exists, so new accounts have a baseline.
    const freePlan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true, price: 0 },
      orderBy: { sortOrder: "asc" },
    });
    if (freePlan) {
      const now = new Date();
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          status: "ACTIVE",
          startDate: now,
          endDate: new Date(now.getTime() + freePlan.durationDays * 86400000),
          autoRenew: false,
        },
      });
    }

    // Fire-and-forget welcome email; never block signup on email failure.
    const welcome = welcomeEmail(name);
    void sendEmail({ to: email, subject: welcome.subject, html: welcome.html, text: welcome.text });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 }
    );
  }
}
