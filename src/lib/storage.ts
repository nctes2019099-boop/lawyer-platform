import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Resolve the on-disk directory used for user-uploaded files.
 *
 * In production set UPLOAD_DIR to a persistent, backed-up volume. In dev it
 * defaults to `.data/uploads` inside the project (kept out of git and the
 * standalone bundle, so uploads are never shipped in the build).
 */
export function uploadDir(): string {
  const dir = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve(process.cwd(), ".data", "uploads");
  return dir;
}

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
};

export interface SavedFile {
  fileName: string; // unique stored filename
  originalName: string;
  fileUrl: string; // public path the app uses to fetch the file
  fileSize: number; // bytes
  fileExt: string;
  mime: string;
}

/**
 * Validate and persist an uploaded file to the upload directory.
 * Returns metadata suitable for a Document record. Throws on rejection.
 */
export async function saveUploadedFile(file: File, ownerHint: string): Promise<SavedFile> {
  if (!file || file.size === 0) throw new Error("الملف فارغ");

  const maxBytes = Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`حجم الملف يتجاوز الحد الأقصى (${process.env.MAX_UPLOAD_MB || 20} ميغابايت)`);
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    throw new Error("نوع الملف غير مسموح. الأنواع: PDF، صور، Word، Excel، نص");
  }

  const ext = EXT_BY_MIME[mime] || guessExt(file.name);
  const safeOwner = ownerHint.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "user";
  const id = crypto.randomBytes(8).toString("hex");
  const stored = `${Date.now()}-${safeOwner}-${id}.${ext}`;

  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, stored), bytes);

  return {
    fileName: stored,
    originalName: file.name,
    fileUrl: `/api/files/${stored}`,
    fileSize: bytes.length,
    fileExt: ext,
    mime,
  };
}

function guessExt(name: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || "");
  return m ? m[1].toLowerCase() : "bin";
}

/** Resolve the absolute on-disk path for a stored filename, preventing traversal. */
export function resolveStored(stored: string): string {
  const base = uploadDir();
  const cleaned = path.basename(stored); // strip any path segments
  if (cleaned !== stored) throw new Error("Invalid file name");
  return path.join(base, cleaned);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
