import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 60, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const [totalCases, activeCases, completedCases, totalClients, totalAppointments, upcomingAppointments, totalNotes] = await Promise.all([
    prisma.case.count({ where: { ownerId: user.id } }),
    prisma.case.count({ where: { ownerId: user.id, status: "قيد النظر" } }),
    prisma.case.count({ where: { ownerId: user.id, status: "مكتملة" } }),
    prisma.client.count({ where: { ownerId: user.id } }),
    prisma.appointment.count({ where: { ownerId: user.id } }),
    prisma.appointment.count({
      where: {
        ownerId: user.id,
        status: "قادمة",
        date: { gte: new Date() },
      },
    }),
    prisma.note.count({ where: { ownerId: user.id } }),
  ]);

  return NextResponse.json({
    totalCases,
    activeCases,
    completedCases,
    totalClients,
    totalAppointments,
    upcomingAppointments,
    totalNotes,
    winRate: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0,
  });
}
