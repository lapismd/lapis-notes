import { test, expect } from "@playwright/test";
import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve, join } from "node:path";
import { RustServerRuntime, unusedLoopbackPort } from "./rust-server-runtime";
import { unzipSync } from "fflate";

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
    ).toBeEnabled();
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

test("retained chooser creates, renames, archives and restores a vault across a server restart", async ({
  page,
}, testInfo) => {
  try {
    await page.goto(origin);
    await page.getByLabel("Username").fill("owner");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("button", { name: "Create New Vault" }).click();
    const dialog = page.getByRole("dialog", { name: "New Server Vault" });
    await dialog.getByLabel("Name").fill("Created through the chooser");
    const created = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/v3/vaults") &&
        response.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Create vault", exact: true })
      .click();
    const result = await created;
    expect(result.status()).toBe(201);
    const { vault_id: id } = await result.json();
    await expect(page.getByText("Server DB", { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Create File", exact: true })
      .click();
    const editor = page.locator(".cm-content[contenteditable=true]").last();
    await expect(editor).toBeVisible();
    const text = "# Persist this before archiving\n";
    await editor.fill(text);
    await page.getByRole("button", { name: /Current workspace:/ }).click();
    await page
      .getByRole("menuitem", { name: "Manage Vaults", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Open actions for Created through the chooser",
        exact: true,
      })
      .click();
    await page
      .getByRole("menuitem", { name: "Rename...", exact: true })
      .click();
    const rename = page.getByRole("dialog", {
      name: "Rename vault",
      exact: true,
    });
    await rename.getByLabel("Name").fill("Renamed through Rust");
    await rename.getByRole("button", { name: "Save", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Open actions for Renamed through Rust",
        exact: true,
      })
      .click();
    await page.getByRole("menuitem", { name: "Archive", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: "Renamed through Rust is archived",
        exact: true,
      }),
    ).toBeDisabled();
    const file = join(
      runtime.root,
      "profile",
      "vaults",
      id,
      "content",
      "Untitled.md",
    );
    expect(await readFile(file, "utf8")).toBe(text);
    await runtime.restart();
    await page.reload();
    await expect(
      page.getByRole("button", {
        name: "Renamed through Rust is archived",
        exact: true,
      }),
    ).toBeDisabled();
    await page
      .getByRole("button", {
        name: "Open actions for Renamed through Rust",
        exact: true,
      })
      .click();
    await page.getByRole("menuitem", { name: "Restore", exact: true }).click();
    await page
      .getByRole("button", { name: "Open Renamed through Rust", exact: true })
      .click();
    await page.locator('[data-path="Untitled.md"]').click();
    await expect(
      page.locator(".cm-content[contenteditable=true]").last(),
    ).toContainText("Persist this before archiving");
    expect(await readFile(file, "utf8")).toBe(text);
  } catch (error) {
    await testInfo.attach("Rust host log", {
      body: runtime.logs,
      contentType: "text/plain",
    });
    throw error;
  }
});

test("retained folder and ZIP controls import and export native content across restart", async ({
  page,
}, testInfo) => {
  try {
    await page.addInitScript(() => {
      const file = new File(["# Browser folder note\n"], "Folder.md", {
        type: "text/markdown",
      });
      Object.defineProperty(window, "showDirectoryPicker", {
        configurable: true,
        value: async () => ({
          kind: "directory",
          name: "Browser folder",
          async *entries() {
            yield [
              file.name,
              { kind: "file", name: file.name, getFile: async () => file },
            ];
          },
        }),
      });
    });
    await page.goto(origin);
    await page.getByLabel("Username").fill("owner");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Import Folder", exact: false }),
    ).toBeEnabled();
    const uploaded = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v3/vaults/import?") &&
        response.request().method() === "POST",
    );
    await page.getByLabel("Import ZIP", { exact: true }).setInputFiles({
      name: "Imported archive.zip",
      mimeType: "application/zip",
      buffer: await readFile(
        resolve(
          "../../crates/lapis-app-core/tests/fixtures/archives/notes.zip",
        ),
      ),
    });
    const imported = await uploaded;
    expect(imported.status()).toBe(201);
    const { vault_id: id } = await imported.json();
    await expect(
      page.getByRole("button", { name: "Open Imported archive", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Open actions for Imported archive",
        exact: true,
      })
      .click();
    const download = page.waitForEvent("download");
    await page
      .getByRole("menuitem", { name: "Export ZIP", exact: true })
      .click();
    const exported = await download;
    expect(await exported.failure()).toBeNull();
    const path = await exported.path();
    expect(path).toBeTruthy();
    const files = unzipSync(await readFile(path!));
    expect(Buffer.from(files["notes/café.md"]).toString()).toBe(
      "# Imported café\n",
    );
    expect([...files["image.bin"]]).toEqual([0, 128, 255]);
    expect(Buffer.from(files[".lapis/app.json"]).toString()).toBe(
      '{"appearance":"dark"}',
    );
    await page
      .getByRole("button", { name: "Import Folder", exact: false })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Import Server Vault",
      exact: true,
    });
    await expect(dialog.getByLabel("Name")).toHaveValue("Browser folder");
    await dialog
      .getByRole("button", { name: "Import vault", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Open Browser folder", exact: true }),
    ).toBeVisible();
    await runtime.restart();
    await page.reload();
    await page
      .getByRole("button", { name: "Open Browser folder", exact: true })
      .click();
    await page.locator('[data-path="Folder.md"]').click();
    await expect(
      page.locator(".cm-content[contenteditable=true]").last(),
    ).toContainText("Browser folder note");
    expect(
      await readFile(
        join(runtime.root, "profile/vaults", id, "content/image.bin"),
      ),
    ).toEqual(Buffer.from([0, 128, 255]));
  } catch (error) {
    await testInfo.attach("Rust host log", {
      body: runtime.logs,
      contentType: "text/plain",
    });
    throw error;
  }
});
