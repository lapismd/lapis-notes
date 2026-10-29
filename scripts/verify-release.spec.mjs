import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parse } from "yaml";
import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";
import {
  REGISTRY_INSTALL_RETRY_DELAYS_MS,
  verifyPublishedPackages,
} from "./verify-release.mjs";

function fixture(t, options = {}) {
  const repoRoot = mkdtempSync(
    path.join(tmpdir(), "lapis-release-consumer-policy-"),
  );
  t.after(() => rmSync(repoRoot, { recursive: true, force: true }));
  writeFileSync(
    path.join(repoRoot, "package.json"),
    JSON.stringify({ packageManager: "pnpm@10.34.5" }),
  );
  writeFileSync(
    path.join(repoRoot, "pnpm-workspace.yaml"),
    'packages: ["packages/*"]\nonlyBuiltDependencies: [esbuild, protobufjs]\noverrides: { vite: "1.0.0" }\npatchedDependencies: { "bits-ui@2.19.5": "patches/local.patch" }\nlinkWorkspacePackages: true\n',
  );
  writeFileSync(
    path.join(repoRoot, ".pnpmfile.cjs"),
    "throw new Error('Local hook must never reach the consumer');\n",
  );
  for (const definition of PUBLIC_PACKAGE_GRAPH) {
    const directory = path.join(repoRoot, "packages", definition.directory);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, "package.json"),
      JSON.stringify({ name: definition.name, version: "0.1.0" }),
    );
  }
  const manifest = {
    schemaVersion: 1,
    repository: "lapismd/lapis-notes",
    commit: "abc123",
    artifactName: "lapis-notes-release-abc123",
    registry: "https://registry.npmjs.org",
    bootstrapRequired: false,
    packages: [
      {
        name: "@lapis-notes/ui",
        directory: "ui",
        version: "0.1.0",
        tag: "next",
        dependencies: [],
        registryEmpty: false,
        shouldPublish: false,
        tarball: "tarballs/lapis-notes-ui-0.1.0.tgz",
        shasum: "a".repeat(64),
        integrity: "sha512-aaaa",
        size: 1,
        files: ["package/package.json"],
      },
    ],
  };
  const capturePath = path.join(repoRoot, "capture.json");
  const bin = path.join(repoRoot, "bin");
  mkdirSync(bin);
  const attemptFile = path.join(bin, "install-attempts");
  const pnpm = path.join(bin, "pnpm");
  writeFileSync(
    pnpm,
    `#!${process.execPath}
const fs = require('node:fs');
if (process.argv[2] !== 'install') process.exit(0);
const attemptFile = ${JSON.stringify(attemptFile)};
const count = fs.existsSync(attemptFile) ? Number(fs.readFileSync(attemptFile, 'utf8')) : 0;
fs.writeFileSync(attemptFile, String(count + 1));
const failures = Number(process.env.LAPIS_REGISTRY_INSTALL_FAILURES || 0);
if (count < failures) {
  console.error(process.env.LAPIS_REGISTRY_INSTALL_ERROR || 'ERR_PNPM_NO_MATCHING_VERSION No matching version found for @lapis-notes/ui@0.1.0');
  process.exit(1);
}
fs.writeFileSync(process.env.LAPIS_CONSUMER_POLICY_CAPTURE, JSON.stringify({
  package: JSON.parse(fs.readFileSync('package.json', 'utf8')),
  workspace: fs.existsSync('pnpm-workspace.yaml') ? fs.readFileSync('pnpm-workspace.yaml', 'utf8') : null,
  files: fs.readdirSync('.'),
}));
`,
  );
  chmodSync(pnpm, 0o755);
  async function verify() {
    const previousPath = process.env.PATH;
    const previousCapture = process.env.LAPIS_CONSUMER_POLICY_CAPTURE;
    const previousFailures = process.env.LAPIS_REGISTRY_INSTALL_FAILURES;
    const previousError = process.env.LAPIS_REGISTRY_INSTALL_ERROR;
    process.env.PATH = `${bin}${path.delimiter}${previousPath}`;
    process.env.LAPIS_CONSUMER_POLICY_CAPTURE = capturePath;
    if (options.installFailures === undefined) {
      delete process.env.LAPIS_REGISTRY_INSTALL_FAILURES;
    } else {
      process.env.LAPIS_REGISTRY_INSTALL_FAILURES = String(
        options.installFailures,
      );
    }
    if (options.installError === undefined) {
      delete process.env.LAPIS_REGISTRY_INSTALL_ERROR;
    } else process.env.LAPIS_REGISTRY_INSTALL_ERROR = options.installError;
    try {
      await verifyPublishedPackages({
        repoRoot,
        manifest,
        manifestPath: path.join(repoRoot, "release-manifest.json"),
        sleep: options.sleep,
      });
    } finally {
      process.env.PATH = previousPath;
      if (previousCapture === undefined)
        delete process.env.LAPIS_CONSUMER_POLICY_CAPTURE;
      else process.env.LAPIS_CONSUMER_POLICY_CAPTURE = previousCapture;
      if (previousFailures === undefined)
        delete process.env.LAPIS_REGISTRY_INSTALL_FAILURES;
      else process.env.LAPIS_REGISTRY_INSTALL_FAILURES = previousFailures;
      if (previousError === undefined)
        delete process.env.LAPIS_REGISTRY_INSTALL_ERROR;
      else process.env.LAPIS_REGISTRY_INSTALL_ERROR = previousError;
    }
    return JSON.parse(readFileSync(capturePath, "utf8"));
  }
  return { repoRoot, capturePath, verify };
}

test("consumer install receives the root's exact packageManager pin", async (t) => {
  const { repoRoot, verify } = fixture(t);
  assert.equal((await verify()).package.packageManager, "pnpm@10.34.5");
  writeFileSync(
    path.join(repoRoot, "package.json"),
    JSON.stringify({ packageManager: "pnpm@10.33.1" }),
  );
  assert.equal((await verify()).package.packageManager, "pnpm@10.33.1");
});

test("consumer install receives only the approved dependency-build policy", async (t) => {
  const { verify } = fixture(t);
  const result = await verify();
  assert.equal(typeof result.workspace, "string");
  assert.deepEqual(parse(result.workspace), {
    onlyBuiltDependencies: ["esbuild", "protobufjs"],
  });
  assert.equal(result.files.includes(".pnpmfile.cjs"), false);
  assert.equal(result.files.includes("patches"), false);
  assert.equal("pnpm" in result.package, false);
});

test("missing or unpinned package managers fail before installation", async (t) => {
  const { repoRoot, capturePath, verify } = fixture(t);
  for (const packageManager of [undefined, "pnpm@latest", "pnpm@^10.34.5"]) {
    writeFileSync(
      path.join(repoRoot, "package.json"),
      JSON.stringify({ packageManager }),
    );
    await assert.rejects(verify, /exact pnpm packageManager pin/);
    assert.equal(existsSync(capturePath), false);
  }
});

test("an invalid approved-build list fails before installation", async (t) => {
  const { repoRoot, capturePath, verify } = fixture(t);
  for (const policy of [
    "onlyBuiltDependencies: true\n",
    "onlyBuiltDependencies: [esbuild, 1]\n",
    "onlyBuiltDependencies: ['']\n",
  ]) {
    writeFileSync(path.join(repoRoot, "pnpm-workspace.yaml"), policy);
    await assert.rejects(verify, /approved onlyBuiltDependencies list/);
    assert.equal(existsSync(capturePath), false);
  }
});

test("retries a pending registry install with short backoff", async (t) => {
  const delays = [];
  const { verify } = fixture(t, {
    installFailures: 1,
    sleep: async (ms) => {
      delays.push(ms);
    },
  });
  assert.equal(
    REGISTRY_INSTALL_RETRY_DELAYS_MS.reduce((total, delay) => total + delay, 0) <
      120_000,
    true,
  );
  await verify();
  assert.deepEqual(delays, [REGISTRY_INSTALL_RETRY_DELAYS_MS[0]]);
});

test("does not retry an unrelated install failure", async (t) => {
  const delays = [];
  const { verify } = fixture(t, {
    installFailures: 1,
    installError: "ELIFECYCLE unrelated install failure",
    sleep: async (ms) => {
      delays.push(ms);
    },
  });
  await assert.rejects(verify, /unrelated install failure/);
  assert.deepEqual(delays, []);
});

test("stops after the bounded pending-install retries", async (t) => {
  const delays = [];
  const { verify } = fixture(t, {
    installFailures: REGISTRY_INSTALL_RETRY_DELAYS_MS.length + 1,
    sleep: async (ms) => {
      delays.push(ms);
    },
  });
  await assert.rejects(verify, /ERR_PNPM_NO_MATCHING_VERSION/);
  assert.deepEqual(delays, REGISTRY_INSTALL_RETRY_DELAYS_MS);
});
