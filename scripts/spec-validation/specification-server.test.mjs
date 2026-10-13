import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

test("development specification server starts without sibling release artifacts", (t) => {
  const configEnv = { ...process.env, CI: "true", SPECIFICATION_PORT: "7390" };
  delete configEnv.SPECIFICATION_STATIC;
  delete configEnv.SPECIFICATION_BASE_URL;
  const config = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      'import config from "./playwright.specification.config.ts"; console.log(JSON.stringify(config.webServer));',
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: configEnv,
    },
  );
  assert.equal(config.status, 0, config.stderr);
  const server = JSON.parse(config.stdout);
  assert.equal(server.reuseExistingServer, false);
  assert.equal(server.url, "http://127.0.0.1:7390/index.json");
  const temporary = mkdtempSync(path.join(tmpdir(), "lapis-spec-server-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, "workspace", "lapis-notes");
  mkdirSync(path.join(root, "scripts"), { recursive: true });
  mkdirSync(path.join(root, "bin"));
  const manifest = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  );
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ type: "module", scripts: manifest.scripts }),
  );
  for (const file of ["with-storybook-env.mjs", "storybook-local-env.mjs"])
    writeFileSync(
      path.join(root, "scripts", file),
      readFileSync(path.join(repoRoot, "scripts", file)),
    );
  writeFileSync(
    path.join(root, "scripts/prepare-local-plugin-consumer.mjs"),
    'import { readFileSync } from "node:fs"; readFileSync("../lapis-plugins/.release/npm/manifest.json");\n',
  );
  writeFileSync(
    path.join(root, "scripts/storybook-run.mjs"),
    'import { writeFileSync } from "node:fs"; writeFileSync(process.env.LAPIS_SPEC_SERVER_CAPTURE, JSON.stringify({ port: process.env.STORYBOOK_PORT, visualPort: process.env.VISUAL_SERVER_PORT, args: process.argv.slice(2) }));\n',
  );
  const pnpm = path.join(root, "bin/pnpm");
  writeFileSync(
    pnpm,
    `#!${process.execPath}\nimport fs from 'node:fs'; import cp from 'node:child_process';\nconst script = JSON.parse(fs.readFileSync('package.json','utf8')).scripts[process.argv[2]];\nif (!script) throw new Error('Unknown script: '+process.argv[2]);\nconst result = cp.spawnSync(script, { shell: true, stdio: 'inherit', env: process.env }); process.exit(result.status ?? 1);\n`,
  );
  chmodSync(pnpm, 0o755);
  const capture = path.join(root, "started.json");
  const started = spawnSync(server.command, {
    shell: true,
    cwd: root,
    encoding: "utf8",
    timeout: 10000,
    env: {
      ...process.env,
      PATH: `${path.join(root, "bin")}${path.delimiter}${process.env.PATH}`,
      LAPIS_SPEC_SERVER_CAPTURE: capture,
    },
  });
  assert.equal(started.status, 0, started.stderr + started.stdout);
  assert.deepEqual(JSON.parse(readFileSync(capture, "utf8")), {
    port: "7390",
    visualPort: "7391",
    args: ["--no-open"],
  });
});
