/**
 * Dev.mjs — starts the Vite renderer dev server and then launches Electron.
 *
 * Usage: node scripts/dev.mjs
 */

import { spawn, spawnSync } from "node:child_process";
import { createServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = path.resolve(__dirname, "..");
const repoScopedDevId = crypto
  .createHash("sha1")
  .update(pkg)
  .digest("hex")
  .slice(0, 12);

// Ensure dist-electron is treated as CommonJS so the tsc output (which uses
// `require` / `exports`) runs correctly even though the package root has
// "type": "module".
function ensureDistElectronCjs() {
  const distDir = path.join(pkg, "dist-electron");
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(
    path.join(distDir, "package.json"),
    JSON.stringify({ type: "commonjs" }, null, 2) + "\n",
  );
}

function createLineForwarder(stream, writer, onLine) {
  let buffer = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    writer.write(chunk);
    buffer += chunk;
    const lines = buffer.split(/\r?\n/u);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      onLine(line);
    }
  });
  stream.on("end", () => {
    if (buffer) {
      onLine(buffer);
    }
  });
}

function getDefaultDevUserDataDir() {
  return path.join(
    os.tmpdir(),
    "lapis-notes",
    `desktop-dev-${repoScopedDevId}`,
  );
}

function getRemoteDebuggingArgs() {
  const port = process.env.LAPIS_DESKTOP_REMOTE_DEBUGGING_PORT?.trim();
  if (!port) {
    return [];
  }

  if (!/^\d+$/u.test(port)) {
    throw new Error(
      "LAPIS_DESKTOP_REMOTE_DEBUGGING_PORT must be a numeric port",
    );
  }

  return [`--remote-debugging-port=${port}`];
}

async function main() {
  // 0. Create dist-electron/package.json to mark it as CommonJS.
  ensureDistElectronCjs();

  // 1. Start the Vite renderer dev server.
  const server = await createServer({
    configFile: path.join(pkg, "vite.config.ts"),
    root: pkg,
  });
  await server.listen();
  const port = server.config.server.port ?? 1421;
  const devServerUrl = `http://localhost:${port}`;
  console.log(`[electron-dev] Vite renderer listening on ${devServerUrl}`);

  const electronBin = path.join(
    pkg,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "electron.cmd" : "electron",
  );

  let electron = null;
  let shuttingDown = false;
  let hasStartedElectron = false;
  let restartChain = Promise.resolve();

  function createElectronEnv() {
    const env = {
      ...process.env,
      NODE_ENV: "development",
      LAPIS_DESKTOP_DEV_SERVER_URL: devServerUrl,
    };
    if (!env.LAPIS_DESKTOP_USER_DATA_DIR?.trim()) {
      env.LAPIS_DESKTOP_USER_DATA_DIR = getDefaultDevUserDataDir();
    }
    delete env.ELECTRON_RUN_AS_NODE;
    return env;
  }

  function startElectron() {
    if (electron || shuttingDown) {
      return;
    }

    ensureDistElectronCjs();
    electron = spawn(
      electronBin,
      [...getRemoteDebuggingArgs(), path.join(pkg, "dist-electron/main.js")],
      {
        cwd: pkg,
        stdio: "inherit",
        env: createElectronEnv(),
      },
    );

    const currentElectron = electron;
    currentElectron.on("close", (code, signal) => {
      if (electron === currentElectron) {
        electron = null;
      }

      if (shuttingDown) {
        return;
      }

      if (signal !== "SIGTERM" && code && code !== 0) {
        console.error(`[electron-dev] Electron exited with code ${code}`);
      }
      if (signal !== "SIGTERM") {
        void cleanup(code ?? 0);
      }
    });
  }

  async function stopElectron() {
    if (!electron) {
      return;
    }

    const currentElectron = electron;
    await new Promise((resolve) => {
      currentElectron.once("close", resolve);
      currentElectron.kill("SIGTERM");
    });
  }

  function queueElectronRestart() {
    restartChain = restartChain.then(async () => {
      if (shuttingDown) {
        return;
      }

      if (!hasStartedElectron) {
        hasStartedElectron = true;
        startElectron();
        return;
      }

      await stopElectron();
      startElectron();
    });
  }

  // 2. Compile the Electron main process + preload.
  const tsc = spawn(
    "pnpm",
    [
      "exec",
      "tsc",
      "-p",
      "tsconfig.main.json",
      "--watch",
      "--preserveWatchOutput",
      "--pretty",
      "false",
    ],
    { cwd: pkg, stdio: ["ignore", "pipe", "pipe"] },
  );

  const handleTscLine = (line) => {
    if (/Found 0 errors?\. Watching for file changes\./u.test(line)) {
      const bundle = spawnSync(
        process.execPath,
        [path.join(pkg, "scripts/bundle-language-sidecar.mjs")],
        { cwd: pkg, stdio: "inherit", env: process.env },
      );
      if (bundle.status !== 0) {
        console.error("[electron-dev] language sidecar bundle failed");
        return;
      }
      queueElectronRestart();
    }
  };

  createLineForwarder(tsc.stdout, process.stdout, handleTscLine);
  createLineForwarder(tsc.stderr, process.stderr, handleTscLine);

  const cleanup = async (exitCode = 0) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    await stopElectron();
    tsc.kill();
    await server.close().catch(() => {});
    process.exit(exitCode);
  };

  tsc.on("close", async (code) => {
    if (!shuttingDown) {
      await cleanup(code ?? 0);
    }
  });

  process.on("SIGINT", () => {
    void cleanup(0);
  });
  process.on("SIGTERM", () => {
    void cleanup(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
