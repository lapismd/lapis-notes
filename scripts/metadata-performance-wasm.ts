import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { chromium } from "playwright";
import type { MetadataPerformanceResult } from "../packages/api/scripts/metadata-performance-fixture";

function integerArgument(name: string, fallback: number): number {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

const root = fileURLToPath(new URL("..", import.meta.url));
const noteCount = integerArgument("--notes", 50_000);
const runs = integerArgument("--runs", noteCount >= 100_000 ? 1 : 5);
const enforce = !process.argv.includes("--no-enforce");
const port = integerArgument("--port", 41_783);
const origin = `http://127.0.0.1:${port}`;
const directory = await mkdtemp(
  join(tmpdir(), "lapis-metadata-wasm-performance-"),
);
const fixturePath = join(directory, "metadata.turso");

async function runCommand(label: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", args, {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      output += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed:\n${output}`));
    });
  });
}

async function waitForServer(
  server: ChildProcess,
  output: () => string,
): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Metadata performance server exited early:\n${output()}`);
    }
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Metadata performance server did not start:\n${output()}`);
}

let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let server: ChildProcess | undefined;
try {
  await runCommand("Metadata fixture seed", [
    "--filter",
    "@lapis-notes/api",
    "performance:metadata:native",
    "--",
    "--notes",
    String(noteCount),
    "--seed-only",
    "--database-path",
    fixturePath,
  ]);
  await runCommand("Metadata performance build", [
    "exec",
    "vite",
    "build",
    "--config",
    "scripts/metadata-performance-vite.config.ts",
  ]);

  server = spawn(
    "pnpm",
    [
      "exec",
      "vite",
      "preview",
      "--config",
      "scripts/metadata-performance-vite.config.ts",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        LAPIS_METADATA_PERFORMANCE_FIXTURE: fixturePath,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let serverOutput = "";
  server.stdout!.on("data", (chunk) => {
    serverOutput += String(chunk);
  });
  server.stderr!.on("data", (chunk) => {
    serverOutput += String(chunk);
  });
  await waitForServer(server, () => serverOutput);

  browser = await chromium.launch({
    headless: true,
    args: ["--enable-precise-memory-info"],
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const browserOutput: string[] = [];
  page.on("console", (message) =>
    browserOutput.push(`console: ${message.text()}`),
  );
  page.on("pageerror", (error) =>
    browserOutput.push(`pageerror: ${error.message}`),
  );
  page.on("requestfailed", (request) =>
    browserOutput.push(
      `requestfailed: ${request.url()} ${request.failure()?.errorText ?? ""}`,
    ),
  );
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => typeof window.runMetadataPerformance === "function",
  );
  let result: MetadataPerformanceResult;
  try {
    result = (await page.evaluate(
      (input) => window.runMetadataPerformance(input),
      {
        noteCount,
        runs,
        fixtureUrl: "/__metadata_fixture.turso",
      },
    )) as MetadataPerformanceResult;
  } catch (error) {
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\n${browserOutput.join("\n")}`,
    );
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (enforce && !result.passed) process.exitCode = 1;
  await context.close();
} finally {
  await browser?.close();
  server?.kill("SIGTERM");
  await rm(directory, { recursive: true, force: true });
}
