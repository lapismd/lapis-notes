import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { mkdir, writeFile, rm } from "node:fs/promises";

const addonRequire = createRequire(
  import.meta.resolve("@storybook/addon-a11y"),
);
const axePath = addonRequire.resolve("axe-core");

test("provides a populated on-page outline", async ({ page }) => {
  await page.goto("?path=/docs/specification-workspace-shell--docs");
  const docs = page.frameLocator("#storybook-preview-iframe");
  await expect(
    docs.getByRole("navigation", { name: "On this page" }),
  ).toBeVisible();
  await expect(docs.locator(".toc-wrapper a").first()).toBeVisible();
});

test("canonical chapter links open their Storybook docs", async ({ page }) => {
  await page.goto("?path=/docs/specification-workspace-shell--docs");
  const docs = page.frameLocator("#storybook-preview-iframe");
  await docs.getByRole("link", { name: "Panels", exact: true }).first().click();
  await expect(page).toHaveURL(
    /\?path=\/docs\/specification-workspace-shell-panels--docs/,
  );
  await expect(docs.getByRole("heading", { level: 1 })).toContainText("Panels");
});

test("requirement links, outline, and history survive reload", async ({
  page,
}) => {
  await page.goto("?path=/docs/specification-workspace-shell--docs");
  const docs = page.frameLocator("#storybook-preview-iframe");
  await docs
    .getByRole("link", { name: "Layout and persistence", exact: true })
    .click();
  const firstRequirement = docs.locator("h2[id^='ln-ws-']").first();
  const id = await firstRequirement.getAttribute("id");
  await expect(firstRequirement).toBeVisible();
  await docs.locator(`.toc-wrapper a[href$='#${id}']`).click();
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
  await page.reload();
  await expect(firstRequirement).toBeInViewport();
  await docs
    .getByRole("navigation", { name: "Specification breadcrumbs" })
    .getByRole("link", { name: "Workspace Shell", exact: true })
    .click();
  await expect(page).toHaveURL(/specification-workspace-shell--docs$/);
  await page.goBack();
  await expect(page).toHaveURL(
    /specification-workspace-shell-layout-and-persistence--docs/,
  );
  const previous = docs
    .getByRole("navigation", { name: "Specification reading order" })
    .getByRole("link", { name: /^Previous:/ });
  await previous.focus();
  await previous.press("Enter");
  await expect(page).toHaveURL(/specification-workspace-shell--docs$/);
  await page.goForward();
  await expect(page).toHaveURL(/specification-workspace-shell--docs$/);
});

test("reading order is keyboard accessible and fits a narrow page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await page.goto("?path=/docs/specification-workspace-shell--docs");
  const docs = page.frameLocator("#storybook-preview-iframe");
  const next = docs
    .getByRole("navigation", { name: "Specification reading order" })
    .getByRole("link", { name: /^Next:/ });
  await next.focus();
  await next.press("Enter");
  await expect(page).toHaveURL(
    /specification-workspace-shell-layout-and-persistence--docs/,
  );
  const frame = page
    .frames()
    .find((frame) => frame.url().includes("iframe.html"))!;
  await expect
    .poll(() =>
      frame.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
});

test("legacy chapter routes retain their new parent hierarchy", async ({
  page,
}) => {
  for (const [legacy, current, title] of [
    ["panels", "workspace-shell-panels", "Panels"],
    ["problems", "workspace-shell-panels-problems", "Problems"],
  ]) {
    await page.goto(`?path=/docs/specification-${legacy}--docs`);
    await expect(page).toHaveURL(new RegExp(`specification-${current}--docs`));
    await expect(
      page
        .frameLocator("#storybook-preview-iframe")
        .getByRole("heading", { level: 1 }),
    ).toContainText(title);
  }
});

test("specification navigation passes accessibility checks", async ({
  page,
}) => {
  await page.goto("?path=/docs/specification-workspace-shell--docs");
  await expect(
    page
      .frameLocator("#storybook-preview-iframe")
      .getByRole("navigation", { name: "Specification breadcrumbs" }),
  ).toBeVisible();
  const frame = page
    .frames()
    .find((frame) => frame.url().includes("iframe.html"))!;
  await frame.addScriptTag({ path: axePath });
  const violations = await frame.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: string,
            options: object,
          ) => Promise<{ violations: { id: string; nodes: unknown[] }[] }>;
        };
      }
    ).axe;
    return (
      await axe.run(".sbdocs-wrapper", {
        runOnly: ["wcag2a", "wcag2aa", "wcag21aa"],
      })
    ).violations.map(({ id, nodes }) => ({ id, count: nodes.length }));
  });
  expect(violations).toEqual([]);
});

test("generated output leaves the documentation mounted", async ({ page }) => {
  test.skip(
    process.env.SPECIFICATION_STATIC === "1",
    "The static server has no source watcher.",
  );
  await page.goto("?path=/docs/specification-workspace-shell--docs");
  const docs = page.frameLocator("#storybook-preview-iframe");
  await expect(
    docs.getByRole("navigation", { name: "On this page" }),
  ).toBeVisible();
  const frame = page
    .frames()
    .find((frame) => frame.url().includes("iframe.html"))!;
  await frame.evaluate(() => {
    document.body.dataset.specificationWatchProbe = "retained";
  });
  const directory = "tmp/specification-watch-probe";
  await mkdir(directory, { recursive: true });
  try {
    await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        writeFile(
          `${directory}/${index}.html`,
          "<p>Generated build output</p>",
        ),
      ),
    );
    // Observe the filesystem notification window: an authored HTML edit would
    // trigger Vite's page reload, losing this frame's marker.
    await page.waitForTimeout(1000);
    expect(
      await frame.evaluate(() => document.body.dataset.specificationWatchProbe),
    ).toBe("retained");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
