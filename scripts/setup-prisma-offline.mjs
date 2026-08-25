// Generates the Prisma client in environments where the native engine binaries
// cannot be downloaded from binaries.prisma.sh (offline/restricted sandboxes).
//
// It points Prisma at the WASM schema engine bundled with the `prisma` package
// and supplies dummy paths for the native query engines so the CLI skips those
// downloads. The real query engine is the WASM one bundled with the generated
// client; scripts/patch-prisma-wasm.mjs then wires it to load from disk.
//
// In a normal online environment `npx prisma generate` works directly and this
// script is a harmless fallback.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

const schemaEngine = path.join(root, "node_modules", "prisma", "build", "schema_engine_bg.wasm");
const dummy = process.platform === "win32" ? "NUL" : "/dev/null";

const env = {
  ...process.env,
  ...(existsSync(schemaEngine) ? { PRISMA_SCHEMA_ENGINE_BINARY: schemaEngine } : {}),
  // Dummy targets prevent the CLI from trying to download native query engines.
  PRISMA_QUERY_ENGINE_LIBRARY: dummy,
  PRISMA_QUERY_ENGINE_BINARY: dummy,
};

const args = ["prisma", "generate"];
const res = spawnSync("npx", args, { cwd: root, env, stdio: "inherit", shell: true });
if (res.status !== 0) {
  console.warn("[setup-prisma-offline] prisma generate failed; continuing (build may still work if client is cached).");
}

// Apply the WASM loader patch and ESM shim.
const patch = spawnSync("node", [path.join(here, "patch-prisma-wasm.mjs")], { cwd: root, stdio: "inherit" });
process.exit(patch.status ?? 0);
