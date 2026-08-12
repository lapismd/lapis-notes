import { expect, test } from "@playwright/test";

const storyUrl =
  "/iframe.html?id=workspace-lapis-editor-demo--markdown-problems&viewMode=story";

test("diagnostic hover card keeps an interactive pointer handoff", async ({
  page,
}) => {
  await page.goto(storyUrl);
  const status = page.getByTestId("lapis-editor-status");
  try {
    await expect(status).toHaveText("ready", { timeout: 30_000 });
  } catch {
    await page.reload();
    await expect(status).toHaveText("ready", { timeout: 60_000 });
  }

  const marker = page.locator(".cm-lint-marker-warning").first();
  await expect(marker).toBeVisible();
  const markerChrome = await marker.evaluate((element) => {
    const markerStyle = getComputedStyle(element);
    const gutter = element.closest(".cm-gutterElement");
    if (!gutter) throw new Error("Missing lint gutter element");
    const gutterStyle = getComputedStyle(gutter);
    return {
      mask: markerStyle.maskImage || markerStyle.webkitMaskImage,
      display: gutterStyle.display,
      justifyContent: gutterStyle.justifyContent,
    };
  });
  expect(markerChrome.mask).not.toBe("none");
  expect(markerChrome.display).toContain("flex");
  expect(markerChrome.justifyContent).toBe("center");

  const range = page.locator(".cm-lintRange-warning:visible").first();
  await expect(range).toBeVisible();
  await range.hover();

  const tooltip = page.getByTestId("lapis-lint-tooltip");
  await expect(tooltip).toBeVisible();
  const compactRow = await tooltip.evaluate((element) => {
    const message = element.querySelector<HTMLElement>(
      '[data-ui-part="lint-message-text"]',
    );
    const source = element.querySelector<HTMLElement>(
      '[data-ui-part="lint-source"]',
    );
    const copy = element.querySelector<HTMLElement>(
      '[data-ui-part="lint-copy"]',
    );
    if (!message || !source || !copy || !message.parentElement) {
      throw new Error("Missing compact lint tooltip row");
    }
    return {
      sameRow:
        message.parentElement === source.parentElement &&
        source.parentElement === copy.parentElement,
      source: source.textContent,
      messageFontSize: getComputedStyle(message).fontSize,
      copyRight: copy.getBoundingClientRect().right,
      sourceRight: source.getBoundingClientRect().right,
    };
  });
  expect(compactRow.sameRow).toBe(true);
  expect(compactRow.source).toMatch(/^markdownlint\(MD\d{3}\)$/);
  expect(compactRow.messageFontSize).toBe("13px");
  expect(compactRow.copyRight).toBeGreaterThan(compactRow.sourceRight);

  const rangeBox = await range.boundingBox();
  const tooltipBox = await tooltip.boundingBox();
  expect(rangeBox).not.toBeNull();
  expect(tooltipBox).not.toBeNull();
  if (!rangeBox || !tooltipBox) return;

  const start = {
    x: rangeBox.x + rangeBox.width / 2,
    y: rangeBox.y + rangeBox.height / 2,
  };
  const target = {
    x: tooltipBox.x + Math.min(tooltipBox.width / 2, 120),
    y: tooltipBox.y + tooltipBox.height / 2,
  };
  for (const progress of [0.25, 0.5, 0.75]) {
    await page.mouse.move(
      start.x + (target.x - start.x) * progress,
      start.y + (target.y - start.y) * progress,
    );
    await page.waitForTimeout(220);
  }

  await tooltip.hover();
  await page.waitForTimeout(450);
  await expect(tooltip).toBeVisible();
  await expect(
    tooltip.getByRole("button", { name: "Copy diagnostic message" }),
  ).toBeVisible();

  await page.mouse.move(4, 4);
  await expect(tooltip).toBeHidden({ timeout: 1_500 });
});
