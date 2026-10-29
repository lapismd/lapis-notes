import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  chmodSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, webkit } from "playwright";

assert.equal(process.platform, "linux");
for (const tool of ["node", "pnpm", "jj", "mdbook"])
  console.log(execFileSync(tool, ["--version"], { encoding: "utf8" }).trim());
const directory = mkdtempSync(join(tmpdir(), "lapis-validation-permissions-"));
const file = join(directory, "private.txt");
try {
  writeFileSync(file, "Permission smoke fixture");
  chmodSync(file, 0o000);
  assert.throws(
    () => readFileSync(file),
    { code: "EACCES" },
    "Worker capabilities must not bypass denied file reads",
  );
  chmodSync(directory, 0o000);
  assert.throws(
    () => writeFileSync(join(directory, "blocked.txt"), "blocked"),
    { code: "EACCES" },
    "Worker capabilities must not bypass denied directory writes",
  );
  assert.match(readFileSync("/proc/self/status", "utf8"), /^CapEff:\s+0+$/m);
} finally {
  chmodSync(directory, 0o700);
  chmodSync(file, 0o600);
  rmSync(directory, { recursive: true, force: true });
}
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent("<button>Container browser ready</button>");
    assert.equal(
      await page.getByRole("button").textContent(),
      "Container browser ready",
    );
  } finally {
    await browser.close();
  }
}
console.log(
  "Container source, tools, denied filesystem access and Chromium/WebKit smoke passed.",
);
