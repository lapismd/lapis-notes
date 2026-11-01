import { expect, test, type Page } from "@playwright/test";

async function start(page: Page) {
  await page.goto(
    "/iframe.html?id=workspace-popout-acceptance--session-windows&viewMode=story",
  );
  await expect(page.locator('[data-popup-ready="true"]')).toBeVisible({
    timeout: 60_000,
  });
}
async function move(page: Page, path: string) {
  const popup = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: `Open ${path} tab menu`, exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Open in new window", exact: true })
    .click();
  return popup;
}

test("a note keeps its live editor, draft and undo history through popup and return", async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    const root = document.querySelector("[data-popup-ready]") as any;
    const leaf = root.__lapisApp.workspace
      .getLeavesOfType("text")
      .find((leaf: any) => leaf.view.file?.path === "one.txt");
    root.__leaf = leaf;
    root.__editor = leaf.view.editor;
    const editor = root.__editor;
    editor.view.dispatch({
      changes: { from: editor.view.state.doc.length, insert: " draft" },
    });
  });
  const popup = await move(page, "one.txt");
  await expect(popup.locator(".cm-content")).toContainText("First note draft");
  const preserved = () =>
    page.evaluate(() => {
      const root = document.querySelector("[data-popup-ready]") as any;
      const leaf = root.__lapisApp.workspace.getLeafById(root.__leaf.id);
      return {
        leaf: leaf === root.__leaf,
        editor: leaf?.view.editor === root.__editor,
        document:
          root.__editor.view.root === root.__editor.view.dom.ownerDocument,
      };
    });
  expect(await preserved()).toEqual({
    leaf: true,
    editor: true,
    document: true,
  });
  await popup.locator(".cm-content").click();
  await popup.keyboard.press("ControlOrMeta+z");
  await expect(popup.locator(".cm-content")).toContainText("First note");
  await expect(popup.locator(".cm-content")).not.toContainText("draft");
  await popup.keyboard.press("ControlOrMeta+Shift+z");
  await expect(popup.locator(".cm-content")).toContainText("draft");
  await popup
    .getByRole("button", { name: "Open one.txt tab menu", exact: true })
    .click();
  await popup.getByRole("menuitem", { name: "Move to", exact: true }).hover();
  await popup
    .getByRole("menuitem", { name: "Main window", exact: true })
    .click();
  await expect.poll(() => popup.isClosed()).toBe(true);
  await expect(
    page.locator(".cm-content").filter({ hasText: "First note draft" }),
  ).toBeVisible();
  expect(await preserved()).toEqual({
    leaf: true,
    editor: true,
    document: true,
  });
});

test("failed opening preserves the source and failed saving preserves the popup", async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    const root = document.querySelector("[data-popup-ready]") as any;
    root.__host = root.__popupController.renderer;
    const host = { open: () => null };
    root.__host.setPopoutHost(host);
    const leaf = root.__lapisApp.workspace.getLeavesOfType("text")[0];
    root.__host.selectTab(leaf.id);
    if (root.__host.popoutTab(leaf.id) !== null)
      throw new Error("opening must fail");
  });
  await expect(
    page.locator(".cm-content").filter({ hasText: "First note" }),
  ).toBeVisible();
  // Restore the browser policy through the public injectable host.
  await page.reload();
  await expect(page.locator('[data-popup-ready="true"]')).toBeVisible();
  const popup = await move(page, "one.txt");
  await expect(popup.locator(".cm-content")).toContainText("First note");
  const result = await page.evaluate(async () => {
    const root = document.querySelector("[data-popup-ready]") as any;
    const app = root.__lapisApp;
    const modify = app.vault.modifyIfUnchanged.bind(app.vault);
    root.__failedWrites = 0;
    app.vault.modifyIfUnchanged = async (
      file: any,
      data: string,
      baseline: string | null,
    ) => {
      if (file.path === "one.txt") {
        root.__failedWrites++;
        throw new Error("fixture save failed");
      }
      return modify(file, data, baseline);
    };
    root.__allowSave = () => {
      app.vault.modifyIfUnchanged = modify;
    };
    const leaf = app.workspace
      .getLeavesOfType("text")
      .find((leaf: any) => leaf.view.file?.path === "one.txt");
    const editor = leaf.view.editor;
    editor.view.dispatch({
      changes: { from: editor.view.state.doc.length, insert: " unsaved draft" },
    });
    root.__windowId = app.workspace.floating.children[0].id;
    try {
      await root.__popupController.renderer.requestCloseWindow(root.__windowId);
      return "closed";
    } catch (error) {
      return String(error);
    }
  });
  expect(result).toContain("fixture save failed");
  expect(
    await page.evaluate(
      () =>
        (document.querySelector("[data-popup-ready]") as any).__failedWrites,
    ),
  ).toBeGreaterThan(0);
  expect(popup.isClosed()).toBe(false);
  await expect(popup.locator(".cm-content")).toContainText(
    "First note unsaved draft",
  );
  await page.evaluate(async () => {
    const root = document.querySelector("[data-popup-ready]") as any;
    root.__allowSave();
    await root.__popupController.renderer.requestCloseWindow(root.__windowId);
  });
  await expect.poll(() => popup.isClosed()).toBe(true);
  expect(
    await page.evaluate(async () => {
      const app = (document.querySelector("[data-popup-ready]") as any)
        .__lapisApp;
      return app.vault.read(app.vault.getFileByPath("one.txt"));
    }),
  ).toBe("First note unsaved draft");
});

test("multiple popups keep palettes local and receive live themes", async ({
  page,
}) => {
  await start(page);
  const first = await move(page, "one.txt");
  await expect(first.locator(".cm-content")).toContainText("First note");
  await page
    .getByRole("button", { name: "Open two.txt tab menu", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const root = document.querySelector("[data-popup-ready]") as any;
        return root.__lapisApp.workspace.getFocusedCommandHostId();
      }),
    )
    .toBe("root");
  const second = await move(page, "two.txt");
  await expect(second.locator(".cm-content")).toContainText("Second note");
  await first.locator(".cm-content").click();
  await first.keyboard.press("ControlOrMeta+p");
  await expect(
    first.locator('[data-ui-component="workspace-command-palette"]'),
  ).toBeVisible();
  await expect(
    second.locator('[data-ui-component="workspace-command-palette"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-ui-component="workspace-command-palette"]'),
  ).toHaveCount(0);
  await first.keyboard.press("Escape");
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
  });
  await expect(first.locator("html")).toHaveClass(/dark/);
  await expect(second.locator("html")).toHaveClass(/dark/);
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.dataset.popupStyleProof = "true";
    style.textContent =
      '[data-ui-component="workspace-popout-surface"] { --ui-workspace-background: rgb(17, 34, 51); }';
    document.head.append(style);
  });
  for (const popup of [first, second])
    await expect
      .poll(() =>
        popup
          .locator('[data-ui-component="workspace-popout-surface"]')
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe("rgb(17, 34, 51)");
  await page.evaluate(() => {
    document.querySelector('[data-popup-style-proof="true"]')!.textContent =
      '[data-ui-component="workspace-popout-surface"] { --ui-workspace-background: rgb(51, 34, 17); }';
  });
  for (const popup of [first, second])
    await expect
      .poll(() =>
        popup
          .locator('[data-ui-component="workspace-popout-surface"]')
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .toBe("rgb(51, 34, 17)");

  await page.evaluate(async () => {
    const root = document.querySelector("[data-popup-ready]") as any;
    const leaf = root.__lapisApp.workspace
      .getLeavesOfType("text")
      .find((leaf: any) => leaf.view.file?.path === "one.txt");
    await root.__popupController.renderer.requestCloseWindow(
      root.__lapisApp.workspace.getCommandHostIdForLeaf(leaf),
    );
  });
  await expect(second.locator(".cm-content")).toContainText("Second note");
  await second.close();
});

for (const stacked of [false, true])
  test(`popup ${stacked ? "stacked" : "top"} header clears native controls after resize`, async ({
    page,
  }) => {
    await start(page);
    const popup = await move(page, "one.txt");
    await expect(popup.locator(".cm-content")).toContainText("First note");
    if (stacked)
      await page.evaluate(() => {
        const root = document.querySelector("[data-popup-ready]") as any;
        const win = root.__popupController.renderer.layout.windows[0];
        root.__popupController.renderer.setTabsPresentation(
          win.root.id,
          "stacked",
        );
      });
    for (const width of [900, 420, 720]) {
      await popup.setViewportSize({ width, height: 480 });
      const header = popup
        .locator(
          stacked
            ? ".ui-workspace-stacked-tabs__chrome"
            : ".ui-workspace-tabs__header",
        )
        .first();
      const controls = popup
        .locator(
          stacked
            ? ".ui-workspace-stacked-tabs__chrome-main"
            : ".ui-workspace-tabs__list",
        )
        .first();
      await expect.poll(async () => (await header.boundingBox())?.y).toBe(0);
      await expect
        .poll(async () => (await controls.boundingBox())?.x ?? 0)
        .toBeGreaterThanOrEqual(80);
    }
    await popup.close();
  });
