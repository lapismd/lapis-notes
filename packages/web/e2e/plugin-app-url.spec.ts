import { expect, test } from "@playwright/test";
import { createBrowserVault } from "./registry-acceptance";

test("registered app links cold-open a selected plugin page without installing", async ({
  page,
}) => {
  await createBrowserVault(page, "Plugin App Link Acceptance");
  const response = await page.request.get(
    process.env.VITE_LAPIS_LOCAL_REGISTRY_URL ??
      "https://registry.lapis.md/v2/index.json",
  );
  expect(response.ok()).toBe(true);
  const catalog = await response.json();
  const version = catalog.plugins.find(
    (entry: { id: string }) => entry.id === "wordcount",
  ).latestVersion;
  const url = `web+lapis://plugins?id=wordcount&version=${encodeURIComponent(version)}`;
  await page.goto(`/open?url=${encodeURIComponent(url)}`);
  await expect(
    page.getByRole("heading", { name: "Word Count", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Install in Lapis", exact: true }),
  ).toBeEnabled();
  await expect(
    page.locator('[data-ui-component="plugin-browser"]'),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Word Count", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('[data-ui-component="plugin-browser"]'),
  ).toHaveCount(1);
});

test("an unavailable linked release stays unavailable until latest is explicitly chosen", async ({
  page,
}) => {
  await createBrowserVault(page, "Missing Plugin Release Acceptance");
  const url = "web+lapis://plugins?id=wordcount&version=99.0.0";
  await page.goto(`/open?url=${encodeURIComponent(url)}`);
  await expect(
    page.getByRole("heading", { name: "Plugin version unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Install in Lapis", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "View latest release" }).click();
  await expect(
    page.getByRole("heading", { name: "Word Count", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Install in Lapis", exact: true }),
  ).toBeEnabled();
});
