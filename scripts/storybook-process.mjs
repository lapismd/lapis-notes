#!/usr/bin/env node
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DEFAULT_STORYBOOK_PORT = "7010";

function normalizedRoot(root) {
  const resolved = path.resolve(root);
  return existsSync(resolved) ? realpathSync(resolved) : resolved;
}

export function resolveStorybookLane({ root, env = process.env } = {}) {
  const checkoutRoot = normalizedRoot(
    root ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  );
  const port = String(env.STORYBOOK_PORT ?? DEFAULT_STORYBOOK_PORT);
  const portNumber = Number(port);
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65_535) {
    throw new Error(`Invalid STORYBOOK_PORT: ${port}`);
  }
  const visualPort = String(
    env.VISUAL_SERVER_PORT ?? env.VISUAL_DELTA_SERVER_PORT ?? portNumber + 1,
  );
  const debugPort = String(portNumber + 90);
  const extraPorts = (env.STORYBOOK_EXTRA_PORTS ?? `${visualPort} ${debugPort}`)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const stopPorts = [
    port,
    ...extraPorts,
    String(env.VISUAL_DELTA_PANEL_STATIC_PORT ?? portNumber + 3),
    String(env.VISUAL_DELTA_PANEL_STORYBOOK_PORT ?? portNumber + 4),
    String(env.VISUAL_DELTA_PANEL_VISUAL_PORT ?? portNumber + 5),
    String(
      Number(env.VISUAL_DELTA_PANEL_STORYBOOK_PORT ?? portNumber + 4) + 90,
    ),
    String(env.WORKSPACE_STORYBOOK_PORT ?? portNumber + 200),
    String(env.WORKSPACE_VISUAL_SERVER_PORT ?? portNumber + 201),
    String(Number(env.WORKSPACE_STORYBOOK_PORT ?? portNumber + 200) + 90),
  ];
  return {
    root: checkoutRoot,
    port,
    visualPort,
    debugPort,
    extraPorts,
    serverPorts: [...new Set([port, ...extraPorts])],
    stopPorts: [...new Set(stopPorts)],
    ownerPath: path.join(
      checkoutRoot,
      ".cache",
      "storybook",
      "supervisors",
      `${port}.json`,
    ),
  };
}

export function storybookStartupMode(env = process.env) {
  return env.STORYBOOK_REPLACE === "1" ? "replace" : "reuse";
}

export function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function readSupervisorOwnership(lane) {
  const owner = readJson(lane.ownerPath);
  if (
    !owner ||
    owner.version !== 1 ||
    owner.root !== lane.root ||
    owner.port !== lane.port ||
    !Number.isInteger(owner.supervisorPid)
  ) {
    return null;
  }
  return owner;
}

function runtimeOwnerIsAlive(owner) {
  if (!processIsAlive(owner.supervisorPid)) return false;
  const cwd = processCwd(owner.supervisorPid);
  const command = processCommand(owner.supervisorPid);
  return cwd === owner.root && command.includes("scripts/storybook-run.mjs");
}

export function acquireSupervisorOwnership(
  lane,
  {
    supervisorPid = process.pid,
    ownerIsAlive = runtimeOwnerIsAlive,
    now = () => Date.now(),
  } = {},
) {
  mkdirSync(path.dirname(lane.ownerPath), { recursive: true });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = readSupervisorOwnership(lane);
    if (existing && ownerIsAlive(existing)) {
      return { acquired: false, owner: existing };
    }
    if (existsSync(lane.ownerPath)) {
      try {
        unlinkSync(lane.ownerPath);
      } catch {
        continue;
      }
    }
    const owner = {
      version: 1,
      root: lane.root,
      port: lane.port,
      supervisorPid,
      childPid: null,
      startedAt: now(),
    };
    try {
      const fd = openSync(lane.ownerPath, "wx");
      try {
        writeFileSync(fd, `${JSON.stringify(owner, null, 2)}\n`);
      } finally {
        closeSync(fd);
      }
      return { acquired: true, owner };
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
  }
  throw new Error(`Could not acquire Storybook ownership at ${lane.ownerPath}`);
}

export function updateSupervisorOwnership(
  lane,
  patch,
  supervisorPid = process.pid,
) {
  const owner = readSupervisorOwnership(lane);
  if (!owner || owner.supervisorPid !== supervisorPid) return false;
  const temporary = `${lane.ownerPath}.${supervisorPid}.tmp`;
  writeFileSync(
    temporary,
    `${JSON.stringify({ ...owner, ...patch }, null, 2)}\n`,
  );
  renameSync(temporary, lane.ownerPath);
  return true;
}

export function releaseSupervisorOwnership(lane, supervisorPid = process.pid) {
  const owner = readSupervisorOwnership(lane);
  if (!owner || owner.supervisorPid !== supervisorPid) return false;
  try {
    unlinkSync(lane.ownerPath);
    return true;
  } catch {
    return false;
  }
}

export function parseProcessTable(output) {
  return output
    .split("\n")
    .map((line) => line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/))
    .filter(Boolean)
    .map((match) => ({
      pid: Number(match[1]),
      ppid: Number(match[2]),
      command: match[3],
    }));
}

export function listProcesses() {
  try {
    return parseProcessTable(
      execFileSync("ps", ["-axo", "pid=,ppid=,command="], {
        encoding: "utf8",
      }),
    );
  } catch {
    return [];
  }
}

export function processCommand(pid, { environment = false } = {}) {
  try {
    return execFileSync(
      "ps",
      environment
        ? ["eww", "-p", String(pid), "-o", "command="]
        : ["-p", String(pid), "-o", "command="],
      { encoding: "utf8" },
    ).trim();
  } catch {
    return "";
  }
}

export function processCwd(pid) {
  try {
    const output = execFileSync(
      "lsof",
      ["-a", "-p", String(pid), "-d", "cwd", "-Fn"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    const cwd = output
      .split("\n")
      .find((line) => line.startsWith("n"))
      ?.slice(1);
    return cwd ? normalizedRoot(cwd) : null;
  } catch {
    return null;
  }
}

export function descendantPids(processes, parentPids) {
  const found = new Set(parentPids);
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of processes) {
      if (found.has(entry.ppid) && !found.has(entry.pid)) {
        found.add(entry.pid);
        changed = true;
      }
    }
  }
  return [...found];
}

function explicitPort(environment) {
  return environment.match(/(?:^|\s)STORYBOOK_PORT=(\d+)(?:\s|$)/)?.[1];
}

function dispatcherPort(command) {
  if (!command.includes("storybook/dist/bin/dispatcher.js")) return undefined;
  return command.match(/(?:^|\s)-p\s+(\d+)(?:\s|$)/)?.[1];
}

export function isStorybookSupervisorCommand(command) {
  return /^\s*\S*node\s+(?:\S*\/)?scripts\/storybook-run\.mjs(?:\s|$)/.test(
    command,
  );
}

export function findMatchingSupervisors({
  processes,
  root,
  port,
  cwdForPid = processCwd,
  environmentForPid = (pid) => processCommand(pid, { environment: true }),
}) {
  const checkoutRoot = normalizedRoot(root);
  return processes
    .filter((entry) => isStorybookSupervisorCommand(entry.command))
    .filter((entry) => cwdForPid(entry.pid) === checkoutRoot)
    .filter((entry) => {
      const descendants = descendantPids(processes, [entry.pid])
        .map((pid) => processes.find((candidate) => candidate.pid === pid))
        .filter(Boolean);
      const childPort = descendants
        .map((candidate) => dispatcherPort(candidate.command))
        .find(Boolean);
      const configuredPort = explicitPort(environmentForPid(entry.pid));
      // Legacy default-lane supervisors did not export STORYBOOK_PORT.
      return (configuredPort ?? childPort ?? DEFAULT_STORYBOOK_PORT) === port;
    });
}

export function planStorybookStop({
  processes,
  root,
  port,
  owner,
  cwdForPid = processCwd,
  environmentForPid = (pid) => processCommand(pid, { environment: true }),
}) {
  const supervisors = findMatchingSupervisors({
    processes,
    root,
    port,
    cwdForPid,
    environmentForPid,
  });
  const roots = new Set(supervisors.map((entry) => entry.pid));
  if (owner?.supervisorPid) roots.add(owner.supervisorPid);
  return {
    supervisors: [...roots],
    processes: descendantPids(processes, [...roots]),
  };
}

export function listenerPids(port) {
  try {
    return execFileSync("lsof", ["-tiTCP:" + port, "-sTCP:LISTEN"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(Number);
  } catch {
    return [];
  }
}

export function partitionForeignListeners(lane, listeners) {
  return {
    storybookPort: listeners.filter((listener) => listener.port === lane.port),
    auxiliaryPorts: listeners.filter((listener) => listener.port !== lane.port),
  };
}

export async function terminateProcessTrees(
  roots,
  {
    processes = listProcesses(),
    graceMs = 700,
    sendSignal = (pid, signal) => process.kill(pid, signal),
    isAlive = processIsAlive,
  } = {},
) {
  const targets = descendantPids(processes, roots)
    .filter((pid) => pid !== process.pid)
    .reverse();
  for (const pid of targets) {
    try {
      sendSignal(pid, "SIGTERM");
    } catch {
      /* already exited */
    }
  }
  if (targets.some(isAlive)) {
    await new Promise((resolve) => setTimeout(resolve, graceMs));
  }
  for (const pid of targets) {
    if (!isAlive(pid)) continue;
    try {
      sendSignal(pid, "SIGKILL");
    } catch {
      /* already exited */
    }
  }
  return targets;
}

export async function cleanupCheckoutListeners(lane, ports = lane.serverPorts) {
  const retained = [];
  const local = [];
  for (const port of ports) {
    for (const pid of listenerPids(port)) {
      if (processCwd(pid) === lane.root) local.push(pid);
      else retained.push({ port, pid, cwd: processCwd(pid) });
    }
  }
  if (local.length > 0) {
    await terminateProcessTrees([...new Set(local)]);
  }
  return retained;
}

export async function stopStorybookLane(
  lane,
  { includePorts = lane.stopPorts, processes = listProcesses() } = {},
) {
  const plan = planStorybookStop({
    processes,
    root: lane.root,
    port: lane.port,
    owner: readSupervisorOwnership(lane),
  });
  const terminated =
    plan.supervisors.length > 0
      ? await terminateProcessTrees(plan.supervisors, { processes })
      : [];

  const latestOwner = readSupervisorOwnership(lane);
  if (
    latestOwner &&
    (plan.supervisors.includes(latestOwner.supervisorPid) ||
      !processIsAlive(latestOwner.supervisorPid))
  ) {
    try {
      unlinkSync(lane.ownerPath);
    } catch {
      /* already released */
    }
  }
  const retained = await cleanupCheckoutListeners(lane, includePorts);
  return {
    supervisors: plan.supervisors,
    terminated,
    retained,
  };
}

async function cli() {
  if (process.argv[1] !== fileURLToPath(import.meta.url)) return;
  const command = process.argv[2];
  if (command !== "stop") {
    console.error("Usage: node scripts/storybook-process.mjs stop");
    process.exitCode = 2;
    return;
  }
  const lane = resolveStorybookLane();
  const result = await stopStorybookLane(lane);
  if (result.supervisors.length > 0) {
    console.log(
      `[storybook-process] stopped supervisors ${result.supervisors.join(", ")} for ${lane.root} :${lane.port}`,
    );
  } else {
    console.log(
      `[storybook-process] no supervisor for ${lane.root} :${lane.port}`,
    );
  }
  for (const listener of result.retained) {
    console.warn(
      `[storybook-process] retained foreign listener ${listener.pid} on :${listener.port}${listener.cwd ? ` (${listener.cwd})` : ""}`,
    );
  }
}

await cli();
