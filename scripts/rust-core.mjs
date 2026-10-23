import { spawn } from "node:child_process";
import { statfs } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
if (args[0] === "--") args.shift();
if (!new Set(["build", "check", "test", "clippy", "fmt", "tree"]).has(args[0]))
  throw new Error(
    "Use pnpm rust:core -- build|check|test|clippy|fmt|tree [arguments]",
  );
if (
  process.env.CARGO_TARGET_DIR ||
  args.some((arg) => /^(?:--target-dir|--manifest-path|--config)/u.test(arg))
)
  throw new Error("Use the checkout-owned core target without Cargo overrides");
if (!new Set(["fmt", "tree"]).has(args[0])) {
  const disk = await statfs(root);
  if ((disk.bavail * disk.bsize) / 1024 ** 3 < 30)
    throw new Error("Native builds require 30 GiB free; no cache was removed");
}
const child = spawn("cargo", args, { cwd: root, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
