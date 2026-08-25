import { PrismaClient } from "@prisma/client/wasm";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import path from "node:path";

// In restricted/offline environments the native Prisma query engine cannot be
// downloaded, so we use the WASM engine (bundled with the generated client)
// together with the libsql driver adapter for SQLite. Works in the Node server.
function resolveDbFile(): string {
  const raw = process.env.DATABASE_URL || "file:./dev.db";
  if (raw.startsWith("file:./")) {
    return path.join(process.cwd(), "prisma", raw.slice(7));
  }
  if (raw.startsWith("file:")) return raw.slice(5);
  return raw;
}

const dbFile = resolveDbFile();
// The WASM engine reads DATABASE_URL to know the provider datasource; point it
// at the absolute file path so libsql and Prisma agree on the database location.
process.env.DATABASE_URL = `file:${dbFile}`;

function createPrisma() {
  const libsql = createClient({ url: `file:${dbFile}` });
  const adapter = new PrismaLibSql({ url: `file:${dbFile}` });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
