import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { resolveStored } from "@/lib/storage";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain; charset=utf-8",
};

// Serve an uploaded file. Read access is gated by an auth cookie so files are
// never world-readable; add ?download=1 to force a Content-Disposition attachment.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { getCurrentUser } = await import("@/lib/session");
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { name } = await params;
    try {
      const filePath = resolveStored(name);
      const data = await fs.readFile(filePath);
      const ext = name.split(".").pop()?.toLowerCase() || "";
      const isSvg = ext === "svg";
      // SVG must never render inline in the app origin (stored XSS).
      const mime = isSvg ? "application/octet-stream" : MIME[ext] || "application/octet-stream";
      const forceDownload = isSvg || new URL(req.url).searchParams.get("download") === "1";

      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Content-Length": String(data.length),
          "Cache-Control": "private, max-age=3600",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox",
          ...(forceDownload
            ? { "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"` }
            : {}),
        },
      });
    } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
