import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmod,
  cp,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";

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
    for (const definition of PUBLIC_PACKAGE_GRAPH) {
      const relative = `packages/${definition.directory}/package.json`;
      await mkdir(path.dirname(path.join(fixture, relative)), {
        recursive: true,
      });
      await copyFile(
        new URL(`../${relative}`, import.meta.url),
        path.join(fixture, relative),
      );
    }
    await cp(
      new URL("../spec/src", import.meta.url),
      path.join(fixture, "spec/src"),
      { recursive: true },
    );
    for (const relative of [
      "spec-validator.config.mjs",
      "scripts/public-packages.mjs",
      "scripts/release-spec-versions.mjs",
    ]) {
      const source = new URL(`../${relative}`, import.meta.url);
      if (existsSync(source))
        await copyFile(source, path.join(fixture, relative));
    }
    await mkdir(path.join(fixture, "node_modules/@lapismd"), {
      recursive: true,
    });
    for (const name of ["semver", "@lapismd/spec-validator"]) {
      await symlink(
        fileURLToPath(new URL(`../node_modules/${name}`, import.meta.url)),
        path.join(fixture, "node_modules", name),
        "dir",
      );
    }
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
    if (existsSync(new URL("./release-spec-versions.mjs", import.meta.url))) {
      const { sourceVersionFacts, renderVersionFacts } = await import(
        "./release-spec-versions.mjs"
      );
      for (const [relative, facts] of Object.entries(
        sourceVersionFacts(fixture),
      )) {
        const file = path.join(fixture, relative),
          source = await readFile(file, "utf8");
        await writeFile(
          file,
          source.replace(
            /<!-- notes-release-versions:start -->[\s\S]*?<!-- notes-release-versions:end -->/,
            renderVersionFacts(facts),
          ),
        );
      }
    }
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
    const canonical = await readFile(
      path.join(fixture, "spec/src/architecture/dependency-boundaries.md"),
      "utf8",
    );
    const versionFacts = canonical.match(
      /<!-- notes-release-versions:start -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- notes-release-versions:end -->/,
    );
    assert.ok(
      versionFacts,
      "version preparation must carry mapped canonical source versions",
    );
    assert.equal(JSON.parse(versionFacts[1]).packages[metadata.name], "1.2.4");
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
