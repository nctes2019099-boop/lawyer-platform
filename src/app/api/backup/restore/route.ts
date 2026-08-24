import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const backupSchema = z.object({
  version: z.number().optional(),
  exportedAt: z.string().optional(),
  data: z.object({
    clients: z.array(z.any()).default([]),
    cases: z.array(z.any()).default([]),
    appointments: z.array(z.any()).default([]),
    notes: z.array(z.any()).default([]),
    documents: z.array(z.any()).default([]),
    petitions: z.array(z.any()).default([]),
    transactions: z.array(z.any()).default([]),
    tasks: z.array(z.any()).default([]),
    timeEntries: z.array(z.any()).default([]),
    reminders: z.array(z.any()).default([]),
  }).passthrough(),
});

function strip(obj: Record<string, unknown>) {
  // Drop fields that should not be re-imported (ownership/audit timestamps).
  const {
    id: _id, ownerId: _o, owner: _ow, createdAt: _c, updatedAt: _u, ...rest
  } = obj;
  return rest;
}

/**
 * Restore data from a backup JSON. This is additive (does not delete existing
 * records) and re-parents everything to the current user.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let parsed: z.infer<typeof backupSchema>;
  try {
    parsed = backupSchema.parse(await req.json());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.errors[0].message : "Invalid backup file" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const counts: Record<string, number> = {};

  // 1) Clients
  counts.clients = (await Promise.all(
    d.clients.map((c) => prisma.client.create({ data: { ...strip(c), ownerId: user.id } as any }))
  )).length;

  // 2) Cases (re-link only clients that were imported if needed; keep null)
  counts.cases = (await Promise.all(
    d.cases.map((c) =>
      prisma.case.create({ data: { ...strip(c), clientId: null, ownerId: user.id } as any })
    )
  )).length;

  // 3) Remaining simple entities
  counts.appointments = (await Promise.all(
    d.appointments.map((x) => prisma.appointment.create({ data: { ...strip(x), ownerId: user.id, caseId: null, clientId: null } as any }))
  )).length;

  counts.notes = (await Promise.all(
    d.notes.map((x) => prisma.note.create({ data: { ...strip(x), ownerId: user.id } as any }))
  )).length;

  counts.documents = (await Promise.all(
    d.documents.map((x) => prisma.document.create({ data: { ...strip(x), ownerId: user.id, caseId: null } as any }))
  )).length;

  counts.petitions = (await Promise.all(
    d.petitions.map((x) => prisma.petition.create({ data: { ...strip(x), ownerId: user.id, caseId: null } as any }))
  )).length;

  counts.transactions = (await Promise.all(
    d.transactions.map((x) =>
      prisma.transaction.create({
        data: { ...strip(x), ownerId: user.id, caseId: null, clientId: null, date: x.date ? new Date(x.date) : new Date() } as any,
      })
    )
  )).length;

  counts.tasks = (await Promise.all(
    d.tasks.map((x) =>
      prisma.task.create({
        data: {
          ...strip(x), ownerId: user.id, caseId: null,
          dueDate: x.dueDate ? new Date(x.dueDate) : null,
          completedAt: x.completedAt ? new Date(x.completedAt) : null,
        } as any,
      })
    )
  )).length;

  counts.timeEntries = (await Promise.all(
    d.timeEntries.map((x) =>
      prisma.timeEntry.create({
        data: {
          ...strip(x), ownerId: user.id, caseId: null,
          startTime: x.startTime ? new Date(x.startTime) : new Date(),
          endTime: x.endTime ? new Date(x.endTime) : null,
        } as any,
      })
    )
  )).length;

  counts.reminders = (await Promise.all(
    d.reminders.map((x) =>
      prisma.reminder.create({
        data: { ...strip(x), ownerId: user.id, dueAt: x.dueAt ? new Date(x.dueAt) : new Date() } as any,
      })
    )
  )).length;

  return NextResponse.json({ success: true, counts });
}
