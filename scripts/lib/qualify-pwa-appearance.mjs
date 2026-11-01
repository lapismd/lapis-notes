import assert from "node:assert/strict";

export async function qualifyPwaAppearance(page) {
  const mode = async (value) => {
    await page.evaluate(async (value) => {
      await globalThis.app.configuration.updateConfigurationOption(
        "appearence.baseColorSchema",
        value,
      );
    }, value);
  };
  const paint = async (dark) => {
    await page.waitForFunction(
      (dark) => document.documentElement.classList.contains("dark") === dark,
      dark,
      { timeout: 10_000 },
    );
    await page.waitForFunction(() => {
      const header = document.querySelector(
        "[data-ui-component='workspace-tabs'] > [data-ui-part='header']",
      );
      const meta = document.querySelector(
        "meta[name='theme-color'][data-lapis-host-theme-color]",
      );
      return (
        header && meta?.content === getComputedStyle(header).backgroundColor
      );
    });
    return page
      .locator("meta[name='theme-color'][data-lapis-host-theme-color]")
      .getAttribute("content");
  };
  await page.emulateMedia({ colorScheme: "light" });
  await mode("dark");
  const dark = await paint(true);
  await page.reload();
  await page
    .locator('[data-app-shell-ready="true"]')
    .waitFor({ timeout: 90_000 });
  assert.equal(await paint(true), dark);
  await page.emulateMedia({ colorScheme: "dark" });
  await mode("light");
  const light = await paint(false);
  assert.notEqual(light, dark);
  await mode("system");
  assert.equal(await paint(true), dark);
  await page.emulateMedia({ colorScheme: "light" });
  assert.equal(await paint(false), light);
  await page.emulateMedia({ colorScheme: "dark" });
  assert.equal(await paint(true), dark);
  await page.emulateMedia({ colorScheme: "light" });
  assert.equal(await paint(false), light);
  return { light, dark, persistedDarkStartup: true, systemTransitions: true };
}
