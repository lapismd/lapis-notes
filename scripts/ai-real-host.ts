#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { generateToken, serveAgentHost } from "@lapismd/ai-host";
import {
  AI_REAL_HOST_RELATIVE_ROOT,
  assertSafeAiSmokeReset,
  seedAiRealHostWorkspace,
} from "./lib/ai-real-host-fixture.mjs";

type Lane = "seed" | "storybook" | "desktop";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function usage(): never {
  console.error(
    "Usage: tsx scripts/ai-real-host.ts <seed|storybook|desktop> [--reset] [--workspace <path>]",
  );
  process.exit(2);
}

function parseArgs(argv: string[]): {
  lane: Lane;
  reset: boolean;
  workspace: string;
} {
  const lane = argv.shift() as Lane | undefined;
  if (lane !== "seed" && lane !== "storybook" && lane !== "desktop") usage();
  let reset = false;
  let workspace = path.resolve(
    repoRoot,
    AI_REAL_HOST_RELATIVE_ROOT,
    "workspace",
  );
  while (argv.length > 0) {
    const flag = argv.shift();
    if (flag === "--") continue;
    if (flag === "--reset") {
      reset = true;
      continue;
    }
    if (flag === "--workspace") {
      const value = argv.shift();
      if (!value) usage();
      workspace = path.resolve(repoRoot, value);
      continue;
    }
    usage();
  }
  if (reset) assertSafeAiSmokeReset(repoRoot, workspace);
  return { lane, reset, workspace };
}

function childEnvironment(overrides: Record<string, string>) {
  return Object.fromEntries(
    Object.entries({ ...process.env, ...overrides }).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
}

function spawnChild(
  command: string,
  args: string[],
  env: Record<string, string>,
) {
  return spawn(command, args, {
    cwd: repoRoot,
    env: childEnvironment(env),
    stdio: "inherit",
  });
}

async function runOnce(command: string, args: string[]): Promise<void> {
  const child = spawnChild(command, args, {});
  const code = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (exitCode, signal) =>
      resolve(exitCode ?? (signal ? 1 : 0)),
    );
  });
  if (code !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${code}`);
  }
}

async function supervise(
  child: ReturnType<typeof spawnChild>,
  cleanup: () => Promise<void>,
): Promise<void> {
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
    }
    await cleanup();
  };
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => void close());
  }
  const code = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (exitCode, signal) =>
      resolve(exitCode ?? (signal ? 1 : 0)),
    );
  });
  await close();
  if (code !== 0) process.exitCode = code;
}

async function startStorybook(workspace: string): Promise<void> {
  const token = generateToken();
  const host = await serveAgentHost(
    {
      port: 0,
      bind: "127.0.0.1",
      workspace,
      token,
      origins: [],
    },
    {
      print(line) {
        if (!line.startsWith("token:")) console.log(`[ai-smoke] ${line}`);
      },
    },
  );
  const storybookPort = process.env.STORYBOOK_PORT?.trim() || "7010";
  console.log(`[ai-smoke] seeded agent workspace: ${workspace}`);
  console.log(
    `[ai-smoke] open http://localhost:${storybookPort}/?path=/story/plugins-ai-live-host--manual-attach`,
  );
  console.log(
    "[ai-smoke] the attach token is injected into Storybook only; it is not logged or written to disk",
  );
  const child = spawnChild(
    process.execPath,
    ["scripts/storybook-run.mjs", "--no-open"],
    {
      STORYBOOK_REPLACE: "1",
      STORYBOOK_PORT: storybookPort,
      LAPIS_AGENT_RUNTIME_URL: host.url,
      LAPIS_AGENT_RUNTIME_TOKEN: token,
    },
  );
  await supervise(child, () => host.close());
}

async function startDesktop(workspace: string): Promise<void> {
  await runOnce(pnpm, ["--dir", path.resolve(repoRoot, "../ai-host"), "build"]);
  await runOnce(pnpm, [
    "turbo",
    "run",
    "build",
    "--filter=@lapis-notes/api...",
    "--filter=@lapis-notes/ai...",
  ]);
  const userDataDir = path.resolve(
    repoRoot,
    AI_REAL_HOST_RELATIVE_ROOT,
    "desktop-user-data",
  );
  await mkdir(userDataDir, { recursive: true });
  console.log(`[ai-smoke] seeded native vault and agent workspace: ${workspace}`);
  console.log("[ai-smoke] Deno desktop opens the AI chat with Codex Native selected");
  const child = spawnChild(
    pnpm,
    ["--filter", "@lapis-notes/desktop-deno", "dev"],
    {
      LAPIS_DENO_VAULT: workspace,
      LAPIS_DENO_VAULT_AUTO: "1",
      LAPIS_DENO_USER_DATA: userDataDir,
    },
  );
  await supervise(child, async () => {});
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const defaultRuntime = options.lane === "desktop" ? "codex-native" : "acp";
  const created = await seedAiRealHostWorkspace(options.workspace, {
    defaultRuntime,
    reset: options.reset,
  });
  console.log(
    `[ai-smoke] ${created.length ? `created ${created.length} seed files` : "reusing seed and conversation files"}`,
  );
  if (options.lane === "seed") {
    console.log(`[ai-smoke] workspace: ${options.workspace}`);
    return;
  }
  if (options.lane === "storybook") {
    await startStorybook(options.workspace);
    return;
  }
  await startDesktop(options.workspace);
}

void main().catch((error) => {
  console.error(`[ai-smoke] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
