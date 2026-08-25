import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { saveUploadedFile } from "@/lib/storage";
import { z } from "zod";

import { userOwnsResources } from "@/lib/authorization";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.string().default("وثيقة"),
  fileUrl: z.string().optional().or(z.literal("")),
  fileSize: z.string().optional(),
  fileExt: z.string().optional(),
  caseId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 60, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const where: Record<string, unknown> = { ownerId: user.id };
  if (type) where.type = type;

  const documents = await prisma.document.findMany({
    where,
    include: { case: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 20, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let payload: z.infer<typeof createSchema>;
    let fileMeta: { fileUrl: string; fileSize: string; fileExt: string } | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      payload = {
        title: String(form.get("title") || ""),
        type: (form.get("type") as string) || "وثيقة",
        caseId: form.get("caseId") ? String(form.get("caseId")) : undefined,
      };
      if (file instanceof File && file.size > 0) {
        const saved = await saveUploadedFile(file, user.id);
        fileMeta = {
          fileUrl: saved.fileUrl,
          fileSize: String(saved.fileSize),
          fileExt: saved.fileExt,
        };
      }
    } else {
      payload = createSchema.parse(await req.json());
    }

    const data = createSchema.parse(payload);

    if (!(await userOwnsResources(user.id, { caseId: data.caseId }))) {
      return NextResponse.json({ error: "Invalid case" }, { status: 400 });
    }

    const doc = await prisma.document.create({
      data: {
        ...data,
        ...(fileMeta || {}),
        ownerId: user.id,
      },
    });
    return NextResponse.json(doc);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
