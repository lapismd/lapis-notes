import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import {
  createDenoDesktopDevArgs,
  ensureDesktopDevSiblingLinks,
} from "./dev-command.mjs";

const homeDeno = path.join(process.env.HOME ?? "", ".deno", "bin", "deno");
const denoBin = process.env.DENO ?? (existsSync(homeDeno) ? homeDeno : "deno");

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await ensureDesktopDevSiblingLinks(packageRoot);

const server = await createServer({
  configFile: path.join(packageRoot, "vite.config.ts"),
  root: packageRoot,
});
await server.listen();
const address = "http://127.0.0.1:1422";
console.log(`Deno desktop renderer: ${address}`);

const backend = process.env.LAPIS_DENO_BACKEND?.trim();
if (backend === "cef") {
  console.log(
    "Deno desktop backend: cef. Use View → Toggle Developer Tools for the Chromium DevTools window.",
  );
} else if (backend && backend !== "webview") {
  console.warn(
    `Ignoring unsupported LAPIS_DENO_BACKEND=${JSON.stringify(backend)}; using deno.json default backend.`,
  );
}
const deno = spawn(
  denoBin,
  createDenoDesktopDevArgs(backend),
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
