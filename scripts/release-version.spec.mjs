import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("versioning regenerates host metadata before preparing clean archives", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "notes-version-host-"));
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  const svelte = JSON.parse(
    await readFile(
      new URL("../node_modules/svelte/package.json", import.meta.url),
      "utf8",
    ),
  );
  try {
    for (const directory of [
      "bin",
      "scripts",
      "node_modules/svelte",
      "packages/api/src/lib/generated",
    ])
      await mkdir(path.join(fixture, directory), { recursive: true });
    const metadata = {
      name: "@lapis-notes/api",
      version: "1.2.3",
      peerDependencies: { svelte: svelte.version },
      exports: { ".": "./dist/index.js", "./editor": "./dist/editor.js" },
    };
    await writeFile(
      path.join(fixture, "packages/api/package.json"),
      JSON.stringify(metadata),
    );
    await writeFile(
      path.join(fixture, "node_modules/svelte/package.json"),
      JSON.stringify(svelte),
    );
    await writeFile(
      path.join(fixture, "scripts/plugin-host-modules.config.json"),
      "{}",
    );
    await copyFile(
      new URL("./generate-plugin-host-modules.mjs", import.meta.url),
      path.join(fixture, "scripts/generate-plugin-host-modules.mjs"),
    );
    const generate = () =>
      execFileSync(
        process.execPath,
        ["scripts/generate-plugin-host-modules.mjs"],
        { cwd: fixture, stdio: "pipe" },
      );
    generate();
    const readRegistry = async () => {
      const source = await readFile(
        path.join(
          fixture,
          "packages/api/src/lib/generated/plugin-host-modules.schema.generated.ts",
        ),
        "utf8",
      );
      return JSON.parse(
        source
          .split("export const pluginHostModuleRegistry = ")[1]
          .split(" as const;")[0],
      );
    };
    assert.equal((await readRegistry())[metadata.name].version, "1.2.3");

    // External package-manager/versioning tools are isolated; the actual
    // repository version recipe and host-module generator execute unchanged.
    const tools = {
      pnpm: `if (!["release:check", "install"].includes(process.argv[2])) process.exit(2);`,
      changeset: `const fs = require("node:fs"); const file = "packages/api/package.json"; const pkg = JSON.parse(fs.readFileSync(file)); pkg.version = "1.2.4"; fs.writeFileSync(file, JSON.stringify(pkg));`,
    };
    for (const [name, source] of Object.entries(tools)) {
      const file = path.join(fixture, "bin", name);
      await writeFile(file, `#!${process.execPath}\n${source}\n`);
      await chmod(file, 0o755);
    }
    execFileSync("/bin/sh", ["-c", packageJson.scripts["release:version"]], {
      cwd: fixture,
      env: {
        ...process.env,
        PATH: path.join(fixture, "bin") + path.delimiter + process.env.PATH,
      },
      stdio: "pipe",
    });
    const registry = await readRegistry();
    for (const specifier of [metadata.name, `${metadata.name}/editor`])
      assert.equal(registry[specifier].version, "1.2.4", specifier);
    const beforeBuild = await readFile(
      path.join(
        fixture,
        "packages/api/src/lib/generated/plugin-host-modules.schema.generated.ts",
      ),
      "utf8",
    );
    generate();
    assert.equal(
      await readFile(
        path.join(
          fixture,
          "packages/api/src/lib/generated/plugin-host-modules.schema.generated.ts",
        ),
        "utf8",
      ),
      beforeBuild,
      "a later package build leaves committed metadata unchanged",
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
