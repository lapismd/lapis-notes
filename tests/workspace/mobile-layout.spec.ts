import { expect, test, type Page } from "@playwright/test";
import { waitForVisualStoryFinished } from "@lapismd/storybook-addon-visual-delta/playwright";

const storyId = "workspace-shell--responsive-mode";
const mobile = (page: Page) =>
  page.locator('[data-ui-component="workspace-mobile"]');

async function openShell(page: Page) {
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
  await waitForVisualStoryFinished(page, storyId, 90_000);
  await expect(page.locator('[data-app-shell-ready="true"]')).toBeVisible();
}

async function chooseMode(page: Page, mode: string) {
  if (await mobile(page).count()) {
    await page
      .getByRole("button", { name: "Open more actions" })
      .first()
      .click();
  }
  await page
    .getByRole("button", { name: "Open settings", exact: true })
    .click();
  const workspace = page.getByRole("button", {
    name: "Workspace",
    exact: true,
  });
  if (await workspace.isVisible()) await workspace.click();
  await expect(
    page.getByRole("heading", { name: "Workspace", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Mobile layout", exact: true })
    .click();
  await page.getByRole("option", { name: mode, exact: true }).click();
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
}

test("real App settings switch immediately and Auto follows app width", async ({
  page,
}) => {
  await openShell(page);
  await chooseMode(page, "Always");
  await expect(mobile(page)).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const app = (
          document.querySelector(
            '[data-testid="workspace-shell-frame"]',
          ) as HTMLElement & { __lapisApp: import("@lapis-notes/api").App }
        ).__lapisApp;
        return JSON.parse(await app.vault.adapter.read(".lapis/app.json"))[
          "workspace.mobile.mode"
        ];
      }),
    )
    .toBe("always");
  await chooseMode(page, "Never");
  await expect(mobile(page)).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(mobile(page)).toHaveCount(0);
  await chooseMode(page, "Auto");
  await expect(mobile(page)).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(mobile(page)).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(mobile(page)).toBeVisible();
});

test("mobile actions create a real note, reveal Search and open the palette", async ({
  page,
}) => {
  await openShell(page);
  await chooseMode(page, "Always");
  await page
    .getByRole("button", { name: "Create new note", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const app = (
          document.querySelector(
            '[data-testid="workspace-shell-frame"]',
          ) as HTMLElement & { __lapisApp: import("@lapis-notes/api").App }
        ).__lapisApp;
        return app.vault.getFileByPath("Untitled.md")?.path;
      }),
    )
    .toBe("Untitled.md");
  await page
    .getByRole("button", { name: "Open search sidebar", exact: true })
    .click();
  const selector = page.getByRole("combobox", {
    name: "Select left sidebar tab",
  });
  await expect(selector).toHaveAttribute("data-ui-component", "select");
  await expect(selector).toHaveText("Search");
  await page
    .getByRole("button", { name: "Close sidebar", exact: true })
    .click();
  await page.getByRole("button", { name: "Open more actions" }).first().click();
  await page
    .getByRole("button", { name: "Open command palette", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Command Palette", exact: true }),
  ).toBeVisible();
});
