// Builds the static `out/` bundle used by Capacitor on mobile.
// Server API routes require Prisma/a database and cannot run in a static
// export, so they are temporarily moved out of src/app during the static build
// and restored immediately afterwards (even on failure/abort).
import { spawnSync } from "node:child_process";
import { existsSync, renameSync, rmSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "src/app/api");
// Move completely outside src/app so Next does not pick it up as a route group.
const bakDir = path.join(root, ".build-cache/api-disabled");
const outDir = path.join(root, "out");

function move(from, to) {
  if (existsSync(from) && !existsSync(to)) renameSync(from, to);
}
function restore() {
  move(bakDir, apiDir);
}

const cleanupHandlers = ["exit", "SIGINT", "SIGTERM"];
for (const ev of cleanupHandlers) process.on(ev, () => restore());

try {
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(path.dirname(bakDir), { recursive: true });
  move(apiDir, bakDir);

  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "build"],
    {
      stdio: "inherit",
      env: { ...process.env, BUILD_MODE: "static" },
    }
  );

  restore();
  process.exit(result.status ?? 1);
} catch (err) {
  restore();
  console.error(err);
  process.exit(1);
}
