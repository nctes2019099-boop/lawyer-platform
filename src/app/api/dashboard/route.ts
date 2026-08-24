import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * Aggregated dashboard data in a single round-trip (replaces N parallel
 * fetches on the client).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCases,
    activeCases,
    completedCases,
    totalClients,
    totalAppointments,
    upcomingAppointments,
    totalNotes,
    pendingTasks,
    overdueTasks,
    recentActivities,
    upcomingSessions,
    pendingReminders,
    monthIncome,
    monthExpenses,
  ] = await Promise.all([
    prisma.case.count({ where: { ownerId: user.id } }),
    prisma.case.count({ where: { ownerId: user.id, status: "قيد النظر" } }),
    prisma.case.count({ where: { ownerId: user.id, status: "مكتملة" } }),
    prisma.client.count({ where: { ownerId: user.id } }),
    prisma.appointment.count({ where: { ownerId: user.id } }),
    prisma.appointment.count({
      where: { ownerId: user.id, status: "قادمة", date: { gte: now } },
    }),
    prisma.note.count({ where: { ownerId: user.id } }),
    prisma.task.count({ where: { ownerId: user.id, status: { not: "completed" } } }),
    prisma.task.count({
      where: {
        ownerId: user.id,
        status: { not: "completed" },
        dueDate: { lt: now },
      },
    }),
    prisma.activity.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.session.findMany({
      where: { case: { ownerId: user.id }, date: { gte: now } },
      include: { case: { select: { title: true, caseNumber: true } } },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.reminder.findMany({
      where: { ownerId: user.id, status: "pending", dueAt: { gte: now } },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    prisma.transaction.aggregate({
      where: { ownerId: user.id, type: "income", date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ownerId: user.id, type: "expense", date: { gte: monthStart } },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    counts: {
      totalCases,
      activeCases,
      completedCases,
      totalClients,
      totalAppointments,
      upcomingAppointments,
      totalNotes,
      pendingTasks,
      overdueTasks,
    },
    winRate: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0,
    recentActivities,
    upcomingSessions,
    pendingReminders,
    finance: {
      monthIncome: monthIncome._sum.amount || 0,
      monthExpenses: Math.abs(monthExpenses._sum.amount || 0),
      net:
        (monthIncome._sum.amount || 0) - Math.abs(monthExpenses._sum.amount || 0),
    },
    weekStart,
  });
}
