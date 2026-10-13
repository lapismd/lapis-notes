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
import { verifyPublishedPackages } from "./verify-release.mjs";

function fixture(t) {
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
  const pnpm = path.join(bin, "pnpm");
  writeFileSync(
    pnpm,
    `#!${process.execPath}\nconst fs = require('node:fs');\nif (process.argv[2] === 'install') fs.writeFileSync(process.env.LAPIS_CONSUMER_POLICY_CAPTURE, JSON.stringify({\n  package: JSON.parse(fs.readFileSync('package.json', 'utf8')),\n  workspace: fs.existsSync('pnpm-workspace.yaml') ? fs.readFileSync('pnpm-workspace.yaml', 'utf8') : null,\n  files: fs.readdirSync('.'),\n}));\n`,
  );
  chmodSync(pnpm, 0o755);
  function verify() {
    const previousPath = process.env.PATH;
    const previousCapture = process.env.LAPIS_CONSUMER_POLICY_CAPTURE;
    process.env.PATH = `${bin}${path.delimiter}${previousPath}`;
    process.env.LAPIS_CONSUMER_POLICY_CAPTURE = capturePath;
    try {
      verifyPublishedPackages({
        repoRoot,
        manifest,
        manifestPath: path.join(repoRoot, "release-manifest.json"),
      });
    } finally {
      process.env.PATH = previousPath;
      if (previousCapture === undefined)
        delete process.env.LAPIS_CONSUMER_POLICY_CAPTURE;
      else process.env.LAPIS_CONSUMER_POLICY_CAPTURE = previousCapture;
    }
    return JSON.parse(readFileSync(capturePath, "utf8"));
  }
  return { repoRoot, capturePath, verify };
}

test("consumer install receives the root's exact packageManager pin", (t) => {
  const { repoRoot, verify } = fixture(t);
  assert.equal(verify().package.packageManager, "pnpm@10.34.5");
  writeFileSync(
    path.join(repoRoot, "package.json"),
    JSON.stringify({ packageManager: "pnpm@10.33.1" }),
  );
  assert.equal(verify().package.packageManager, "pnpm@10.33.1");
});

test("consumer install receives only the approved dependency-build policy", (t) => {
  const { verify } = fixture(t);
  const result = verify();
  assert.equal(typeof result.workspace, "string");
  assert.deepEqual(parse(result.workspace), {
    onlyBuiltDependencies: ["esbuild", "protobufjs"],
  });
  assert.equal(result.files.includes(".pnpmfile.cjs"), false);
  assert.equal(result.files.includes("patches"), false);
  assert.equal("pnpm" in result.package, false);
});

test("missing or unpinned package managers fail before installation", (t) => {
  const { repoRoot, capturePath, verify } = fixture(t);
  for (const packageManager of [undefined, "pnpm@latest", "pnpm@^10.34.5"]) {
    writeFileSync(
      path.join(repoRoot, "package.json"),
      JSON.stringify({ packageManager }),
    );
    assert.throws(verify, /exact pnpm packageManager pin/);
    assert.equal(existsSync(capturePath), false);
  }
});

test("an invalid approved-build list fails before installation", (t) => {
  const { repoRoot, capturePath, verify } = fixture(t);
  for (const policy of [
    "onlyBuiltDependencies: true\n",
    "onlyBuiltDependencies: [esbuild, 1]\n",
    "onlyBuiltDependencies: ['']\n",
  ]) {
    writeFileSync(path.join(repoRoot, "pnpm-workspace.yaml"), policy);
    assert.throws(verify, /approved onlyBuiltDependencies list/);
    assert.equal(existsSync(capturePath), false);
  }
});
