import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { archiveMember, ciToolDirectory } from "./validation/install-tools.mjs";

test("hosted CI installs Jujutsu only into runner-owned temporary paths", () => {
  assert.throws(() => ciToolDirectory({}), /runner-owned/);
  assert.equal(
    ciToolDirectory({ RUNNER_TEMP: "/tmp/runner", GITHUB_PATH: "/tmp/paths" }),
    "/tmp/runner/lapis-notes-validation-tools",
  );
});

test("unknown lanes fail before contacting Docker", async () => {
  const { main } = await import("./validation.mjs");
  await assert.rejects(
    main(["run", "not-a-validation-lane"]),
    /Unknown validation lane/,
  );
});

test("upstream tool archives accept plain and dot-prefixed root executables only", () => {
  assert.equal(archiveMember("./jj\n./LICENSE\n", "jj"), "./jj");
  assert.equal(archiveMember("mdbook\n", "mdbook"), "mdbook");
  assert.throws(() => archiveMember("../jj\n", "jj"), /root executable/);
  assert.throws(() => archiveMember("jj\n./jj\n", "jj"), /root executable/);
});
import {
  validationConfig,
  imageKey,
  validateArchives,
} from "./validation/model.mjs";
test("Docker is default and native must be explicit", () => {
  assert.equal(validationConfig({}, {}).runtime, "docker");
  assert.equal(
    validationConfig({}, { LAPIS_NOTES_VALIDATION_RUNTIME: "native" }).runtime,
    "native",
  );
  assert.throws(() => validationConfig({ runtime: "magic" }, {}), /runtime/);
});

test("Turbo preserves explicit runtime selection and separates worker cache identity", async () => {
  const turbo = JSON.parse(
    await readFile(new URL("../turbo.json", import.meta.url)),
  );
  assert.ok(turbo.globalEnv.includes("LAPIS_NOTES_VALIDATION_WORKER"));
  assert.ok(turbo.globalPassThroughEnv.includes("PLAYWRIGHT_BROWSERS_PATH"));
  assert.ok(
    turbo.globalPassThroughEnv.includes("LAPIS_NOTES_VALIDATION_RUNTIME"),
  );
});

test("public validation lanes route through Docker while preserving native commands", async () => {
  const pkg = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url)),
  );
  const lanes = JSON.parse(
    await readFile(new URL("./validation/lanes.json", import.meta.url)),
  );
  for (const [name, command] of Object.entries(lanes)) {
    assert.equal(pkg.scripts[name], "node scripts/validation.mjs run " + name);
    assert.ok(command.length > 0);
    assert.ok(!command.startsWith("node scripts/validation.mjs"));
  }
  assert.ok(!Object.hasOwn(lanes, "test:visual:update"));
  assert.ok(!Object.hasOwn(lanes, "storybook"));
});

test("all hosted workflows explicitly select their provisioned native runtime", async () => {
  const { readdir } = await import("node:fs/promises");
  const dir = new URL("../.github/workflows/", import.meta.url);
  for (const name of await readdir(dir)) {
    if (!/\.ya?ml$/.test(name)) continue;
    assert.match(
      await readFile(new URL(name, dir), "utf8"),
      /LAPIS_NOTES_VALIDATION_RUNTIME: native/,
    );
  }
});
test("remote resource limits are bounded positive numbers", () => {
  assert.equal(validationConfig({}, {}).cpus, 8);
  assert.throws(() => validationConfig({ memoryGiB: 0 }, {}), /memoryGiB/);
});
test("image identity changes with recipe, dependency and architecture inputs", () => {
  const a = imageKey({ recipe: "a", lock: "one", arch: "amd64" });
  assert.notEqual(a, imageKey({ recipe: "a", lock: "two", arch: "amd64" }));
  assert.notEqual(a, imageKey({ recipe: "a", lock: "one", arch: "arm64" }));
  assert.equal(a, imageKey({ arch: "amd64", lock: "one", recipe: "a" }));
});
test("archive inputs require identity, version and exact checksum", () => {
  assert.throws(
    () => validateArchives([{ name: "a", path: "a.tgz" }]),
    /archive/,
  );
  assert.throws(
    () =>
      validateArchives([
        { name: "a", version: "1.0.0", path: "a.tgz", sha256: "a".repeat(64) },
        { name: "a", version: "1.0.0", path: "b.tgz", sha256: "a".repeat(64) },
      ]),
    /Duplicate/,
  );
  assert.equal(
    validateArchives([
      {
        name: "@lapismd/a",
        version: "1.0.0",
        path: "a.tgz",
        sha256: "a".repeat(64),
      },
    ]).length,
    1,
  );
});
for (const workspace of [false, true])
  test(`snapshot preserves a dirty JJ commit and its direct parent${workspace ? " from a separate workspace" : ""}`, async () => {
    const { mkdtemp, writeFile, rm, readFile } = await import(
      "node:fs/promises"
    );
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { execFileSync } = await import("node:child_process");
    const { snapshot, snapshotFile } = await import("./validation/source.mjs");
    const directory = await mkdtemp(join(tmpdir(), "jj-validation-"));
    const primary = join(directory, "source"),
      repo = workspace ? join(directory, "workspace") : primary,
      destination = join(directory, "input"),
      restored = join(directory, "restored");
    const jj = (args, cwd = repo) =>
      execFileSync(
        "jj",
        [
          "--no-pager",
          "--config",
          'user.name="Validation"',
          "--config",
          'user.email="validation@localhost"',
          ...args,
        ],
        { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      ).trim();
    const outerBase = process.env.LAPIS_NOTES_CHECK_BASE;
    try {
      jj(["git", "init", primary], directory);
      await writeFile(join(primary, "kept.txt"), "parent");
      await writeFile(join(primary, "removed.txt"), "delete me");
      jj(["commit", "-m", "Parent"], primary);
      if (workspace)
        jj(
          ["workspace", "add", repo, "--name", "validation", "-r", "@-"],
          primary,
        );
      await writeFile(join(repo, "kept.txt"), "dirty");
      await rm(join(repo, "removed.txt"));
      await writeFile(join(repo, "new.txt"), "new\n");
      const base = jj(["log", "-r", "@-", "--no-graph", "-T", "commit_id"]);
      process.env.LAPIS_NOTES_CHECK_BASE = base;
      const manifest = await snapshot(repo, destination);
      assert.equal(manifest.base, base);
      assert.equal(manifest.parents.length, 1);
      assert.equal(
        snapshotFile(repo, manifest.revision, "new.txt").toString(),
        "new\n",
      );
      jj(["git", "init", restored], directory);
      execFileSync("git", ["index-pack", "--stdin"], {
        cwd: restored,
        input: await readFile(join(destination, "source.pack")),
        stdio: ["pipe", "pipe", "pipe"],
      });
      execFileSync(
        "git",
        ["update-ref", "refs/heads/validation-snapshot", manifest.revision],
        { cwd: restored },
      );
      jj(["git", "import"], restored);
      jj(["edit", manifest.revision], restored);
      assert.equal(
        jj(["log", "-r", "@", "--no-graph", "-T", "commit_id"], restored),
        manifest.revision,
      );
      assert.equal(
        jj(["log", "-r", "@-", "--no-graph", "-T", "commit_id"], restored),
        manifest.parents[0],
      );
      assert.equal(await readFile(join(restored, "kept.txt"), "utf8"), "dirty");
      assert.equal(await readFile(join(restored, "new.txt"), "utf8"), "new\n");
      await assert.rejects(readFile(join(restored, "removed.txt")), /ENOENT/);
    } finally {
      if (outerBase === undefined) delete process.env.LAPIS_NOTES_CHECK_BASE;
      else process.env.LAPIS_NOTES_CHECK_BASE = outerBase;
      await rm(directory, { recursive: true, force: true });
    }
  });
test("SSH context transport quotes arguments and rejects other endpoint types", async () => {
  const { sshDockerCommand } = await import("./validation/docker.mjs");
  const [cmd, args] = sshDockerCommand("ssh://steve@example.test:2222", [
    "run",
    "image",
    "a; echo unexpected",
  ]);
  assert.equal(cmd, "ssh");
  assert.ok(args.includes("2222"));
  assert.match(args.at(-1), /'a; echo unexpected'/);
  assert.throws(
    () => sshDockerCommand("unix:///var/run/docker.sock", []),
    /SSH Docker context/,
  );
});

test("report collection drains trailing archive bytes and rejects corrupt archives", async () => {
  const { mkdtemp, mkdir, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const { receiveDirectory } = await import("./validation/docker.mjs");
  const directory = await mkdtemp(join(tmpdir(), "validation-report-"));
  const originalPath = process.env.PATH;
  try {
    const bin = join(directory, "bin"),
      source = join(directory, "source"),
      destination = join(directory, "reports");
    for (const path of [bin, source, destination]) await mkdir(path);
    await writeFile(join(source, "result.json"), '{"status":"passed"}\n');
    const archive = execFileSync("tar", ["-C", source, "-cf", "-", "."]);
    const docker = join(bin, "docker");
    await writeFile(
      docker,
      `#!/usr/bin/env node\nprocess.stdout.on('error', () => process.exit(1));\nprocess.stdout.write(Buffer.from(${JSON.stringify(archive.toString("base64"))}, 'base64'));\nsetTimeout(() => process.stdout.end(Buffer.alloc(1024 * 1024)), 100);\n`,
      { mode: 0o755 },
    );
    process.env.PATH = `${bin}:${originalPath}`;
    await receiveDirectory({}, ["cp", "owned:/results/.", "-"], destination);
    assert.equal(
      await readFile(join(destination, "result.json"), "utf8"),
      '{"status":"passed"}\n',
    );
    await writeFile(
      docker,
      "#!/usr/bin/env node\nprocess.stdout.end('invalid archive');\n",
      { mode: 0o755 },
    );
    await assert.rejects(
      receiveDirectory({}, ["cp", "owned:/results/.", "-"], destination),
    );
    await writeFile(
      docker,
      `#!/usr/bin/env node\nprocess.stdout.end(Buffer.from(${JSON.stringify(archive.toString("base64"))}, 'base64'));\nprocess.exitCode = 1;\n`,
      { mode: 0o755 },
    );
    await assert.rejects(
      receiveDirectory({}, ["cp", "owned:/results/.", "-"], destination),
      /Docker transfer exited 1/,
    );
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
    await rm(directory, { recursive: true, force: true });
  }
});

test("native lane dispatch resolves project binaries and preserves literal arguments", async () => {
  const { mkdtemp, mkdir, writeFile, readFile, rm } = await import(
    "node:fs/promises"
  );
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { runNative } = await import("./validation.mjs");
  const directory = await mkdtemp(join(tmpdir(), "jj-validation-dispatch-"));
  try {
    await mkdir(join(directory, "scripts/validation"), { recursive: true });
    await mkdir(join(directory, "node_modules/.bin"), { recursive: true });
    await writeFile(
      join(directory, "scripts/validation/lanes.json"),
      JSON.stringify({ probe: "validation-probe" }),
    );
    await writeFile(
      join(directory, "node_modules/.bin/validation-probe"),
      `#!/usr/bin/env node\nrequire('node:fs').writeFileSync('actual.json',JSON.stringify({args:process.argv.slice(2),runtime:process.env.LAPIS_NOTES_VALIDATION_RUNTIME}));\n`,
      { mode: 0o755 },
    );
    await runNative(
      "probe",
      ["space word", "; echo should-stay-literal"],
      directory,
    );
    assert.deepEqual(
      JSON.parse(await readFile(join(directory, "actual.json"), "utf8")),
      { args: ["space word", "; echo should-stay-literal"], runtime: "native" },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("default browser suites run complete bounded shards without changing explicit targets", async () => {
  const { laneInvocations } = await import("./validation/model.mjs");
  assert.deepEqual(
    laneInvocations("test:storybook", []),
    Array.from({ length: 4 }, (_, i) => [`--shard=${i + 1}/4`]),
  );
  assert.deepEqual(
    laneInvocations("test:storybook", [
      "Example.stories.svelte",
      "--shard=1/2",
    ]),
    [["Example.stories.svelte", "--shard=1/2"]],
  );
  assert.deepEqual(laneInvocations("web:test", []), [[]]);
});

test("explicit archive configuration reaches the isolated install", () => {
  assert.equal(
    validationConfig(
      {},
      { LAPIS_NOTES_VALIDATION_ARCHIVES: "/tmp/packages.json" },
    ).archives,
    "/tmp/packages.json",
  );
});

test("SSH direct mode preserves authentication, port and argument boundaries", async () => {
  const { sshDockerCommand } = await import("./validation/docker.mjs");
  const [, args] = sshDockerCommand(
    "ssh://steve@example.test:2222",
    ["logs", "a; echo unexpected"],
    { multiplexing: false },
  );
  for (const option of [
    "BatchMode=yes",
    "ConnectTimeout=10",
    "ConnectionAttempts=5",
    "ControlMaster=no",
    "ControlPath=none",
  ])
    assert.ok(args.includes(option), option);
  assert.ok(args.includes("2222"));
  assert.ok(!args.includes("ControlMaster=auto"));
  assert.ok(!args.some((value) => value.startsWith("ControlPersist=")));
  assert.equal(args.at(-1), "'docker' 'logs' 'a; echo unexpected'");
});

test("SSH direct mode configuration rejects non-boolean values", async () => {
  const { validationConfig } = await import("./validation/model.mjs");
  assert.equal(
    validationConfig({ sshMultiplexing: false }, {}).sshMultiplexing,
    false,
  );
  assert.equal(
    validationConfig({ sshMultiplexing: true }, {}).sshMultiplexing,
    true,
  );
  assert.throws(
    () => validationConfig({ sshMultiplexing: "off" }, {}),
    /SSH multiplexing/,
  );
});

test("SSH direct mode reuses an explicitly owned control connection", async () => {
  const { sshDockerCommand } = await import("./validation/docker.mjs");
  const [, args] = sshDockerCommand("ssh://steve@example.test", ["info"], {
    multiplexing: false,
    controlPath: "/tmp/owned-ssh-%C",
  });
  assert.ok(args.includes("ControlMaster=no"));
  assert.ok(args.includes("ControlPath=/tmp/owned-ssh-%C"));
  assert.ok(!args.includes("ControlPath=none"));
});

test("SSH direct mode rejects invalid control connection paths", async () => {
  const { validationConfig } = await import("./validation/model.mjs");
  assert.equal(
    validationConfig({ sshControlPath: "/tmp/owned-ssh-%C" }, {})
      .sshControlPath,
    "/tmp/owned-ssh-%C",
  );
  for (const value of ["relative", "", 42, "/tmp/path\ncommand"])
    assert.throws(
      () => validationConfig({ sshControlPath: value }, {}),
      /SSH control path/,
    );
});
