import { expect, test } from "@playwright/test";

const storyUrl = (storyId: string) =>
  `/iframe.html?id=${storyId}&viewMode=story`;

for (const scenario of [
  {
    name: "Outgoing Links",
    storyId:
      "workspace-panels-markdown-link-preview-acceptance--outgoing-links",
    triggerName: /^Open Ideas:/,
    openName: "Open Ideas.markdown",
  },
  {
    name: "Backlinks",
    storyId: "workspace-panels-markdown-link-preview-acceptance--backlinks",
    triggerName: /^Open Research:/,
    openName: "Open Research.md",
  },
] as const) {
  test(`${scenario.name} preview crosses a constrained editor and remains interactive`, async ({
    page,
  }) => {
    await page.goto(storyUrl(scenario.storyId));
    const trigger = page
      .getByRole("button", {
        name: scenario.triggerName,
      })
      .first();
    try {
      await expect(trigger).toBeVisible({ timeout: 30_000 });
    } catch {
      // The first preview request can straddle Storybook's cold Vite restart.
      // Reload the stale iframe after the catalog has finished compiling.
      await page.reload();
      await expect(trigger).toBeVisible({ timeout: 60_000 });
    }

    const separator = page.getByRole("separator").first();
    const separatorBox = await separator.boundingBox();
    expect(separatorBox).not.toBeNull();
    if (!separatorBox) return;
    const y = separatorBox.y + separatorBox.height / 2;
    await page.mouse.move(separatorBox.x + separatorBox.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(1130, y, { steps: 12 });
    await page.mouse.up();

    const panelHost = trigger.locator(
      'xpath=ancestor::*[@data-ui-component="workspace-view-host"][1]',
    );
    await expect
      .poll(async () => (await panelHost.boundingBox())?.width ?? Infinity)
      .toBeLessThan(250);

    await trigger.hover();
    const preview = page.locator(
      '[data-ui-component="hover-card"][data-ui-part="hover-card-content"]',
    );
    await expect(preview).toBeVisible();
    await expect(
      preview.locator('[data-ui-component="file-embed"]'),
    ).toBeVisible();
    await expect(preview.locator(".lapis-file-embed__title")).toHaveCount(0);
    await expect(preview.locator(".mira-embed.internal-embed")).toHaveCount(0);
    const openButton = preview.getByRole("button", { name: scenario.openName });
    await expect(openButton).toBeVisible();
    await expect(preview.locator(".lapis-file-embed__header")).toHaveCSS(
      "position",
      "sticky",
    );
    const renderedMarkdown = preview.locator("[data-markdown-embed]");
    await expect(renderedMarkdown).toBeVisible();
    await expect(renderedMarkdown).toHaveCSS("padding-left", "32px");

    const geometry = await preview.evaluate((element) => {
      const previewRect = element.getBoundingClientRect();
      const editor = document.querySelector<HTMLElement>(
        '.markdown-view, [data-ui-component="markdown-mira-preview"], .markdown-view__editor',
      );
      const editorHost = editor?.closest<HTMLElement>(
        '[data-ui-component="workspace-view-host"]',
      );
      if (!editorHost) throw new Error("Missing adjacent Markdown editor host");
      const editorRect = editorHost.getBoundingClientRect();
      const overlap = {
        left: Math.max(previewRect.left, editorRect.left),
        right: Math.min(previewRect.right, editorRect.right),
        top: Math.max(previewRect.top, editorRect.top),
        bottom: Math.min(previewRect.bottom, editorRect.bottom),
      };
      const x = overlap.left + (overlap.right - overlap.left) / 2;
      const y = overlap.top + (overlap.bottom - overlap.top) / 2;
      return {
        inBody: document.body.contains(element),
        insidePanel: element.closest('[data-testid="panel-demo"]') !== null,
        width: previewRect.width,
        left: previewRect.left,
        top: previewRect.top,
        right: previewRect.right,
        bottom: previewRect.bottom,
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: document.documentElement.clientHeight,
        overlapWidth: overlap.right - overlap.left,
        overlapHeight: overlap.bottom - overlap.top,
        topmost:
          document
            .elementFromPoint(x, y)
            ?.closest(
              '[data-ui-component="hover-card"][data-ui-part="hover-card-content"]',
            ) === element,
        side: element.getAttribute("data-side"),
      };
    });

    expect(geometry.inBody).toBe(true);
    expect(geometry.insidePanel).toBe(false);
    expect(geometry.width).toBeGreaterThanOrEqual(400);
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
    expect(["top", "right", "bottom", "left"]).toContain(geometry.side);
    expect(geometry.overlapWidth).toBeGreaterThan(8);
    expect(geometry.overlapHeight).toBeGreaterThan(8);
    expect(geometry.topmost).toBe(true);

    await preview.hover();
    await page.waitForTimeout(350);
    await expect(preview).toBeVisible();
  });
}
