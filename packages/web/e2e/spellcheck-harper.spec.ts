import { expect, test, type Page } from "@playwright/test";

const MISSPELLED_NOTE = {
  path: "spellcheck.md",
  content: "# Welcome\n\nAre you goin to be there\n",
};

async function createBrowserVault(page: Page, name: string): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Create a vault" })).toBeVisible();
  await page.getByRole("button", { name: /Create New Vault/ }).click();
  const dialog = page.getByRole("dialog", { name: "New Browser Vault" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("button", { name: "Create vault" }).click();
  await expect(page.getByRole("button", { name: /Current workspace:/ })).toContainText(
    name,
  );
  await expect(page.getByRole("button", { name: "Open Chat" })).toBeVisible();
}

async function seedAndOpenMisspelledNote(page: Page): Promise<void> {
  await page.evaluate(async (note) => {
    const app = (
      window as typeof window & {
        app: {
          vault: {
            create(path: string, data: string): Promise<unknown>;
            getFileByPath(path: string): unknown;
          };
          openFile(file: unknown): Promise<void>;
        };
      }
    ).app;
    await app.vault.create(note.path, note.content);
    const file = app.vault.getFileByPath(note.path);
    if (!file) throw new Error("The seeded Spell Check note was not indexed");
    await app.openFile(file);
  }, MISSPELLED_NOTE);
}

test("web host serves Harper WASM and publishes a spelling Problems row", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const wasmContentTypes: string[] = [];
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin !== "http://127.0.0.1:4174") return;
    if (!url.pathname.endsWith(".wasm")) return;
    wasmContentTypes.push(response.headers()["content-type"] ?? "");
  });

  await createBrowserVault(page, "Harper Browser Vault");
  await seedAndOpenMisspelledNote(page);
  await page.locator('[data-status-bar-item-id="app-shell:problems"]').click();

  const problems = page.locator('[data-ui-component="workspace-problems"]');
  await expect(problems).toBeVisible();
  await expect(problems.locator(".ui-workspace-problems__source", { hasText: "harper" })).toBeVisible({
    timeout: 45_000,
  });
  await expect(problems).not.toContainText("did not complete");

  expect(wasmContentTypes.length).toBeGreaterThan(0);
  expect(wasmContentTypes.every((type) => type.includes("application/wasm"))).toBe(
    true,
  );
});
