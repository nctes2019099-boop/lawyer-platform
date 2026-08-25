// Tiny cross-platform env setter so npm scripts work on Windows without cross-env.
// Usage: node scripts/set-env.mjs KEY=VALUE KEY2=VALUE2 -- command args...
import { spawn } from "node:child_process";
import { platform } from "node:os";

const args = process.argv.slice(2);
const sepIdx = args.indexOf("--");
if (sepIdx === -1) {
  console.error("Usage: set-env.mjs K=V ... -- command [args...]");
  process.exit(1);
}
const envPairs = args.slice(0, sepIdx);
const cmdArgs = args.slice(sepIdx + 1);
const env = { ...process.env };
for (const pair of envPairs) {
  const eq = pair.indexOf("=");
  if (eq > 0) env[pair.slice(0, eq)] = pair.slice(eq + 1);
}
const [cmd, ...rest] = cmdArgs;
const isWin = platform() === "win32";
const child = spawn(cmd, rest, { stdio: "inherit", shell: isWin, env });
child.on("exit", (code) => process.exit(code ?? 0));
