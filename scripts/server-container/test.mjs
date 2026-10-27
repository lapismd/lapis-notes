import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hash, validationConfig } from "../validation/model.mjs";
import { image } from "../validation/images.mjs";
import {
  dockerCommand,
  sendDirectory,
  receiveDirectory,
} from "../validation/docker.mjs";
import { json } from "../validation/paths.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const config = validationConfig(
  await json(join(root, ".local/validation/config.json"), {}),
);
if (config.runtime !== "docker")
  throw Error("Image acceptance requires Docker; there is no host fallback");
const id = randomUUID();
const name = `lapis-server-image-${id}`;
const report = join(root, ".local/server-container", `acceptance-${id}`);
const input = join(report, "input");
const app = `${name}-app`;
const volumes = [`${name}-data`, `${name}-config`];
const containers = [];
const password = randomBytes(32).toString("base64url");
const redact = (text) => String(text).replaceAll(password, "[redacted]");
const cpu = Math.min(config.cpus, 4);
const memory = Math.min(config.memoryGiB, 12);
const origin = "http://localhost:8787";
const checks = [];
const receipt = {
  schema: 1,
  started: new Date().toISOString(),
  status: "preparing",
  checks,
  resources: { cpus: cpu, memoryGiB: memory },
  name,
};
let sequence = 0;
let child;
let interrupted = false;
const interrupt = () => {
  interrupted = true;
  child?.kill("SIGTERM");
};
process.on("SIGINT", interrupt);
process.on("SIGTERM", interrupt);
await mkdir(input, { recursive: true });
async function run(args, stdin, output = "trim") {
  const [command, argv] = dockerCommand(config, args);
  const log = join(report, `${++sequence}-${args[0]}.log`);
  let stdout = "",
    stderr = "";
  const result = await new Promise((resolveRun, reject) => {
    child = spawn(command, argv, { stdio: ["pipe", "pipe", "pipe"] });
    child.stdout.on("data", (bytes) => {
      stdout = (stdout + bytes).slice(-8_388_608);
    });
    child.stderr.on("data", (bytes) => {
      stderr = (stderr + bytes).slice(-8_388_608);
    });
    child.once("error", reject);
    child.once("close", (code) => resolveRun(code));
    child.stdin.on("error", () => {});
    child.stdin.end(stdin);
  });
  child = undefined;
  await writeFile(log, redact(stdout + stderr));
  if (result !== 0)
    throw Error(
      `Docker ${args[0]} failed (${result}); ${log}\n${redact(stderr)}`,
    );
  if (output === "log") return redact(stdout + stderr);
  return output === "raw" ? redact(stdout) : redact(stdout).trim();
}
const resources = (fraction) => [
  `--cpus=${cpu * fraction}`,
  `--memory=${Math.floor(memory * fraction * 1024)}m`,
];
const mount = (volume, target, readonly = false) => [
  `--mount=type=volume,source=${volume},target=${target}${readonly ? ",readonly" : ""}`,
];
const label = [`--label=dev.lapismd.lapis-notes.server-container-test=${id}`];
const state = async () =>
  JSON.parse(await run(["inspect", app, "--format={{json .State}}"]));
async function ready() {
  const until = Date.now() + 60_000;
  while (Date.now() < until && !interrupted) {
    const current = await state();
    assert.equal(current.Running, true, "Native image exited during startup");
    try {
      const reply = await run([
        "exec",
        app,
        "curl",
        "--fail",
        "--silent",
        "http://127.0.0.1:8787/readyz",
      ]);
      if (JSON.parse(reply).status === "ready") return;
    } catch {
      /* Only an owned native startup is being awaited. */
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw Error("Native image readiness deadline exceeded");
}
async function stop() {
  await run(["stop", "--time=30", app]);
  const current = await state();
  assert.equal(current.Running, false);
  assert.equal(current.OOMKilled, false);
  assert.equal(current.ExitCode, 0, "Native image shutdown must drain cleanly");
}
async function browserPhase(phase, fixture, tool) {
  const browser = `${name}-${phase}`;
  containers.push(browser);
  await writeFile(join(input, "fixture.json"), JSON.stringify(fixture));
  await run([
    "create",
    `--name=${browser}`,
    "--init",
    "--interactive",
    ...label,
    ...resources(0.75),
    "--shm-size=1g",
    "--cap-drop=ALL",
    `--network=container:${app}`,
    ...mount(volumes[1], "/run/lapis", true),
    tool,
    "node",
    "/input/browser.mjs",
    phase,
  ]);
  await sendDirectory(config, ["cp", "-", `${browser}:/input`], input);
  const results = join(report, phase);
  await mkdir(results, { recursive: true });
  try {
    const output = await run(
      ["start", "--attach", "--interactive", browser],
      password + "\n",
    );
    const match = /^RESULT (.+)$/mu.exec(output);
    assert.ok(match, "Browser driver must publish an acceptance receipt");
    const result = JSON.parse(match[1]);
    assert.equal(result.phase, phase);
    assert.equal(result.sha256, hash(fixture.text));
    checks.push(...result.checks.map((check) => `${phase}: ${check}`));
    return result;
  } finally {
    await receiveDirectory(
      config,
      ["cp", `${browser}:/results/.`, "-"],
      results,
    );
  }
}
try {
  const target =
    process.env.LAPIS_SERVER_TEST_IMAGE ?? "lapis-server:rust-local";
  const imageId = await run(["image", "inspect", target, "--format={{.Id}}"]);
  const selected = process.env.LAPIS_SERVER_TEST_TOOL_IMAGE;
  const tool = selected
    ? await run(["image", "inspect", selected, "--format={{.Id}}"])
    : (await image(config, "ui")).id;
  Object.assign(receipt, {
    status: "running",
    image: imageId,
    browserImage: tool,
  });
  await copyFile(
    join(root, "scripts/server-container/browser.mjs"),
    join(input, "browser.mjs"),
  );
  for (const volume of volumes)
    await run(["volume", "create", ...label, volume]);
  const prepare = `${name}-prepare`;
  containers.push(prepare);
  await run(
    [
      "run",
      `--name=${prepare}`,
      "--interactive",
      "--user=0:0",
      "--read-only",
      "--cap-drop=ALL",
      "--cap-add=CHOWN",
      ...label,
      ...resources(0.25),
      ...mount(volumes[0], "/data"),
      ...mount(volumes[1], "/run/lapis"),
      "--entrypoint=/bin/sh",
      imageId,
      "-ceu",
      "umask 077; cat > /run/lapis/bootstrap-password; printf '{\"vaults\":[]}\\n' > /run/lapis/config.json; chown 1993:1993 /data /run/lapis /run/lapis/config.json /run/lapis/bootstrap-password",
    ],
    password + "\n",
  );
  containers.push(app);
  await run([
    "create",
    `--name=${app}`,
    ...label,
    ...resources(0.25),
    "--read-only",
    "--cap-drop=ALL",
    "--tmpfs=/tmp:rw,noexec,nosuid,size=256m",
    ...mount(volumes[0], "/data"),
    ...mount(volumes[1], "/run/lapis", true),
    `--env=LAPIS_SERVER_ORIGIN=${origin}`,
    "--env=LAPIS_SERVER_INSECURE_COOKIE=1",
    "--env=LAPIS_SERVER_BOOTSTRAP_USERNAME=owner",
    "--env=LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE=/run/lapis/bootstrap-password",
    "--env=LAPIS_SERVER_BUILD_ID=image-acceptance",
    imageId,
  ]);
  await run(["start", app]);
  await ready();
  assert.equal(await run(["exec", app, "id", "-u"]), "1993");
  assert.equal(await run(["exec", app, "id", "-g"]), "1993");
  checks.push("runtime UID/GID 1993");
  await run([
    "exec",
    app,
    "sh",
    "-ceu",
    "if command -v node >/dev/null || command -v deno >/dev/null; then exit 1; fi; test ! -w /app/lapis-server; test ! -w /app/static/index.html; if touch /app/image-write-probe 2>/dev/null; then exit 1; fi",
  ]);
  checks.push("no Node/Deno runtime and read-only application");
  const fixture = {
    origin,
    name: `Image vault ${id}`,
    path: "Untitled.md",
    text: `# Native image persistence ${id}\n\nRetained UI, exact bytes, cold process.\n`,
  };
  const created = await browserPhase("create", fixture, tool);
  assert.match(created.vaultId, /^[0-9a-f-]{36}$/u);
  fixture.vaultId = created.vaultId;
  const saved = `/data/vaults/${fixture.vaultId}/content/${fixture.path}`;
  const readSaved = () => run(["exec", app, "cat", saved], undefined, "raw");
  assert.equal(await readSaved(), fixture.text);
  checks.push("first process persisted exact volume bytes");
  await stop();
  checks.push("first native process exited cleanly");
  await run(["start", app]);
  await ready();
  const restored = await browserPhase("reopen", fixture, tool);
  assert.equal(restored.vaultId, created.vaultId);
  assert.equal(await readSaved(), fixture.text);
  checks.push("cold process retained exact volume bytes");
  await stop();
  checks.push("cold native process exited cleanly");
  assert.equal(interrupted, false, "Image acceptance was interrupted");
  receipt.status = "passed";
} catch (error) {
  receipt.status = "failed";
  receipt.error = redact(error.stack ?? error);
  process.exitCode = 1;
} finally {
  try {
    await writeFile(
      join(report, "app.log"),
      await run(["logs", app], undefined, "log"),
    );
  } catch (error) {
    receipt.logsError = redact(error.message);
  }
  const cleanupErrors = [];
  for (const container of containers.reverse()) {
    try {
      await run(["rm", "--force", container]);
    } catch (error) {
      cleanupErrors.push(redact(error.message));
    }
  }
  for (const volume of volumes) {
    try {
      await run(["volume", "rm", volume]);
    } catch (error) {
      cleanupErrors.push(redact(error.message));
    }
  }
  if (cleanupErrors.length) {
    receipt.cleanupErrors = cleanupErrors;
    receipt.status = "failed";
    process.exitCode = 1;
  }
  await rm(input, { recursive: true, force: true });
  receipt.finished = new Date().toISOString();
  await writeFile(
    join(report, "receipt.json"),
    JSON.stringify(receipt, null, 2) + "\n",
  );
  process.off("SIGINT", interrupt);
  process.off("SIGTERM", interrupt);
  console.log(
    `Native image acceptance: ${receipt.status}; ${checks.length} checks; ${join(report, "receipt.json")}`,
  );
}
