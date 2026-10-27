import assert from "node:assert/strict";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { build, start } from "./server-runtime.mjs";

async function fixture(t) {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "lapis-native-delivery-")),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const staticRoot = join(root, "packages/web/dist-rust-server");
  const binary = join(root, ".local/rust-core-target/release/lapis-server");
  const config = join(root, "operator.json");
  await mkdir(staticRoot, { recursive: true });
  await mkdir(join(root, ".local/rust-core-target/release"), {
    recursive: true,
  });
  await writeFile(join(staticRoot, "index.html"), "<html>Lapis</html>");
  await writeFile(config, JSON.stringify({ vaults: [] }));
  await writeFile(binary, "#!/bin/sh\nexit 0\n");
  await chmod(binary, 0o755);
  return {
    root,
    staticRoot,
    binary,
    config,
    env: {
      LAPIS_SERVER_CONFIG: config,
      LAPIS_SERVER_DATA_ROOT: join(root, "data"),
    },
  };
}

test("native delivery builds one coherent profile without running a Node server", async (t) => {
  const f = await fixture(t);
  const calls = [];
  await build(
    f.root,
    { ...f.env, VITE_LAPIS_NATIVE_HISTORY: "0" },
    async (command, args, options) => {
      calls.push({ command, args, env: options.env });
    },
  );
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[0].args, [
    "rust:core",
    "--",
    "build",
    "-p",
    "lapis-server",
    "--release",
    "--locked",
  ]);
  assert.ok(calls[1].args.includes("--filter=@lapis-notes/app-profile..."));
  assert.deepEqual(calls[2].args, [
    "--filter",
    "@lapis-notes/web",
    "build:rust-server",
  ]);
  for (const key of ["METADATA", "HISTORY", "TASKS"])
    assert.equal(calls[2].env[`VITE_LAPIS_NATIVE_${key}`], "1");
  assert.ok(
    calls.every((call) => !call.args.join(" ").includes("server-node")),
  );
  const profile = JSON.parse(
    await readFile(join(f.staticRoot, "lapis-host-profile.json"), "utf8"),
  );
  assert.deepEqual(profile, {
    schema: 1,
    runtime: "rust-server",
    nativeMetadata: true,
    nativeHistory: true,
    nativeTasks: true,
  });
});

test("failed builds cannot certify stale renderer output", async (t) => {
  const f = await fixture(t);
  const stamp = join(f.staticRoot, "lapis-host-profile.json");
  await build(f.root, f.env, async () => {});
  await assert.rejects(
    build(f.root, f.env, async () => {
      throw Error("compile failed");
    }),
    /compile failed/u,
  );
  await assert.rejects(readFile(stamp), { code: "ENOENT" });
});

test("native start validates its operator inputs and never invokes a build or fallback", async (t) => {
  const f = await fixture(t);
  await build(f.root, f.env, async () => {});
  let actual;
  await start(
    f.root,
    {
      ...f.env,
      LAPIS_SERVER_LISTEN: "127.0.0.1:4809",
      CUSTOM_PROVIDER: "retained",
    },
    async (...args) => {
      actual = args;
    },
  );
  assert.equal(actual[0], f.binary);
  assert.deepEqual(actual[1], [f.config, "127.0.0.1:4809"]);
  assert.equal(actual[2].env.LAPIS_SERVER_STATIC_ROOT, f.staticRoot);
  assert.equal(actual[2].env.LAPIS_SERVER_NATIVE_HISTORY, "1");
  assert.equal(actual[2].env.CUSTOM_PROVIDER, "retained");
  for (const key of ["LAPIS_SERVER_CONFIG", "LAPIS_SERVER_DATA_ROOT"])
    await assert.rejects(
      start(f.root, { ...f.env, [key]: undefined }, async () =>
        assert.fail("must not launch"),
      ),
      new RegExp(key, "u"),
    );
  await writeFile(
    join(f.staticRoot, "lapis-host-profile.json"),
    JSON.stringify({ schema: 1, runtime: "node-server" }),
  );
  await assert.rejects(
    start(f.root, f.env, async () => assert.fail("must not launch")),
    /profile/u,
  );
});

test("missing native artifacts stop startup before touching data", async (t) => {
  const f = await fixture(t);
  await build(f.root, f.env, async () => {});
  await rm(f.binary);
  await assert.rejects(
    start(f.root, f.env, async () => assert.fail("must not launch")),
    /native server binary/u,
  );
  await assert.rejects(readFile(f.env.LAPIS_SERVER_DATA_ROOT), {
    code: "ENOENT",
  });
});

test("the CLI returns the compiled server exit status and forwards termination", async (t) => {
  const f = await fixture(t);
  await build(f.root, f.env, async () => {});
  const fixtureBinary = join(f.root, "native-process.mjs");
  await writeFile(
    fixtureBinary,
    `#!${process.execPath}\nprocess.stdout.write('native-ready\\n');\nif(process.env.FIXTURE_EXIT) process.exit(Number(process.env.FIXTURE_EXIT));\nprocess.on('SIGTERM',()=>process.exit(23));\nsetInterval(()=>{},1000);\n`,
  );
  await chmod(fixtureBinary, 0o755);
  const cli = new URL("./server-runtime.mjs", import.meta.url);
  const run = (extra) => {
    const child = spawn(process.execPath, [cli.pathname, "start"], {
      env: {
        ...process.env,
        ...f.env,
        LAPIS_SERVER_BINARY: fixtureBinary,
        LAPIS_SERVER_STATIC_ROOT: f.staticRoot,
        ...extra,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    t.after(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    });
    return child;
  };
  const exit = (child) =>
    new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code, signal) => resolve({ code, signal }));
    });
  assert.deepEqual(await exit(run({ FIXTURE_EXIT: "19" })), {
    code: 19,
    signal: null,
  });
  const child = run({});
  const completed = exit(child);
  await new Promise((resolve, reject) => {
    child.stdout.once("data", resolve);
    child.once("exit", () => reject(Error("Child exited before readiness")));
  });
  child.kill("SIGTERM");
  assert.deepEqual(await completed, { code: 23, signal: null });
});
