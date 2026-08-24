import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Lightweight liveness/readiness probe used by Docker / load balancers.
export async function GET() {
  try {
    // Cheap DB round-trip; confirms the database is reachable.
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", time: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { status: "error", error: e instanceof Error ? e.message : "db unavailable" },
      { status: 503 }
    );
  }
}
