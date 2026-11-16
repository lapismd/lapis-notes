import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  installPublishedConsumer,
  INSTALL_METADATA_ACCEPT,
} from "./lib/registry-consumer-install.mjs";

import {
  runRegistryInstall,
  assertRegistryInstallPlatform,
} from "./lib/registry-install-process.mjs";

const entry = {
  name: "@fixture/readiness",
  version: "1.0.1",
  integrity: "sha512-YQ==",
};
const ready = () =>
  new Response(
    JSON.stringify({
      name: entry.name,
      versions: {
        [entry.version]: { ...entry, dist: { integrity: entry.integrity } },
      },
    }),
  );
function fixture(t) {
  const directory = mkdtempSync(
    path.join(tmpdir(), "notes-registry-readiness-"),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}
const options = (consumerDir, extra = {}) => ({
  consumerDir,
  entries: [entry],
  registry: "https://registry.npmjs.org",
  fetchImpl: ready,
  sleep: async () => {},
  runInstall: async () => {},
  ...extra,
});

test("readiness and installation share one remaining deadline", async (t) => {
  const dir = fixture(t);
  let time = 0,
    probes = 0,
    installed = false;
  await installPublishedConsumer(
    options(dir, {
      now: () => time,
      sleep: async (ms) => {
        time += ms;
      },
      fetchImpl: async () => {
        time += 30_000;
        return ++probes === 1 ? new Response("{}", { status: 404 }) : ready();
      },
      runInstall: async (_dir, cache, remaining, registry) => {
        assert.equal(remaining, 45_000);
        assert.equal(registry, "https://registry.npmjs.org");
        assert.equal(existsSync(cache), true);
        installed = true;
        time += 40_000;
      },
    }),
  );
  assert.equal(installed, true);
  assert.equal(time, 105_000);
});

test("deadline exhaustion fails before another install or metadata request", async (t) => {
  const dir = fixture(t);
  let time = 0,
    installs = 0,
    probes = 0;
  await assert.rejects(
    installPublishedConsumer(
      options(dir, {
        now: () => time,
        fetchImpl: async () => {
          probes++;
          time = 110_000;
          return ready();
        },
        runInstall: async () => {
          installs++;
        },
      }),
    ),
    (error) =>
      error.code === "REGISTRY_READINESS_EXHAUSTED" &&
      /metadata for @fixture\/readiness@1.0.1 after 1\/6/.test(error.message),
  );
  assert.equal(probes, 1);
  assert.equal(installs, 0);
});

test("metadata auth, invalid JSON, identity and certificate errors stop immediately", async (t) => {
  for (const fetchImpl of [
    async () => new Response("denied", { status: 403 }),
    async () => new Response("{"),
    async () => new Response(JSON.stringify({ name: "other", versions: {} })),
    async () => {
      throw Object.assign(new Error("TLS"), {
        cause: { code: "CERT_HAS_EXPIRED" },
      });
    },
  ]) {
    let probes = 0,
      installs = 0,
      sleeps = 0;
    await assert.rejects(
      installPublishedConsumer(
        options(fixture(t), {
          fetchImpl: async (...args) => {
            probes++;
            return fetchImpl(...args);
          },
          runInstall: async () => {
            installs++;
          },
          sleep: async () => {
            sleeps++;
          },
        }),
      ),
    );
    assert.deepEqual([probes, installs, sleeps], [1, 0, 0]);
  }
});

test("typed transient candidate metadata transport can retry", async (t) => {
  let probes = 0,
    sleeps = 0;
  await installPublishedConsumer(
    options(fixture(t), {
      fetchImpl: async () => {
        if (++probes === 1)
          throw Object.assign(new Error("reset"), {
            cause: { code: "ECONNRESET" },
          });
        return ready();
      },
      sleep: async () => {
        sleeps++;
      },
    }),
  );
  assert.deepEqual([probes, sleeps], [2, 1]);
});

test("metadata request timeout consumes the shared budget and fails closed", async (t) => {
  const keepAlive = setInterval(() => {}, 10);
  try {
    await assert.rejects(
      installPublishedConsumer(
        options(fixture(t), {
          budgetMs: 30,
          fetchImpl: async (_url, { signal }) =>
            new Promise((_resolve, reject) =>
              signal.addEventListener("abort", () => reject(signal.reason), {
                once: true,
              }),
            ),
        }),
      ),
      (error) => error.code === "REGISTRY_READINESS_EXHAUSTED",
    );
  } finally {
    clearInterval(keepAlive);
  }
});

test("consumer installation deadline kills its owned process group", async (t) => {
  const dir = fixture(t),
    bin = path.join(dir, "bin"),
    marker = path.join(dir, "descendant-survived");
  mkdirSync(bin);
  writeFileSync(
    path.join(bin, "pnpm"),
    `#!${process.execPath}\nconst {spawn}=require('node:child_process');\nspawn(process.execPath,['-e',${JSON.stringify(`setTimeout(()=>require('node:fs').writeFileSync(${JSON.stringify(marker)},'unexpected'),1200)`)}],{stdio:'inherit'});\nsetInterval(()=>{},1000);\n`,
  );
  chmodSync(path.join(bin, "pnpm"), 0o755);
  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}${path.delimiter}${originalPath}`;
  const started = performance.now();
  try {
    await assert.rejects(
      runRegistryInstall(
        dir,
        path.join(dir, "metadata"),
        400,
        "https://registry.npmjs.org",
      ),
      (error) => error.code === "REGISTRY_INSTALL_TIMEOUT",
    );
  } finally {
    process.env.PATH = originalPath;
  }
  assert(performance.now() - started < 1200);
  await new Promise((resolve) => setTimeout(resolve, 1300));
  assert.equal(
    existsSync(marker),
    false,
    "The descendant must not survive the install timeout",
  );
});

test("real pinned pnpm waits for install-v1 metadata despite an already-ready full packument", async (t) => {
  const dir = fixture(t),
    payload = path.join(dir, "payload"),
    pkg = path.join(payload, "package");
  mkdirSync(pkg, { recursive: true });
  writeFileSync(
    path.join(pkg, "package.json"),
    JSON.stringify({
      name: entry.name,
      version: entry.version,
      main: "index.js",
    }),
  );
  writeFileSync(
    path.join(pkg, "index.js"),
    "module.exports = 'registry fixture';\n",
  );
  const archive = path.join(dir, "fixture.tgz");
  execFileSync("tar", ["-czf", archive, "-C", payload, "package"]);
  const bytes = readFileSync(archive),
    integrity = "sha512-" + createHash("sha512").update(bytes).digest("base64");
  const requests = [];
  let installationRequests = 0,
    registry;
  const metadata = () => ({
    name: entry.name,
    "dist-tags": { latest: entry.version },
    versions: {
      [entry.version]: {
        name: entry.name,
        version: entry.version,
        dist: { tarball: registry + "/fixture.tgz", integrity },
      },
    },
  });
  const server = http.createServer((request, response) => {
    requests.push({ url: request.url, accept: request.headers.accept });
    if (request.url === "/fixture.tgz") {
      response.end(bytes);
      return;
    }
    response.setHeader("content-type", "application/json");
    const abbreviated = request.headers.accept?.startsWith(
      "application/vnd.npm.install-v1+json",
    );
    response.end(
      JSON.stringify(
        abbreviated && ++installationRequests < 3
          ? {
              name: entry.name,
              "dist-tags": { latest: "1.0.0" },
              versions: { "1.0.0": { name: entry.name, version: "1.0.0" } },
            }
          : metadata(),
      ),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  registry = `http://127.0.0.1:${server.address().port}`;
  try {
    const full = await fetch(registry + "/@fixture%2Freadiness", {
      headers: { Accept: "application/json" },
    });
    assert.equal(
      (await full.json()).versions[entry.version].dist.integrity,
      integrity,
    );
    writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({
        private: true,
        packageManager: JSON.parse(
          readFileSync(new URL("../package.json", import.meta.url)),
        ).packageManager,
        dependencies: { [entry.name]: entry.version },
      }),
    );
    // The unguarded client fails even though the full representation is ready.
    await assert.rejects(
      runRegistryInstall(
        dir,
        path.join(dir, "control-metadata"),
        10_000,
        registry,
      ),
      (error) =>
        error.errors?.some(
          (event) =>
            event.code === "ERR_PNPM_NO_MATCHING_VERSION" &&
            event.package?.version === entry.version,
        ),
    );
    const sleeps = [];
    await installPublishedConsumer({
      consumerDir: dir,
      entries: [{ ...entry, integrity }],
      registry,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });
    assert.equal(
      JSON.parse(
        readFileSync(
          path.join(dir, "node_modules", entry.name, "package.json"),
        ),
      ).version,
      entry.version,
    );
    assert.equal(installationRequests, 4);
    assert.deepEqual(sleeps, [5_000]);
    assert(
      requests
        .filter((request) => request.url !== "/fixture.tgz")
        .slice(1)
        .every((request) => request.accept === INSTALL_METADATA_ACCEPT),
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("private verifier rejects unsupported native process cancellation", () => {
  assert.doesNotThrow(() => assertRegistryInstallPlatform("linux"));
  assert.doesNotThrow(() => assertRegistryInstallPlatform("darwin"));
  assert.throws(
    () => assertRegistryInstallPlatform("win32"),
    (error) => error.code === "REGISTRY_INSTALL_PLATFORM",
  );
});
