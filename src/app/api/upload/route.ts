import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { saveUploadedFile } from "@/lib/storage";

// Generic authenticated file upload. Accepts multipart/form-data with a "file"
// field. Returns the stored file metadata (fileUrl, fileSize, fileExt, name).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(user.id, 20, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }
    const saved = await saveUploadedFile(file, user.id);
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
