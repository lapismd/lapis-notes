import { expect, test } from "@playwright/test";
import { waitForVisualStoryFinished } from "@lapismd/storybook-addon-visual-delta/playwright";

for (const variant of ["ready", "native-repository", "startup-retry"]) {
  test(`Notes session remains mounted after ${variant} finishes`, async ({
    page,
  }) => {
    const id = `workspace-notes-session--${variant}`;
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    await waitForVisualStoryFinished(page, id);
    const shell = page.locator('[data-ui-component="lapis-workspace-shell"]');
    await expect(shell).toBeVisible();
    await expect(page.locator('[data-path="Welcome.md"]')).toBeVisible();
    const viewport = page.viewportSize()!;
    expect((await shell.boundingBox())?.height).toBe(viewport.height);
  });
}
