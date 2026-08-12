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

  const range = page
    .locator(".cm-line")
    .filter({ hasText: "missing heading space" })
    .locator(".cm-lintRange-warning:visible")
    .last();
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

  await expect(tooltip.getByTestId("lapis-lint-message-text")).toContainText(
    "No space after hash",
  );

  const rangeBox = await range.boundingBox();
  const tooltipBox = await tooltip.boundingBox();
  const copy = tooltip.getByRole("button", {
    name: "Copy diagnostic message",
  });
  const copyBox = await copy.boundingBox();
  expect(rangeBox).not.toBeNull();
  expect(tooltipBox).not.toBeNull();
  expect(copyBox).not.toBeNull();
  if (!rangeBox || !tooltipBox || !copyBox) return;

  const start = {
    x: rangeBox.x + rangeBox.width / 2,
    y: rangeBox.y + rangeBox.height / 2,
  };
  const target = {
    x: copyBox.x + copyBox.width / 2,
    y: copyBox.y + copyBox.height / 2,
  };
  for (const progress of [0.2, 0.4, 0.6, 0.8, 1]) {
    await page.mouse.move(
      start.x + (target.x - start.x) * progress,
      start.y + (target.y - start.y) * progress,
    );
    await page.waitForTimeout(220);
    await expect(tooltip).toBeVisible();
    await expect(tooltip.getByTestId("lapis-lint-message-text")).toContainText(
      "No space after hash",
    );
    const currentBox = await tooltip.boundingBox();
    expect(currentBox).not.toBeNull();
    expect(Math.abs(currentBox!.x - tooltipBox.x)).toBeLessThan(1);
    expect(Math.abs(currentBox!.y - tooltipBox.y)).toBeLessThan(1);
  }

  await page.waitForTimeout(450);
  await expect(tooltip).toBeVisible();
  await expect(copy).toBeVisible();

  await page.mouse.move(4, 4);
  await expect(tooltip).toBeHidden({ timeout: 1_500 });
});
