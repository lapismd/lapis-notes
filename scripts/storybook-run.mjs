#!/usr/bin/env node
/**
 * Own one Storybook process per checkout and port, and restart it when Visual
 * Delta manager/shared/node sources require a new manager bundle.
 */
import { spawn } from "node:child_process";
import {
  watch,
  readFileSync,
  existsSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import {
  acquireSupervisorOwnership,
  cleanupCheckoutListeners,
  partitionForeignListeners,
  releaseSupervisorOwnership,
  resolveStorybookLane,
  storybookStartupMode,
  stopStorybookLane,
  terminateProcessTrees,
  updateSupervisorOwnership,
} from "./storybook-process.mjs";

const lane = resolveStorybookLane();
const { root, port, visualPort, serverPorts } = lane;
const require = createRequire(import.meta.url);
const visualDeltaPackageRoot = realpathSync(
  path.dirname(
    require.resolve("@lapismd/storybook-addon-visual-delta/package.json"),
  ),
);
const RESTART_DEBOUNCE_MS = 500;
const STARTUP_GRACE_MS = 10_000;

if (storybookStartupMode() === "replace") {
  await stopStorybookLane(lane);
}

const ownership = acquireSupervisorOwnership(lane);
if (!ownership.acquired) {
  const child = ownership.owner.childPid
    ? ` (Storybook ${ownership.owner.childPid})`
    : "";
  console.log(
    `[storybook-run] already running for ${root} :${port} as supervisor ${ownership.owner.supervisorPid}${child}`,
  );
  process.exit(0);
}

const foreignListeners = await cleanupCheckoutListeners(lane, serverPorts);
const { storybookPort: storybookPortConflicts, auxiliaryPorts } =
  partitionForeignListeners(lane, foreignListeners);
if (storybookPortConflicts.length > 0) {
  releaseSupervisorOwnership(lane);
  const details = storybookPortConflicts
    .map(
      ({ port: listenerPort, pid, cwd }) =>
        `:${listenerPort} pid ${pid}${cwd ? ` (${cwd})` : ""}`,
    )
    .join(", ");
  console.error(
    `[storybook-run] refusing to replace another checkout's listener: ${details}`,
  );
  process.exit(1);
}
for (const listener of auxiliaryPorts) {
  console.warn(
    `[storybook-run] retained foreign auxiliary listener ${listener.pid} on :${listener.port}${listener.cwd ? ` (${listener.cwd})` : ""}`,
  );
}

/**
 * Paths whose edits require a new Storybook manager/middleware bundle.
 * Preview-only source remains under Vite HMR.
 */
const restartWatchPaths = [
  // npm package source (useful for pnpm link / editable installs).
  path.join(visualDeltaPackageRoot, "src/manager.tsx"),
  path.join(visualDeltaPackageRoot, "src/manager"),
  path.join(visualDeltaPackageRoot, "src/panel"),
  path.join(visualDeltaPackageRoot, "src/constants.ts"),
  path.join(visualDeltaPackageRoot, "src/types.ts"),
  path.join(visualDeltaPackageRoot, "src/visual-diff-sidecar.ts"),
  path.join(visualDeltaPackageRoot, "src/shared"),
  path.join(visualDeltaPackageRoot, "src/preset.ts"),
  path.join(visualDeltaPackageRoot, "src/node"),
  path.join(root, ".storybook/main.ts"),
  path.join(root, ".storybook/manager.ts"),
];

const contentHashes = new Map();

function fileHash(filePath) {
  try {
    if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;
    return createHash("sha1").update(readFileSync(filePath)).digest("hex");
  } catch {
    return null;
  }
}

function seedHashes(dirOrFile) {
  try {
    const stats = statSync(dirOrFile);
    if (stats.isFile()) {
      const hash = fileHash(dirOrFile);
      if (hash) contentHashes.set(dirOrFile, hash);
      return;
    }
    if (stats.isDirectory()) {
      for (const entry of readdirSync(dirOrFile, { withFileTypes: true })) {
        seedHashes(path.join(dirOrFile, entry.name));
      }
    }
  } catch {
    /* path may not exist in portable hosts */
  }
}

function contentChanged(filePath) {
  const next = fileHash(filePath);
  if (next === null) return false;
  const previous = contentHashes.get(filePath);
  if (previous === next) return false;
  contentHashes.set(filePath, next);
  return previous !== undefined;
}

let child = null;
let starting = false;
let restartTimer = null;
let shuttingDown = false;
let shutdownPromise = null;
let graceUntil = 0;
let watchers = [];

async function stopChild() {
  const current = child;
  child = null;
  if (!current || current.exitCode !== null || current.signalCode !== null) {
    updateSupervisorOwnership(lane, { childPid: null });
    return;
  }
  await terminateProcessTrees([current.pid]);
  await cleanupCheckoutListeners(lane, serverPorts);
  updateSupervisorOwnership(lane, { childPid: null });
}

function closeWatchers() {
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = null;
  for (const watcher of watchers) watcher?.close();
  watchers = [];
}

async function shutdown(exitCode = 0) {
  if (shutdownPromise) return shutdownPromise;
  shuttingDown = true;
  closeWatchers();
  shutdownPromise = stopChild().finally(() => {
    releaseSupervisorOwnership(lane);
    process.exit(exitCode);
  });
  return shutdownPromise;
}

async function startStorybook() {
  if (shuttingDown || starting) return;
  starting = true;
  try {
    await stopChild();
    child = spawn(
      process.execPath,
      [
        path.join(root, "node_modules/storybook/dist/bin/dispatcher.js"),
        "dev",
        "-p",
        port,
        "--exact-port",
        ...process.argv.slice(2),
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          STORYBOOK_PORT: port,
          VISUAL_SERVER_PORT: visualPort,
          WATCHPACK_POLLING: process.env.WATCHPACK_POLLING ?? "250",
        },
        stdio: "inherit",
      },
    );
    const current = child;
    updateSupervisorOwnership(lane, { childPid: current.pid });
    graceUntil = Date.now() + STARTUP_GRACE_MS;

    current.once("error", (error) => {
      if (child !== current || shuttingDown) return;
      console.error(
        `[storybook-run] could not start Storybook: ${error.message}`,
      );
      child = null;
      void shutdown(1);
    });
    current.once("exit", (code, signal) => {
      if (child !== current) return;
      child = null;
      updateSupervisorOwnership(lane, { childPid: null });
      if (!shuttingDown) {
        const outcome = signal ? `signal ${signal}` : `code ${code ?? 0}`;
        console.error(
          `[storybook-run] Storybook exited unexpectedly (${outcome}); releasing supervisor ownership`,
        );
        void shutdown(code ?? (signal ? 1 : 0));
      }
    });
  } finally {
    starting = false;
  }
}

function scheduleRestart(reason) {
  if (shuttingDown || starting) return;
  if (restartTimer) clearTimeout(restartTimer);
  const delay = Math.max(RESTART_DEBOUNCE_MS, graceUntil - Date.now());
  restartTimer = setTimeout(() => {
    restartTimer = null;
    if (starting || shuttingDown) return;
    if (Date.now() < graceUntil) {
      scheduleRestart(reason);
      return;
    }
    console.log(`[storybook-run] restarting (${reason})`);
    void startStorybook();
  }, delay);
}

for (const watchPath of restartWatchPaths) seedHashes(watchPath);
watchers = restartWatchPaths.map((watchPath) => {
  try {
    const isDirectory =
      existsSync(watchPath) && statSync(watchPath).isDirectory();
    return watch(watchPath, { recursive: isDirectory }, (_event, filename) => {
      const changedPath = filename
        ? isDirectory
          ? path.join(watchPath, filename)
          : watchPath
        : watchPath;
      if (/(^|[\\/])(\.DS_Store|.*~|\.swp|\.tmp)$/i.test(changedPath)) {
        return;
      }
      if (contentChanged(changedPath)) {
        scheduleRestart(path.relative(root, changedPath));
      }
    });
  } catch (error) {
    console.warn(
      `[storybook-run] could not watch ${path.relative(root, watchPath)}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => void shutdown(0));
}

console.log(
  `[storybook-run] supervisor ${process.pid} owns ${root} :${port}; manager/shared/node edits restart once, preview edits use Vite HMR`,
);
await startStorybook();
