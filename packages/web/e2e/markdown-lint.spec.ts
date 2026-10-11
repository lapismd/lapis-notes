import { expect, test } from "@playwright/test";
import {
  createBrowserVault,
  installRegistryPlugin,
} from "./registry-acceptance";

test("installed Markdown Lint starts its isolated module worker and publishes diagnostics", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await createBrowserVault(page, "Markdown Lint Browser Vault");
  await installRegistryPlugin(page, "lapis-markdown-lint", "deferred-service");
  await page.evaluate(async () => {
    const app = (
      window as typeof window & {
        app: {
          vault: { create(path: string, content: string): Promise<unknown> };
          openFile(file: unknown): Promise<void>;
        };
      }
    ).app;
    const file = await app.vault.create("Review.md", "#Heading\n");
    await app.openFile(file);
  });
  await page.locator('[data-status-bar-item-id="app-shell:problems"]').click();
  const problems = page.locator('[data-ui-component="workspace-problems"]');
  await expect(
    problems
      .locator(".ui-workspace-problems__source", { hasText: "markdownlint" })
      .first(),
  ).toBeVisible();
  await expect(problems).toContainText("MD018");
  await expect(problems).not.toContainText("did not complete");
  const worker = page
    .workers()
    .find(
      (candidate) =>
        candidate.url().includes("/lapis-markdown-lint/") &&
        candidate.url().includes("/assets/markdownlint.worker-"),
    );
  expect(
    worker,
    "The verified installed module worker must start",
  ).toBeDefined();
  const headers = await page.evaluate(async (url) => {
    const response = await fetch(url);
    return {
      status: response.status,
      coep: response.headers.get("Cross-Origin-Embedder-Policy"),
      corp: response.headers.get("Cross-Origin-Resource-Policy"),
    };
  }, worker!.url());
  expect(headers).toEqual({
    status: 200,
    coep: "require-corp",
    corp: "same-origin",
  });
  expect(errors).toEqual([]);
});
