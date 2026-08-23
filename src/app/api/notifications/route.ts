import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, read } = await req.json();

  if (id) {
    await prisma.notification.updateMany({
      where: { id, ownerId: user.id },
      data: { read },
    });
  } else {
    await prisma.notification.updateMany({
      where: { ownerId: user.id },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, clearAll } = await req.json();

  if (clearAll) {
    await prisma.notification.deleteMany({ where: { ownerId: user.id } });
  } else if (id) {
    await prisma.notification.deleteMany({ where: { id, ownerId: user.id } });
  }

  return NextResponse.json({ success: true });
}
