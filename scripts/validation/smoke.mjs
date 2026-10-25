import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chromium, webkit } from "playwright";

assert.equal(process.platform, "linux");
for (const tool of ["node", "pnpm", "jj", "mdbook"])
  console.log(execFileSync(tool, ["--version"], { encoding: "utf8" }).trim());
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
console.log("Container source, tools and Chromium/WebKit smoke passed.");
