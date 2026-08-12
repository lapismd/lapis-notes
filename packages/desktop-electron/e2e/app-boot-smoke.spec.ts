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
  });
  try {
    await resetMainProcessUnhandledErrors(app.electronApp);
    await waitForDesktopWorkspace(app.page, app.rendererErrors);
    await expect(app.page.locator("[data-native-runtime]")).toHaveAttribute(
      "data-native-runtime",
      "electron-desktop",
    );
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
    }));
    expect(runtime).toEqual({
      runtime: "electron-desktop",
      vault: "vault-a",
      pluginCount: 0,
    });
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
      return {
        leftCollapsed: app.workspace.leftSplit.collapsed,
        leftWidth: app.workspace.leftSplit.sidebar.width,
        rightCollapsed: app.workspace.rightSplit.collapsed,
        bottomCollapsed: app.workspace.bottomPanel.collapsed,
        mainLeafCount: app.workspace.toJson().main.children[0]?.children.length,
        newTabWidth: newTab?.getBoundingClientRect().width,
        rootDisplay: root ? getComputedStyle(root).display : null,
        bodyFont: getComputedStyle(document.body).fontFamily,
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
    expect(app.rendererErrors).toEqual([]);
    expect(await getMainProcessUnhandledErrors(app.electronApp)).toEqual([]);
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

test("Open Vault switches sessions and leaves no old-vault writes", async () => {
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
      await app.page.evaluate(
        () =>
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
