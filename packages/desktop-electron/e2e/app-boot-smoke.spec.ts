import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  createDesktopTestState,
  getMainProcessUnhandledErrors,
  launchDesktopApp,
  launchSecondDesktopInstance,
  resetMainProcessUnhandledErrors,
  switchTestVault,
  waitForDesktopWorkspace,
} from "./helpers";
import { usesDesktopDevRenderer } from "./smoke-mode";

function restoredPluginLayout() {
  const leaf = (
    id: string,
    type: string,
    state: Record<string, unknown> = {},
  ) => ({ id, type: "leaf", state: { type, state } });
  const missing = (
    id: string,
    type: string,
    state: Record<string, unknown> = {},
  ) => leaf(id, "empty", { __missingViewType: type, ...state });
  const tabs = (id: string, children: ReturnType<typeof leaf>[]) => ({
    id,
    type: "tabs",
    currentTab: 0,
    children,
  });
  const split = (
    id: string,
    children: ReturnType<typeof tabs>[],
    width?: string,
  ) => ({
    id,
    type: "split",
    direction: id === "main" ? "horizontal" : "vertical",
    children,
    ...(width ? { width } : {}),
  });

  return {
    main: split("main", [
      tabs("main-tabs", [
        leaf("welcome", "markdown", { file: "Welcome.md", mode: "source" }),
      ]),
    ]),
    left: split(
      "left",
      [
        tabs("left-tabs", [
          missing("files", "file-explorer"),
          missing("search", "search", { query: "Welcome" }),
          missing("bookmarks", "bookmarks"),
        ]),
      ],
      "22rem",
    ),
    right: split(
      "right",
      [
        tabs("right-tabs", [
          missing("backlinks", "backlink"),
          missing("outgoing", "outgoing-link"),
          missing("tags", "tag"),
          missing("outline", "outline"),
          missing("file-properties", "file-properties"),
          missing("all-properties", "all-properties"),
        ]),
      ],
      "22rem",
    ),
    bottom: { ...tabs("bottom", []), height: "0px" },
    floating: [],
    active: "welcome",
  };
}

test("first-launch cancellation remains on a recoverable native-folder landing state", async () => {
  const state = await createDesktopTestState();
  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    pickerCancel: true,
  });
  try {
    await expect(pageHeading(app.page)).toBeVisible();
    await expect(app.page.locator("[data-desktop-vault-launcher]")).toBeVisible();
    await expect(
      app.page.getByRole("button", { name: "Create New Vault" }),
    ).toBeVisible();
    await expect(
      app.page.getByRole("button", { name: /Open Demo Workspace/iu }),
    ).toHaveCount(0);
    await app.page.waitForTimeout(500);
    const open = app.page.getByRole("button", { name: /^Open Vault/u });
    await expect(open).toBeVisible();
    await open.click();
    await expect(open).toBeVisible();
    const create = app.page.getByRole("button", { name: /^Create New Vault/u });
    await create.click();
    await expect(create).toBeVisible();
    await expect(app.page.locator("main")).toHaveAttribute(
      "data-desktop-host-state",
      "landing",
    );
  } finally {
    await app.close();
    await state.cleanup();
  }
});

test("a selected empty folder mounts WorkspaceShell with native markers", async () => {
  const state = await createDesktopTestState();
  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
    captureLoadingGeometry: true,
  });
  try {
    await resetMainProcessUnhandledErrors(app.electronApp);
    await waitForDesktopWorkspace(app.page, app.rendererErrors);
    await expect(app.page.locator("[data-native-runtime]")).toHaveAttribute(
      "data-native-runtime",
      "electron-desktop",
    );
    const rendererSecurity = await app.page.evaluate(() => ({
      protocol: location.protocol,
      crossOriginIsolated: globalThis.crossOriginIsolated,
    }));
    expect(rendererSecurity.crossOriginIsolated).toBe(true);
    expect(rendererSecurity.protocol).toBe(
      usesDesktopDevRenderer() ? "http:" : "lapis-app:",
    );
    await expect(app.page.getByRole("tab", { name: "Search" })).toBeVisible();
    const runtime = await app.page.evaluate(() => ({
      runtime: (
        globalThis as typeof globalThis & {
          __LAPIS_NATIVE_DESKTOP__?: { runtime?: string };
        }
      ).__LAPIS_NATIVE_DESKTOP__?.runtime,
      vault: (
        globalThis as typeof globalThis & {
          app?: { vault: { getName(): string } };
        }
      ).app?.vault.getName(),
      pluginCount: (
        globalThis as typeof globalThis & {
          app?: { plugins: { plugins: Map<string, unknown> } };
        }
      ).app?.plugins.plugins.size,
      pluginIds: Array.from(
        (
          globalThis as typeof globalThis & {
            app?: { plugins: { plugins: Map<string, unknown> } };
          }
        ).app?.plugins.plugins.keys() ?? [],
      ).sort(),
    }));
    expect(runtime).toEqual({
      runtime: "electron-desktop",
      vault: "vault-a",
      pluginCount: 4,
      pluginIds: [
        "lapis-file-explorer",
        "lapis-markdown-lint",
        "markdown",
        "search",
      ],
    });
    const loadedFontFaces = await app.page.evaluate(async () => {
      const [sans, mono] = await Promise.all([
        document.fonts.load('400 16px "DM Sans Variable"', "Lapis Notes"),
        document.fonts.load(
          '400 16px "Source Code Pro Variable"',
          "const value = 1;",
        ),
      ]);
      return { sans: sans.length, mono: mono.length };
    });
    expect(loadedFontFaces.sans).toBeGreaterThan(0);
    expect(loadedFontFaces.mono).toBeGreaterThan(0);
    const shell = await app.page.evaluate(() => {
      const app = (
        globalThis as typeof globalThis & {
          app: {
            workspace: {
              leftSplit: { collapsed: boolean; sidebar: { width: string } };
              rightSplit: { collapsed: boolean };
              bottomPanel: { collapsed: boolean };
              toJson(): {
                main: { children: Array<{ children: unknown[] }> };
              };
            };
          };
        }
      ).app;
      const newTab = document.querySelector<HTMLButtonElement>(
        '[aria-label="New tab"]',
      );
      const root = document.querySelector<HTMLElement>("[data-app-shell-root]");
      const leftTabBar = document.querySelector<HTMLElement>(
        '[data-workspace-sidebar-side="left"] > [data-ui-part="sidebar-tab-bar"]',
      );
      const loadingGeometry = (
        globalThis as typeof globalThis & {
          __LAPIS_TEST_LOADING_GEOMETRY__?: {
            centerDeltaX: number;
            centerDeltaY: number;
          };
        }
      ).__LAPIS_TEST_LOADING_GEOMETRY__;
      return {
        leftCollapsed: app.workspace.leftSplit.collapsed,
        leftWidth: app.workspace.leftSplit.sidebar.width,
        rightCollapsed: app.workspace.rightSplit.collapsed,
        bottomCollapsed: app.workspace.bottomPanel.collapsed,
        mainLeafCount: app.workspace.toJson().main.children[0]?.children.length,
        newTabWidth: newTab?.getBoundingClientRect().width,
        rootDisplay: root ? getComputedStyle(root).display : null,
        bodyFont: getComputedStyle(document.body).fontFamily,
        loadingGeometry,
        rootClasses: Array.from(document.documentElement.classList),
        inlineSafeArea: document.documentElement.style.getPropertyValue(
          "--workspace-safe-area-left",
        ),
        leftTabBarPadding: leftTabBar
          ? Number.parseFloat(getComputedStyle(leftTabBar).paddingInlineStart)
          : null,
        expandedSidebarInset: getComputedStyle(
          document.documentElement,
        ).getPropertyValue("--lapis-desktop-window-controls-sidebar-left"),
      };
    });
    expect(shell).toMatchObject({
      leftCollapsed: false,
      leftWidth: "22rem",
      rightCollapsed: true,
      bottomCollapsed: true,
      mainLeafCount: 1,
      newTabWidth: 32,
      rootDisplay: "flex",
    });
    expect(shell.bodyFont).toMatch(/DM Sans/iu);
    expect(shell.loadingGeometry?.centerDeltaX).toBeLessThanOrEqual(1);
    expect(shell.loadingGeometry?.centerDeltaY).toBeLessThanOrEqual(1);
    expect(shell.rootClasses).toContain("lapis-desktop");
    expect(shell.inlineSafeArea).toBe("");
    if (process.platform === "darwin") {
      expect(shell.rootClasses).toContain("lapis-desktop--macos");
      expect(shell.expandedSidebarInset.trim()).toBe("80px");
      expect(shell.leftTabBarPadding).toBeGreaterThanOrEqual(39);
    } else {
      expect(shell.rootClasses).not.toContain("lapis-desktop--macos");
    }
    expect(app.rendererErrors).toEqual([]);
    expect(await getMainProcessUnhandledErrors(app.electronApp)).toEqual([]);
  } finally {
    await app.close();
    await state.cleanup();
  }
});

test("restores every available plugin view from persisted missing-view placeholders", async () => {
  const state = await createDesktopTestState();
  const configDir = path.join(state.vaultA, ".obsidian");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(path.join(state.vaultA, "Welcome.md"), "# Welcome\n\n#desktop\n");
  fs.writeFileSync(
    path.join(configDir, "workspace.json"),
    JSON.stringify(restoredPluginLayout(), null, 2),
  );

  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
  });
  try {
    await waitForDesktopWorkspace(app.page, app.rendererErrors);
    await expect(app.page.locator('[data-testid="lapis-editor-explorer"]')).toBeVisible();
    await expect(
      app.page
        .locator('[data-testid="lapis-editor-explorer"]')
        .getByText("Welcome.md", { exact: true }),
    ).toBeVisible();

    const restored = await app.page.evaluate(() => {
      const workspace = (
        globalThis as typeof globalThis & {
          app: {
            workspace: {
              getLeavesOfType(type: string): unknown[];
              toJson(): unknown;
            };
          };
        }
      ).app.workspace;
      const types = [
        "markdown",
        "file-explorer",
        "search",
        "backlink",
        "outgoing-link",
        "tag",
        "outline",
        "file-properties",
        "all-properties",
      ];
      return {
        counts: Object.fromEntries(
          types.map((type) => [type, workspace.getLeavesOfType(type).length]),
        ),
        layout: workspace.toJson(),
      };
    });

    expect(restored.counts).toEqual({
      markdown: 1,
      "file-explorer": 1,
      search: 1,
      backlink: 1,
      "outgoing-link": 1,
      tag: 1,
      outline: 1,
      "file-properties": 1,
      "all-properties": 1,
    });
    expect(JSON.stringify(restored.layout)).not.toContain(
      '"__missingViewType":"search"',
    );
    expect(JSON.stringify(restored.layout)).toContain(
      '"__missingViewType":"bookmarks"',
    );

    await app.page.getByRole("tab", { name: "Search" }).click();
    const searchPanel = app.page.locator('[data-testid="search-panel"]');
    await expect(searchPanel).toBeVisible();
    await expect(
      searchPanel.getByRole("searchbox", { name: "Search vault" }),
    ).toHaveText("Welcome");
    await expect(
      searchPanel
        .getByRole("tree", { name: "Search results" })
        .getByRole("treeitem", { name: /Welcome\.md, \d+ matches?/u }),
    ).toBeVisible();
    expect(app.rendererErrors).toEqual([]);
  } finally {
    await app.close();
    await state.cleanup();
  }
});

test("workspace state persists in the vault and the saved profile reopens", async () => {
  const state = await createDesktopTestState();
  const first = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
  });
  try {
    await waitForDesktopWorkspace(first.page);
    await first.page.evaluate(() => {
      const app = (
        globalThis as typeof globalThis & {
          app: {
            workspace: {
              leftSplit: { collapse(): void };
              requestSaveLayout(event: { source: string }): void;
            };
          };
        }
      ).app;
      app.workspace.leftSplit.collapse();
      app.workspace.requestSaveLayout({ source: "api" });
    });
    await expect
      .poll(() => fs.existsSync(path.join(state.vaultA, ".obsidian/workspace.json")))
      .toBe(true);
    await first.page.waitForTimeout(1_200);
  } finally {
    await first.close();
  }

  const second = await launchDesktopApp({ userDataDir: state.userDataDir });
  try {
    await waitForDesktopWorkspace(second.page);
    expect(
      await second.page.evaluate(() => ({
        name: (
          globalThis as typeof globalThis & {
            app: {
              vault: { getName(): string };
              workspace: { leftSplit: { collapsed: boolean } };
            };
          }
        ).app.vault.getName(),
        leftCollapsed: (
          globalThis as typeof globalThis & {
            app: { workspace: { leftSplit: { collapsed: boolean } } };
          }
        ).app.workspace.leftSplit.collapsed,
      })),
    ).toEqual({ name: "vault-a", leftCollapsed: true });
  } finally {
    await second.close();
    await state.cleanup();
  }
});

test("a missing remembered folder clears only the current pointer", async () => {
  const state = await createDesktopTestState();
  const missing = path.join(state.root, "missing-vault");
  const id = `desktop-folder:${missing}`;
  fs.writeFileSync(
    path.join(state.userDataDir, "vault-bootstrap-kv.json"),
    JSON.stringify({
      "profile:current": id,
      [`profile:${id}`]: {
        id,
        name: "Missing vault",
        kind: "desktop-folder",
        handle: { rootPath: missing },
        createdAt: 1,
        updatedAt: 1,
      },
    }),
  );
  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    pickerCancel: true,
  });
  try {
    await expect(pageHeading(app.page)).toBeVisible();
    await expect(app.page.locator("main")).toHaveAttribute(
      "data-desktop-host-state",
      "landing",
    );
    const stored = JSON.parse(
      fs.readFileSync(
        path.join(state.userDataDir, "vault-bootstrap-kv.json"),
        "utf8",
      ),
    ) as Record<string, unknown>;
    expect(stored["profile:current"]).toBeUndefined();
    expect(stored[`profile:${id}`]).toBeDefined();
  } finally {
    await app.close();
    await state.cleanup();
  }
});

test("workspace vault controls switch sessions and return to the launcher", async () => {
  const state = await createDesktopTestState();
  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
  });
  try {
    await waitForDesktopWorkspace(app.page);
    await switchTestVault(app.electronApp, app.page, state.vaultB);
    await expect(app.page.locator("[data-vault-id]")).toHaveAttribute(
      "data-vault-id",
      `desktop-folder:${state.vaultB}`,
    );
    expect(
      await app.page.evaluate(() =>
        (
          globalThis as typeof globalThis & {
            app: { vault: { getName(): string } };
          }
        ).app.vault.getName(),
      ),
    ).toBe("vault-b");
    await app.page.evaluate(async () => {
      await (
        globalThis as typeof globalThis & {
          app: {
            vault: { create(path: string, content: string): Promise<unknown> };
          };
        }
      ).app.vault.create("switched.md", "new session");
    });
    expect(fs.existsSync(path.join(state.vaultB, "switched.md"))).toBe(true);
    expect(fs.existsSync(path.join(state.vaultA, "switched.md"))).toBe(false);

    const vaultSwitcher = app.page.getByRole("button", {
      name: "Current workspace: vault-b",
    });
    await vaultSwitcher.click();
    await expect(
      app.page.getByRole("menuitem", { name: /vault-b/u }),
    ).toHaveAttribute("data-disabled");
    await app.page.getByRole("menuitem", { name: /vault-a/u }).click();
    await expect(app.page.locator("[data-vault-id]")).toHaveAttribute(
      "data-vault-id",
      `desktop-folder:${state.vaultA}`,
    );
    await app.page.evaluate(async () => {
      await (
        globalThis as typeof globalThis & {
          app: {
            vault: { create(path: string, content: string): Promise<unknown> };
          };
        }
      ).app.vault.create("returned.md", "returned session");
    });
    expect(fs.existsSync(path.join(state.vaultA, "returned.md"))).toBe(true);
    expect(fs.existsSync(path.join(state.vaultB, "returned.md"))).toBe(false);

    await app.page
      .getByRole("button", { name: "Current workspace: vault-a" })
      .click();
    await app.page.getByRole("menuitem", { name: "Manage Vaults" }).click();
    await expect(
      app.page.locator("[data-desktop-vault-launcher]"),
    ).toBeVisible();
    const stored = JSON.parse(
      fs.readFileSync(
        path.join(state.userDataDir, "vault-bootstrap-kv.json"),
        "utf8",
      ),
    ) as Record<string, unknown>;
    expect(stored["profile:current"]).toBeUndefined();
    expect(stored[`profile:desktop-folder:${state.vaultA}`]).toBeDefined();
    expect(stored[`profile:desktop-folder:${state.vaultB}`]).toBeDefined();

    const viewport = await app.page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
    }));
    const launcherContent = app.page.locator(
      "[data-desktop-vault-launcher-content]",
    );
    const launcherBox = await launcherContent.boundingBox();
    expect(launcherBox).not.toBeNull();
    expect(
      Math.abs(launcherBox!.y + launcherBox!.height / 2 - viewport.height / 2),
    ).toBeLessThanOrEqual(1);
    await app.page
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    const settingsDialog = app.page.getByRole("dialog", {
      name: "Desktop Settings",
    });
    await expect(settingsDialog).toBeVisible();
    const settingsOverlay = app.page.locator(
      '[data-ui-component="dialog"][data-ui-part="dialog-overlay"]',
    );
    await expect(settingsOverlay).toBeVisible();
    await expect(settingsOverlay).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0.5)",
    );
    const settingsBox = await settingsDialog.boundingBox();
    expect(settingsBox).not.toBeNull();
    expect(settingsBox!.width).toBeLessThanOrEqual(448);
    expect(
      Math.abs(settingsBox!.x + settingsBox!.width / 2 - viewport.width / 2),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(settingsBox!.y + settingsBox!.height / 2 - viewport.height / 2),
    ).toBeLessThanOrEqual(1);
    await settingsDialog.getByRole("button", { name: "Close" }).click();

    const viewAll = app.page.getByRole("button", { name: "View all" });
    await expect(viewAll).toBeVisible();
    await viewAll.click();
    const recentProjects = app.page.locator(
      '[data-ui-component="command"][data-ui-part="command-content"]',
    );
    await expect(recentProjects).toBeVisible();
    await expect(
      recentProjects.getByText("vault-a", { exact: true }),
    ).toBeVisible();
    await expect(
      recentProjects.getByText("vault-b", { exact: true }),
    ).toBeVisible();
    await expect(recentProjects).toHaveCSS("position", "fixed");
    const commandOverlay = app.page.locator(
      '[data-ui-component="dialog"][data-ui-part="dialog-overlay"]',
    );
    await expect(commandOverlay).toBeVisible();
    await expect(commandOverlay).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0.5)",
    );
    const paletteBox = await recentProjects.boundingBox();
    expect(paletteBox).not.toBeNull();
    expect(paletteBox!.width).toBeLessThanOrEqual(544);
    expect(paletteBox!.y).toBeLessThan(viewport.height / 3);
    expect(paletteBox!.y + paletteBox!.height).toBeLessThan(
      viewport.height - 48,
    );
    await app.page.keyboard.press("Escape");
    await expect(recentProjects).not.toBeVisible();

    await viewAll.click();
    await recentProjects.getByText("vault-a", { exact: true }).click();
    await expect(app.page.locator("[data-vault-id]")).toHaveAttribute(
      "data-vault-id",
      `desktop-folder:${state.vaultA}`,
    );
    expect(app.rendererErrors).toEqual([]);
  } finally {
    await app.close();
    await state.cleanup();
  }
});

test("a second-instance app URL reaches the ready workspace host", async () => {
  const state = await createDesktopTestState();
  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
  });
  try {
    await resetMainProcessUnhandledErrors(app.electronApp);
    await waitForDesktopWorkspace(app.page, app.rendererErrors);
    await app.page.evaluate(() => {
      const root = globalThis as typeof globalThis & {
        app: {
          urls: {
            registerProtocolHandler(
              action: string,
              handler: (params: Record<string, string>) => void,
            ): () => void;
          };
        };
        __secondInstanceAppUrls?: Array<Record<string, string>>;
      };
      root.__secondInstanceAppUrls = [];
      root.app.urls.registerProtocolHandler("acceptance", (params) => {
        root.__secondInstanceAppUrls?.push(params);
      });
    });

    const second = await launchSecondDesktopInstance({
      electronApp: app.electronApp,
      userDataDir: state.userDataDir,
      appUrl: "lapis://acceptance?source=second-instance",
    });

    expect(second.exitCode).toBe(0);
    expect(second.stderr).not.toMatch(/\b(?:error|exception|failed)\b/iu);
    await expect
      .poll(() =>
        app.page.evaluate(
          () =>
            (
              globalThis as typeof globalThis & {
                __secondInstanceAppUrls?: Array<Record<string, string>>;
              }
            ).__secondInstanceAppUrls,
        ),
      )
      .toEqual([{ action: "acceptance", source: "second-instance" }]);
    expect(
      await app.electronApp.evaluate(
        ({ BrowserWindow }) => BrowserWindow.getAllWindows().length,
      ),
    ).toBe(1);
    expect(app.rendererErrors).toEqual([]);
    expect(await getMainProcessUnhandledErrors(app.electronApp)).toEqual([]);
  } finally {
    await app.close();
    await state.cleanup();
  }
});

function pageHeading(page: Page) {
  return page.getByRole("heading", { name: /^(?:Create|Open) a vault$/u });
}
