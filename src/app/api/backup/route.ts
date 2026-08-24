import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Export all of the current user's data as a single JSON document (backup).
 * Sensitive fields (password, reset tokens) are never included.
 */
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    profile,
    cases,
    clients,
    appointments,
    notes,
    documents,
    petitions,
    transactions,
    tasks,
    timeEntries,
    reminders,
    activities,
    notifications,
    auditLogs,
    subscription,
    payments,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, name: true, phone: true, governorate: true,
        barMember: true, avatar: true, role: true, isAdmin: true, createdAt: true,
      },
    }),
    prisma.case.findMany({ where: { ownerId: user.id } }),
    prisma.client.findMany({ where: { ownerId: user.id } }),
    prisma.appointment.findMany({ where: { ownerId: user.id } }),
    prisma.note.findMany({ where: { ownerId: user.id } }),
    prisma.document.findMany({ where: { ownerId: user.id } }),
    prisma.petition.findMany({ where: { ownerId: user.id } }),
    prisma.transaction.findMany({ where: { ownerId: user.id } }),
    prisma.task.findMany({ where: { ownerId: user.id } }),
    prisma.timeEntry.findMany({ where: { ownerId: user.id } }),
    prisma.reminder.findMany({ where: { ownerId: user.id } }),
    prisma.activity.findMany({ where: { ownerId: user.id } }),
    prisma.notification.findMany({ where: { ownerId: user.id } }),
    prisma.auditLog.findMany({ where: { userId: user.id } }),
    prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    }),
    prisma.payment.findMany({ where: { userId: user.id } }),
  ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    data: {
      cases, clients, appointments, notes, documents, petitions,
      transactions, tasks, timeEntries, reminders, activities,
      notifications, auditLogs, subscription, payments,
    },
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mizan-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
