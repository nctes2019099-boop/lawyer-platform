import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * Unified calendar feed: appointments + sessions + task due dates + reminders
 * in a requested month. ?month=YYYY-MM
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  let start: Date;
  let end: Date;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    start = new Date(y, m - 1, 1);
    end = new Date(y, m, 1);
  } else {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  const [appointments, sessions, tasks, reminders] = await Promise.all([
    prisma.appointment.findMany({
      where: { ownerId: user.id, date: { gte: start, lt: end } },
      select: { id: true, title: true, date: true, type: true, status: true, caseId: true, clientId: true },
      orderBy: { date: "asc" },
    }),
    prisma.session.findMany({
      where: { case: { ownerId: user.id }, date: { gte: start, lt: end } },
      include: { case: { select: { id: true, title: true, caseNumber: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.task.findMany({
      where: { ownerId: user.id, dueDate: { gte: start, lt: end } },
      select: { id: true, title: true, dueDate: true, status: true, priority: true, caseId: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.reminder.findMany({
      where: { ownerId: user.id, dueAt: { gte: start, lt: end } },
      select: { id: true, title: true, dueAt: true, status: true, type: true },
      orderBy: { dueAt: "asc" },
    }),
  ]);

  type Item = {
    id: string;
    kind: "appointment" | "session" | "task" | "reminder";
    title: string;
    date: string;
    meta?: Record<string, unknown>;
  };

  const items: Item[] = [
    ...appointments.map((a: { id: string; title: string; date: Date; type: string | null; status: string | null; caseId: string | null; clientId: string | null }) => ({
      id: a.id,
      kind: "appointment" as const,
      title: a.title,
      date: a.date.toISOString(),
      meta: { type: a.type, status: a.status, caseId: a.caseId, clientId: a.clientId },
    })),
    ...sessions.map((s: { id: string; date: Date; status: string | null; location: string | null; case?: { title?: string | null; caseNumber?: string | null } | null }) => ({
      id: s.id,
      kind: "session" as const,
      title: `جلسة: ${s.case?.title || ""}`,
      date: s.date.toISOString(),
      meta: { caseNumber: s.case?.caseNumber, location: s.location, status: s.status },
    })),
    ...tasks.map((t: { id: string; title: string; dueDate: Date | null; status: string | null; priority: string | null; caseId: string | null }) => ({
      id: t.id,
      kind: "task" as const,
      title: t.title,
      date: (t.dueDate as Date).toISOString(),
      meta: { status: t.status, priority: t.priority, caseId: t.caseId },
    })),
    ...reminders.map((r: { id: string; title: string; dueAt: Date; type: string | null; status: string | null }) => ({
      id: r.id,
      kind: "reminder" as const,
      title: r.title,
      date: r.dueAt.toISOString(),
      meta: { type: r.type, status: r.status },
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  // group by YYYY-MM-DD
  const byDate: Record<string, Item[]> = {};
  for (const it of items) {
    const key = it.date.slice(0, 10);
    (byDate[key] ||= []).push(it);
  }

  return NextResponse.json({ month: month || null, items, byDate });
}
