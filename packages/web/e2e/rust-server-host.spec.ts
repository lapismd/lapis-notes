import { test, expect } from "@playwright/test";
import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve, join } from "node:path";
import { RustServerRuntime, unusedLoopbackPort } from "./rust-server-runtime";

let runtime: RustServerRuntime;
let origin: string;
const password = randomBytes(32).toString("base64url");
test.beforeAll(async () => {
  const repository = resolve("../..");
  await mkdir(join(repository, ".local"), { recursive: true });
  const root = await mkdtemp(join(repository, ".local/rust-hosted-browser-"));
  origin = `http://localhost:${await unusedLoopbackPort()}`;
  runtime = new RustServerRuntime(root, repository, origin, password);
  await runtime.start();
});
test.afterAll(async () => {
  await runtime?.stop();
});

test("retained hosted login and Notes workspace read and persist through Rust", async ({
  page,
}, testInfo) => {
  try {
    await page.goto(origin);
    await expect(page.locator("html")).toHaveAttribute(
      "data-runtime",
      "rust-server",
    );
    await expect(
      page.getByRole("heading", { name: "Sign in", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Username").fill("owner");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Your vaults", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create New Vault" }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Open Rust vault", exact: true })
      .click();
    await expect(page.getByText("Server DB", { exact: true })).toBeVisible();
    await page.locator('[data-path="Note.md"]').click();
    const editor = page.locator(".cm-content[contenteditable=true]").last();
    await expect(editor).toBeVisible();
    const text =
      "# Saved through Rust\n\nA retained application screen writes native bytes.\n";
    await editor.fill(text);
    await expect
      .poll(() => readFile(join(runtime.vault, "Note.md"), "utf8"))
      .toBe(text);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Your vaults", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Open Rust vault", exact: true })
      .click();
    await page.locator('[data-path="Note.md"]').click();
    await expect(
      page.locator(".cm-content[contenteditable=true]").last(),
    ).toContainText("Saved through Rust");
    expect(
      await page.evaluate(() => navigator.serviceWorker.getRegistrations()),
    ).toEqual([]);
  } catch (error) {
    await testInfo.attach("Rust host log", {
      body: runtime.logs,
      contentType: "text/plain",
    });
    throw error;
  }
});
