import { expect, test, type Page } from "@playwright/test";
import { createBrowserVault } from "./registry-acceptance";

const mobile = (page: Page) =>
  page.locator('[data-ui-component="workspace-mobile"]');

async function chooseMode(page: Page, mode: string) {
  if (await mobile(page).count()) {
    await page
      .getByRole("button", { name: "Open more actions", exact: true })
      .first()
      .click();
  }
  await page
    .getByRole("button", { name: "Open settings", exact: true })
    .click();
  const heading = page.getByRole("heading", { name: "Workspace", exact: true });
  if (!(await heading.isVisible())) {
    const workspace = page.getByRole("button", {
      name: "Workspace",
      exact: true,
    });
    if (!(await workspace.isVisible())) {
      await page
        .getByRole("button", { name: /^Open settings navigation:/ })
        .click();
    }
    await workspace.click();
  }
  await expect(heading).toBeVisible();
  await page
    .getByRole("combobox", { name: "Mobile layout", exact: true })
    .click();
  await page.getByRole("option", { name: mode, exact: true }).click();
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Settings", exact: true }),
  ).toHaveCount(0);
}

test("production Web follows persisted mobile preferences and live width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await createBrowserVault(page, "Responsive Web acceptance");
  await chooseMode(page, "Always");
  await expect(mobile(page)).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const app = (
          window as unknown as {
            app: {
              vault: { adapter: { read(path: string): Promise<string> } };
            };
          }
        ).app;
        return JSON.parse(await app.vault.adapter.read(".lapis/app.json"))[
          "workspace.mobile.mode"
        ];
      }),
    )
    .toBe("always");
  await page.reload();
  await expect(mobile(page)).toBeVisible();
  await chooseMode(page, "Never");
  await expect(mobile(page)).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(mobile(page)).toHaveCount(0);
  await chooseMode(page, "Auto");
  await expect(mobile(page)).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(mobile(page)).toHaveCount(0);
  await page.setViewportSize({ width: 495, height: 908 });
  await expect(mobile(page)).toBeVisible();
  await chooseMode(page, "Always");
  await expect(mobile(page)).toBeVisible();
});
