import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const homeDeno = path.join(process.env.HOME ?? "", ".deno", "bin", "deno");
const denoBin = process.env.DENO ?? (existsSync(homeDeno) ? homeDeno : "deno");

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const server = await createServer({
  configFile: path.join(packageRoot, "vite.config.ts"),
  root: packageRoot,
});
await server.listen();
const address = "http://127.0.0.1:1422";
console.log(`Deno desktop renderer: ${address}`);

const backend = process.env.LAPIS_DENO_BACKEND?.trim();
const deno = spawn(
  denoBin,
  [
    "desktop",
    "--hmr",
    "--inspect=127.0.0.1:9229",
    "--no-check",
    "--no-npm",
    "--exclude",
    "node_modules",
    "--exclude",
    "dist",
    "--exclude",
    "src",
    ...(backend === "cef" || backend === "webview" ? ["--backend", backend] : []),
    "-A",
    "src-deno/main.ts",
  ],
  {
    cwd: packageRoot,
    env: {
      ...process.env,
      LAPIS_DESKTOP_DEV_SERVER_URL: address.replace(/\/$/u, ""),
    },
    stdio: "inherit",
  },
);

const shutdown = async () => {
  deno.kill("SIGTERM");
  await server.close();
};

process.on("SIGINT", () => {
  void shutdown().then(() => process.exit(130));
});
process.on("SIGTERM", () => {
  void shutdown().then(() => process.exit(143));
});

deno.on("exit", (code) => {
  void server.close().then(() => process.exit(code ?? 0));
});
