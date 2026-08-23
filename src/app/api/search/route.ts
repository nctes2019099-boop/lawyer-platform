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

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type");

  if (!q || q.length < 2) {
    return NextResponse.json({ cases: [], clients: [], laws: [], appointments: [], notes: [] });
  }

  const results: Record<string, unknown[]> = {
    cases: [],
    clients: [],
    laws: [],
    appointments: [],
    notes: [],
  };

  if (!type || type === "cases") {
    results.cases = await prisma.case.findMany({
      where: {
        ownerId: user.id,
        OR: [
          { title: { contains: q } },
          { caseNumber: { contains: q } },
        ],
      },
      take: 5,
    });
  }

  if (!type || type === "clients") {
    results.clients = await prisma.client.findMany({
      where: {
        ownerId: user.id,
        OR: [
          { name: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      take: 5,
    });
  }

  if (!type || type === "laws") {
    results.laws = await prisma.law.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      take: 5,
    });
  }

  if (!type || type === "appointments") {
    results.appointments = await prisma.appointment.findMany({
      where: {
        ownerId: user.id,
        title: { contains: q },
      },
      take: 5,
    });
  }

  if (!type || type === "notes") {
    results.notes = await prisma.note.findMany({
      where: {
        ownerId: user.id,
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      take: 5,
    });
  }

  return NextResponse.json(results);
}
