// Patches the generated Prisma WASM client so it loads the query-engine WASM
// directly from disk (compiled via WebAssembly.compile) instead of relying on
// the `#wasm-engine-loader` subpath import. That import is not always resolved
// correctly by bundlers (e.g. Turbopack) and in restricted/offline sandboxes
// where the native engine binary can't be downloaded from binaries.prisma.sh.
//
// Safe to run repeatedly (idempotent). Run after `prisma generate`.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const wasmClient = path.join(here, "..", "node_modules", ".prisma", "client", "wasm.js");

if (!existsSync(wasmClient)) {
  console.log("[patch-prisma-wasm] .prisma/client/wasm.js not found — run `prisma generate` first.");
  process.exit(0);
}

let src = readFileSync(wasmClient, "utf8");

const marker = "/* @mizan/wasm-patched */";
if (src.includes(marker)) {
  console.log("[patch-prisma-wasm] already patched.");
  process.exit(0);
}

const original = `  getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine
  }`;

const replacement = `  getQueryEngineWasmModule: async () => {
    ${marker}
    const fs = require('node:fs');
    const p = require('node:path');
    const here = p.dirname(__filename);
    const bytes = fs.readFileSync(p.join(here, 'query_engine_bg.wasm'));
    return WebAssembly.compile(bytes);
  }`;

if (!src.includes(original)) {
  console.warn("[patch-prisma-wasm] expected pattern not found — was Prisma upgraded? Skipping.");
  process.exit(0);
}

src = src.replace(original, replacement);
writeFileSync(wasmClient, src, "utf8");
console.log("[patch-prisma-wasm] patched .prisma/client/wasm.js to load engine WASM from disk.");
