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
  await expect(page.locator("#storybook-root")).toHaveAttribute(
    "data-markdown-problems-acceptance-ready",
    "true",
    { timeout: 30_000 },
  );

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

  const markedLine = page
    .locator(".cm-line")
    .filter({ hasText: "missing heading space" });
  const range = markedLine.locator(".cm-lintRange-warning:visible").last();
  await expect(range).toBeVisible();
  const unmarkedPoint = await range.evaluate((element) => {
    const rangeBox = element.getBoundingClientRect();
    return {
      x: rangeBox.right + 24,
      y: rangeBox.top + rangeBox.height / 2,
    };
  });
  await page.mouse.move(unmarkedPoint.x, unmarkedPoint.y);
  await expect(page.getByTestId("lapis-lint-tooltip")).toBeHidden();
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

  const remainingRange = page
    .locator(".cm-line")
    .filter({ hasText: "Welcome to Lapis Notes" })
    .locator(".cm-lintRange-warning:visible")
    .first();
  await expect(remainingRange).toBeVisible();
  await remainingRange.hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip.getByTestId("lapis-lint-message-text")).toContainText(
    "Multiple top-level headings",
  );
  await tooltip.getByRole("button", { name: "View Problem" }).click();
  await expect(tooltip).toBeHidden();

  const inlineProblem = page.locator(
    '[data-ui-component="editor"][data-ui-part="inline-problem"]',
  );
  await expect(inlineProblem).toBeVisible();
  await expect(
    inlineProblem.locator('[data-ui-part="inline-problem-message"]'),
  ).toContainText("Multiple top-level headings");
  await expect(
    inlineProblem.locator('[data-ui-part="inline-problem-source"]'),
  ).toHaveText("markdownlint(MD025)");
  const inlineProblemChrome = await inlineProblem.evaluate((element) => {
    const header = element.querySelector<HTMLElement>(
      '[data-ui-part="inline-problem-header"]',
    );
    const body = element.querySelector<HTMLElement>(
      '[data-ui-part="inline-problem-body"]',
    );
    const pointer = element.querySelector<HTMLElement>(
      '[data-ui-part="inline-problem-pointer"]',
    );
    if (!header || !body || !pointer) {
      throw new Error("Missing inline problem chrome");
    }
    const rootStyle = getComputedStyle(element);
    const headerStyle = getComputedStyle(header);
    const bodyStyle = getComputedStyle(body);
    const pointerStyle = getComputedStyle(pointer);
    return {
      borderLeftStyle: rootStyle.borderLeftStyle,
      borderLeftWidth: rootStyle.borderLeftWidth,
      headerDisplay: headerStyle.display,
      headerBackground: headerStyle.backgroundColor,
      bodyDisplay: bodyStyle.display,
      bodyBorderTopWidth: bodyStyle.borderTopWidth,
      bodyPaddingLeft: bodyStyle.paddingLeft,
      pointerPosition: pointerStyle.position,
      pointerBorderBottomWidth: pointerStyle.borderBottomWidth,
      pointerBorderBottomColor: pointerStyle.borderBottomColor,
    };
  });
  expect(inlineProblemChrome).toMatchObject({
    borderLeftStyle: "solid",
    borderLeftWidth: "2px",
    headerDisplay: "flex",
    bodyDisplay: "flex",
    bodyBorderTopWidth: "1px",
    bodyPaddingLeft: "12px",
    pointerPosition: "absolute",
    pointerBorderBottomWidth: "5px",
  });
  expect(inlineProblemChrome.headerBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(inlineProblemChrome.pointerBorderBottomColor).not.toBe(
    "rgba(0, 0, 0, 0)",
  );

  const closeProblem = inlineProblem.getByRole("button", {
    name: "Close problem widget",
  });
  await expect(closeProblem).toBeVisible();
  const closeBox = await closeProblem.boundingBox();
  expect(closeBox).not.toBeNull();
  if (!closeBox) return;
  const closeHitTarget = await page.evaluate(
    ({ x, y }) =>
      document
        .elementFromPoint(x, y)
        ?.closest('[data-ui-part="inline-problem-close"]') != null,
    {
      x: closeBox.x + closeBox.width / 2,
      y: closeBox.y + closeBox.height / 2,
    },
  );
  expect(closeHitTarget).toBe(true);
  await closeProblem.click();
  await expect(inlineProblem).toBeHidden();

  await expect(remainingRange).toBeVisible();
  await remainingRange.hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip.getByTestId("lapis-lint-message-text")).toContainText(
    "Multiple top-level headings",
  );
});
