import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { rateLimitIP, getClientIP } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Transcribe an audio note to text.
 *
 * In production, configure a speech-to-text provider via environment variables
 * (e.g. Whisper-compatible endpoint). This endpoint accepts multipart/form-data
 * with an `audio` field and returns `{ text }`. If no provider is configured it
 * returns a clear error so the client can fall back to the Web Speech API.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimitIP(getClientIP(req), 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "audio file is required" }, { status: 400 });
  }

  const endpoint = process.env.STT_ENDPOINT;
  const apiKey = process.env.STT_API_KEY;
  if (!endpoint) {
    return NextResponse.json(
      { error: "خدمة التحويل غير مهيأة. استخدم الإدخال الصوتي المباشر في المتصفح." },
      { status: 503 }
    );
  }

  try {
    const upstream = new FormData();
    upstream.append("file", file, file.name || "audio.webm");
    if (form?.get("language")) upstream.append("language", String(form.get("language")));

    const res = await fetch(endpoint, {
      method: "POST",
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      body: upstream,
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
    }
    const data = (await res.json().catch(() => ({}))) as { text?: string };
    return NextResponse.json({ text: data.text || "" });
  } catch {
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }
}
