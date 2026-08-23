import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
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
    },
  });

  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone, governorate, barMember, avatar } = body;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name, phone, governorate, barMember, avatar },
  });

  return NextResponse.json(updated);
}
