import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const phase = process.argv[2];
assert.ok(["create", "reopen"].includes(phase), "Unknown image browser phase");
const fixture = JSON.parse(
  await readFile(join(dirname(fileURLToPath(import.meta.url)), "fixture.json")),
);
const secret = [];
for await (const bytes of process.stdin) {
  secret.push(bytes);
  assert.ok(secret.reduce((n, value) => n + value.length, 0) <= 1024);
}
const password = Buffer.concat(secret).toString("utf8").trim();
assert.ok(password.length > 0, "An isolated bootstrap secret is required");
const redact = (text) => String(text).replaceAll(password, "[redacted]");
const cli = realpathSync(
  execFileSync("which", ["playwright"], { encoding: "utf8" }).trim(),
);
const modules = execFileSync("pnpm", ["root", "--global"], {
  encoding: "utf8",
  env: { ...process.env, PNPM_HOME: dirname(cli) },
}).trim();
const { chromium } = createRequire(join(modules, "driver.cjs"))("playwright");
assert.ok(
  chromium,
  "The tool image must export Chromium from its Playwright CLI",
);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: "block" });
const page = await context.newPage();
page.setDefaultTimeout(30_000);
const checks = [],
  failedAssets = [],
  errors = [];
page.on("pageerror", (error) => errors.push(redact(error.message)));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(redact(message.text()));
});
page.on("response", (response) => {
  const url = new URL(response.url());
  if (
    url.origin === fixture.origin &&
    !url.pathname.startsWith("/api/") &&
    response.status() >= 400
  )
    failedAssets.push(`${response.status()} ${url.pathname}`);
});
async function check(name, body) {
  await body();
  checks.push(name);
}
async function poll(body, expected) {
  const until = Date.now() + 30_000;
  while (Date.now() < until) {
    if ((await body()) === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(await body(), expected);
}
let vaultId;
let model;
await mkdir("/results", { recursive: true });
try {
  await check("native origin and isolation", async () => {
    const response = await page.goto(
      `${fixture.origin}/notes/image-acceptance`,
    );
    assert.equal(response.status(), 200);
    assert.equal(
      response.headers()["cross-origin-opener-policy"],
      "same-origin",
    );
    assert.equal(
      response.headers()["cross-origin-embedder-policy"],
      "require-corp",
    );
    await poll(
      () => page.locator("html").getAttribute("data-runtime"),
      "rust-server",
    );
    assert.equal(await page.evaluate(() => window.crossOriginIsolated), true);
    assert.equal(
      await page.evaluate(
        async () => (await navigator.serviceWorker.getRegistrations()).length,
      ),
      0,
    );
    for (const [path, status] of [
      ["healthz", "ok"],
      ["readyz", "ready"],
    ]) {
      const health = await page.request.get(`${fixture.origin}/${path}`);
      assert.equal(health.status(), 200);
      assert.deepEqual(await health.json(), { status });
    }
  });
  await check("retained login and chooser", async () => {
    await page.getByLabel("Username").fill("owner");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page
      .getByRole("heading", { name: "Your vaults", exact: true })
      .waitFor();
  });
  await check(
    phase === "create" ? "managed vault creation" : "cold managed vault reopen",
    async () => {
      const [response] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.request().method() === "POST" &&
            /\/vaults\/[^/]+\/clients$/u.test(new URL(response.url()).pathname),
        ),
        (async () => {
          if (phase === "create") {
            await page
              .getByRole("button", { name: "Create New Vault" })
              .click();
            const dialog = page.getByRole("dialog", {
              name: "New Server Vault",
              exact: true,
            });
            await dialog.getByLabel("Name").fill(fixture.name);
            const created = page.waitForResponse(
              (response) =>
                response.request().method() === "POST" &&
                new URL(response.url()).pathname === "/api/v3/vaults",
            );
            await dialog
              .getByRole("button", { name: "Create vault", exact: true })
              .click();
            const response = await created;
            assert.equal(response.status(), 201);
            vaultId = (await response.json()).vault_id;
          } else {
            await page
              .getByRole("button", {
                name: `Open ${fixture.name}`,
                exact: true,
              })
              .click();
            vaultId = fixture.vaultId;
          }
        })(),
      ]);
      assert.equal(response.status(), 200);
      const descriptor = await response.json();
      assert.equal(descriptor.vault_id, vaultId);
      fixture.clientId = descriptor.client_id;
      await page.getByText("Server DB", { exact: true }).waitFor();
    },
  );
  await check(
    phase === "create"
      ? "retained editor persists exact bytes"
      : "cold editor retains exact bytes",
    async () => {
      if (phase === "create")
        await page
          .getByRole("button", { name: "Create File", exact: true })
          .click();
      else await page.locator(`button[data-path="${fixture.path}"]`).click();
      const editor = page.locator(".cm-content[contenteditable=true]").last();
      await editor.waitFor();
      if (phase === "create") await editor.fill(fixture.text);
      else
        assert.ok(
          (await editor.innerText()).includes(
            fixture.text.split("\n")[0].replace(/^#+\s*/u, ""),
          ),
        );
      await poll(async () => {
        const response = await page.request.get(
          `${fixture.origin}/api/v3/clients/${fixture.clientId}/files/${encodeURIComponent(fixture.path)}`,
          { headers: { "x-lapis-protocol": "3", origin: fixture.origin } },
        );
        assert.equal(response.status(), 200);
        return response.text();
      }, fixture.text);
      await page.screenshot({ path: `/results/${phase}.png` });
      assert.deepEqual(failedAssets, []);
    },
  );
  if (fixture.onnx) {
    const { imageModelPhase } = await import("./model.mjs");
    const result = await imageModelPhase({
      request: page.request,
      origin: fixture.origin,
      phase: phase === "create" ? "seed" : "check",
      state: fixture.model,
    });
    model = result.state;
    checks.push(...result.checks);
  }
  await check("guarded clean sign out", async () => {
    await page.getByRole("button", { name: /Current workspace:/ }).click();
    await page
      .getByRole("menuitem", { name: "Manage Vaults", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Your vaults", exact: true })
      .waitFor();
    const released = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        new URL(response.url()).pathname ===
          `/api/v3/clients/${fixture.clientId}`,
    );
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    assert.equal((await released).status(), 204);
    await page.getByLabel("Username").waitFor();
  });
  const result = {
    schema: 1,
    phase,
    vaultId,
    path: fixture.path,
    checks,
    ...(fixture.onnx ? { model } : {}),
    sha256: createHash("sha256").update(fixture.text).digest("hex"),
  };
  await writeFile(
    "/results/result.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log("RESULT " + JSON.stringify(result));
} catch (error) {
  await page
    .screenshot({
      path: "/results/failure.png",
      mask: [page.getByLabel("Password")],
    })
    .catch(() => {});
  const failure = {
    schema: 1,
    phase,
    checks,
    errors,
    error: redact(error.stack ?? error),
  };
  await writeFile(
    "/results/failure.json",
    JSON.stringify(failure, null, 2) + "\n",
  );
  console.error(JSON.stringify(failure));
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
