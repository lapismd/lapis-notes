import { expect, test } from "@playwright/test";
import { createBrowserVault } from "./registry-acceptance";

test("Plugins ribbon opens the category homepage and shares verified installs with Settings", async ({
  page,
}) => {
  await createBrowserVault(page, "Plugins Browser Acceptance");
  const ribbon = page.locator(
    'button[data-hint-target-id="ribbon:app:plugins"]',
  );
  await ribbon.click();
  await expect(
    page.getByRole("heading", { name: "Make Lapis Notes yours." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Categories", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "AI, 1 plugin", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remove AI filter" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open AI", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "AI", exact: true }),
  ).toBeVisible();
  await page
    .locator('[data-ui-component="workspace-view-header"]')
    .getByRole("button", { name: "Plugins", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove AI filter" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove AI filter" }).click();
  await page
    .getByRole("textbox", { name: "Search registry plugins" })
    .fill("Word Count");
  await page
    .getByRole("link", { name: "Open Word Count", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Install in Lapis", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Installed", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Open settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Plugin registry", exact: true })
    .click();
  await page.getByRole("tab", { name: "Installed", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Disable Word Count", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await ribbon.click();
  await expect(
    page.getByRole("heading", { name: "Make Lapis Notes yours." }),
  ).toBeVisible();
  await expect(
    page.locator('[data-ui-component="plugin-browser"]'),
  ).toHaveCount(1);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const app = (
          window as typeof window & {
            app: {
              workspace: { getLeavesOfType(type: string): { id: string }[] };
              vault: { adapter: { read(path: string): Promise<string> } };
            };
          }
        ).app;
        const layout = JSON.parse(
          await app.vault.adapter.read(".lapis/workspace.json"),
        );
        const leafId = app.workspace.getLeavesOfType("plugins")[0]?.id;
        type SavedNode = {
          id?: string;
          children?: SavedNode[];
          state?: { state?: { route?: { page?: string } } };
        };
        const find = (node: SavedNode): SavedNode | undefined =>
          node.id === leafId ? node : node.children?.map(find).find(Boolean);
        return {
          active: layout.active === leafId,
          route: find(layout.main)?.state?.state?.route?.page,
        };
      }),
    )
    .toEqual({ active: true, route: "landing" });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Make Lapis Notes yours." }),
  ).toBeVisible();
  await expect(
    page.locator('[data-ui-component="plugin-browser"]'),
  ).toHaveCount(1);
  expect(
    await page.evaluate(() => {
      const app = (
        window as typeof window & {
          app: { plugins: { isPluginEnabled(id: string): boolean } };
        }
      ).app;
      return app.plugins.isPluginEnabled("wordcount");
    }),
  ).toBe(true);
});
