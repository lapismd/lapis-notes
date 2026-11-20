import assert from "node:assert/strict";
import "./registry-install-controls.spec.mjs";
import { sharedReadiness } from "./registry-readiness.fixture.mjs";
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
        tag: "latest",
        dependencies: [],
        registryEmpty: false,
        shouldPublish: false,
        tarball: "tarballs/lapis-notes-ui-0.1.0.tgz",
        shasum: "a".repeat(64),
        integrity: "sha512-" + Buffer.alloc(64, 1).toString("base64"),
        size: 1,
        files: ["package/package.json"],
      },
    ],
  };
  const capturePath = path.join(repoRoot, "capture.json");
  const bin = path.join(repoRoot, "bin");
  mkdirSync(bin);
  const attemptFile = path.join(bin, "install-attempts");
  const cacheTrace = path.join(bin, "metadata-caches.json");
  const pnpm = path.join(bin, "pnpm");
  writeFileSync(
    pnpm,
    `#!${process.execPath}
const fs = require('node:fs');
if (process.argv[2] === '--version') { console.log(${JSON.stringify(options.installedPnpmVersion)} ?? JSON.parse(fs.readFileSync('package.json','utf8')).packageManager.slice(5).split('+')[0]); process.exit(0); }
if (process.argv[2] !== 'install') process.exit(0);
const attemptFile = ${JSON.stringify(attemptFile)};
const count = fs.existsSync(attemptFile) ? Number(fs.readFileSync(attemptFile, 'utf8')) : 0;
fs.writeFileSync(attemptFile, String(count + 1));
const failures = Number(process.env.LAPIS_REGISTRY_INSTALL_FAILURES || 0);
const cacheIndex = process.argv.indexOf('--cache-dir');
const cacheDir = cacheIndex >= 0 ? process.argv[cacheIndex + 1] : null;
const cacheTrace = ${JSON.stringify(cacheTrace)};
const caches = fs.existsSync(cacheTrace) ? JSON.parse(fs.readFileSync(cacheTrace, 'utf8')) : [];
fs.writeFileSync(cacheTrace, JSON.stringify([...caches, cacheDir]));
if (${JSON.stringify(options.staleMetadata ?? false)}) {
  if (!cacheDir || fs.existsSync(require('node:path').join(cacheDir, 'unavailable-version.json'))) {
    console.error('ERR_PNPM_NO_MATCHING_VERSION Cached metadata omits the just-published version');
    process.exit(1);
  }
  if (count < failures) fs.writeFileSync(require('node:path').join(cacheDir, 'unavailable-version.json'), '{}');
}
if (count < failures) {
  if (process.env.LAPIS_REGISTRY_INSTALL_ERROR) console.error(process.env.LAPIS_REGISTRY_INSTALL_ERROR);
  else if (process.argv.includes('--reporter=ndjson')) console.error(JSON.stringify({level:'error',name:'pnpm',code:'ERR_PNPM_NO_MATCHING_VERSION',package:{name:'@lapis-notes/ui',version:'0.1.0',bareSpecifier:'0.1.0'}}));
  else console.error('ERR_PNPM_NO_MATCHING_VERSION No matching version found for @lapis-notes/ui@0.1.0');
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
        now: options.now,
        fetchImpl:
          options.fetchImpl ??
          (async () =>
            new Response(
              JSON.stringify({
                name: "@lapis-notes/ui",
                versions: {
                  "0.1.0": {
                    name: "@lapis-notes/ui",
                    version: "0.1.0",
                    dist: {
                      integrity:
                        "sha512-" + Buffer.alloc(64, 1).toString("base64"),
                    },
                  },
                },
              }),
            )),
        readiness: sharedReadiness,
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
  return {
    repoRoot,
    capturePath,
    verify,
    caches: () => JSON.parse(readFileSync(cacheTrace, "utf8")),
  };
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

test("installed pnpm drift stops before consumer installation and cannot retry", async (t) => {
  const delays = [];
  const { verify, capturePath } = fixture(t, {
    installedPnpmVersion: "10.34.4",
    sleep: async (ms) => delays.push(ms),
  });
  await assert.rejects(
    verify,
    (error) => error.code === "REGISTRY_INSTALL_TOOL",
  );
  assert.equal(existsSync(capturePath), false);
  assert.deepEqual(delays, []);
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
    REGISTRY_INSTALL_RETRY_DELAYS_MS.reduce(
      (total, delay) => total + delay,
      0,
    ) < 120_000,
    true,
  );
  await verify();
  assert.deepEqual(delays, [REGISTRY_INSTALL_RETRY_DELAYS_MS[0]]);
});

test("fresh published consumers bypass stale registry metadata without waiting for cache expiry", async (t) => {
  const delays = [];
  const { verify } = fixture(t, {
    staleMetadata: true,
    sleep: async (ms) => delays.push(ms),
  });
  const result = await verify();
  assert.equal(result.package.dependencies["@lapis-notes/ui"], "0.1.0");
  assert.deepEqual(
    delays,
    [],
    "Fresh registry metadata must be requested on the first probe",
  );
});

test("pending publication retries do not reuse a failed probe's metadata cache", async (t) => {
  const delays = [];
  const { verify, caches } = fixture(t, {
    staleMetadata: true,
    installFailures: 1,
    sleep: async (ms) => delays.push(ms),
  });
  await verify();
  assert.deepEqual(delays, [REGISTRY_INSTALL_RETRY_DELAYS_MS[0]]);
  assert.equal(caches().length, 2);
  assert.notEqual(caches()[0], caches()[1]);
  for (const cache of caches())
    assert.equal(
      existsSync(cache),
      false,
      "Temporary metadata caches must be removed after every probe",
    );
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
  await assert.rejects(
    verify,
    (error) =>
      error.code === "REGISTRY_INSTALL_FAILED" &&
      error.stderr.includes("unrelated install failure"),
  );
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
  await assert.rejects(
    verify,
    (error) =>
      error.code === "REGISTRY_READINESS_EXHAUSTED" &&
      error.cause?.code === "REGISTRY_INSTALL_FAILED" &&
      error.cause.stderr.includes("ERR_PNPM_NO_MATCHING_VERSION"),
  );
  assert.deepEqual(delays, REGISTRY_INSTALL_RETRY_DELAYS_MS);
});

test("installation metadata must expose the exact candidate before pnpm runs", async (t) => {
  let probes = 0;
  const delays = [];
  const { verify, capturePath } = fixture(t, {
    sleep: async (ms) => {
      delays.push(ms);
      assert.equal(existsSync(capturePath), false);
    },
    fetchImpl: async (_url, options) => {
      assert.match(
        options.headers.Accept,
        /^application\/vnd\.npm\.install-v1\+json/,
      );
      probes += 1;
      return new Response(
        JSON.stringify({
          name: "@lapis-notes/ui",
          versions:
            probes === 1
              ? {}
              : {
                  "0.1.0": {
                    name: "@lapis-notes/ui",
                    version: "0.1.0",
                    dist: {
                      integrity:
                        "sha512-" + Buffer.alloc(64, 1).toString("base64"),
                    },
                  },
                },
        }),
      );
    },
  });
  await verify();
  assert.equal(probes, 2);
  assert.deepEqual(delays, [REGISTRY_INSTALL_RETRY_DELAYS_MS[0]]);
});

test("installation metadata integrity mismatches stop before consumer installation", async (t) => {
  const delays = [];
  const { verify, capturePath } = fixture(t, {
    sleep: async (ms) => delays.push(ms),
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          name: "@lapis-notes/ui",
          versions: {
            "0.1.0": {
              name: "@lapis-notes/ui",
              version: "0.1.0",
              dist: { integrity: "sha512-other" },
            },
          },
        }),
      ),
  });
  await assert.rejects(verify, /integrity/i);
  assert.equal(existsSync(capturePath), false);
  assert.deepEqual(delays, []);
});

test("missing versions outside the candidate cohort do not retry", async (t) => {
  const delays = [];
  const { verify } = fixture(t, {
    installFailures: 1,
    installError: JSON.stringify({
      level: "error",
      name: "pnpm",
      code: "ERR_PNPM_NO_MATCHING_VERSION",
      package: { name: "unrelated", version: "9.9.9", bareSpecifier: "9.9.9" },
    }),
    sleep: async (ms) => delays.push(ms),
  });
  await assert.rejects(
    verify,
    (error) =>
      error.code === "REGISTRY_INSTALL_FAILED" &&
      JSON.parse(error.stderr).package.name === "unrelated",
  );
  assert.deepEqual(delays, []);
});
