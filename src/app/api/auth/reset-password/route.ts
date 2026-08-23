import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({ token: z.string(), password: z.string().min(6) });

export async function POST(req: NextRequest) {
  try {
    const { password } = schema.parse(await req.json());
    const hashed = await bcrypt.hash(password, 10);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
