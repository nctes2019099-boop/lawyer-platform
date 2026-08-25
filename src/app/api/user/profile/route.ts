import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^07[0-9]{9}$/, "رقم الهاتف غير صالح")
    .optional()
    .or(z.literal("")),
  governorate: z.string().max(100).optional().or(z.literal("")),
  barMember: z.string().max(100).optional().or(z.literal("")),
  avatar: z.string().url().optional().or(z.literal("")),
});

const publicSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  governorate: true,
  barMember: true,
  avatar: true,
  role: true,
  isAdmin: true,
  createdAt: true,
} as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: publicSelect,
  });

  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = profileSchema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: user.id },
      // Never allow clients to escalate role/isAdmin or change email/password here.
      data,
      select: publicSelect,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors.map((e) => e.message).join(", ")
        : "Invalid data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
