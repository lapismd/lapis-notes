import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { isCiDesktopSmoke } from "./smoke-mode";

const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const builtMainPath = path.join(packageDir, "dist-electron/main.js");

function ensureDistElectronCjs(): void {
  const distDir = path.join(packageDir, "dist-electron");
  mkdirSync(distDir, { recursive: true });
  writeFileSync(
    path.join(distDir, "package.json"),
    `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`,
  );
}

function runPackageCommand(args: string[], label: string): void {
  const result = spawnSync("pnpm", args, {
    cwd: packageDir,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`desktop-electron smoke ${label} failed`);
  }
}

export default async function globalSetup(): Promise<void> {
  if (isCiDesktopSmoke()) {
    console.log("==> desktop smoke: production build (CI)");
    runPackageCommand(
      [
        "exec",
        "turbo",
        "run",
        "build",
        "--filter",
        "@lapis-notes/desktop-electron",
        "--concurrency=1",
      ],
      "production build",
    );
  } else {
    console.log("==> desktop smoke: main/preload compile (local dev renderer)");
    ensureDistElectronCjs();
    runPackageCommand(
      ["exec", "tsc", "-p", "tsconfig.main.json"],
      "main process compile",
    );
    runPackageCommand(
      ["node", "scripts/bundle-language-sidecar.mjs"],
      "language sidecar bundle",
    );
  }

  if (!existsSync(builtMainPath)) {
    throw new Error(`desktop-electron build missing: ${builtMainPath}`);
  }
}
