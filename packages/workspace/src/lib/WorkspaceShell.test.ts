import { mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { App } from "../../test/api-app";
import WorkspaceShellTestHarness from "./WorkspaceShellTestHarness.test.svelte";

const initialLayout = {
  main: {
    id: "main",
    type: "split",
    direction: "vertical",
    sizes: [100],
    children: [
      {
        id: "main-tabs",
        type: "tabs",
        stacked: false,
        currentTab: 0,
        children: [
          {
            id: "empty-start",
            type: "leaf",
            state: {
              type: "empty",
              state: {},
              icon: "ghost",
              title: "New Tab",
            },
          },
        ],
      },
    ],
  },
  left: {
    id: "left",
    type: "split",
    direction: "vertical",
    sizes: [],
    children: [],
    width: "18rem",
  },
  right: {
    id: "right",
    type: "split",
    direction: "vertical",
    sizes: [],
    children: [],
    width: "0px",
  },
  bottom: {
    id: "bottom-panel",
    type: "tabs",
    stacked: false,
    currentTab: 0,
    children: [
      {
        id: "bottom-output",
        type: "leaf",
        state: {
          type: "empty",
          state: {},
          icon: "terminal",
          title: "Output",
        },
      },
    ],
    height: "240px",
  },
  floating: [],
  active: "empty-start",
};

describe("WorkspaceShell", () => {
  const mounted: Array<ReturnType<typeof mount>> = [];

  afterEach(async () => {
    for (const component of mounted.splice(0)) await unmount(component);
  });

  it("mounts a restored API App without loading Lapis plugins", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    let app!: App;
    let loadPlugins!: ReturnType<typeof vi.spyOn>;
    mounted.push(
      mount(WorkspaceShellTestHarness, {
        target,
        props: {
          layout: initialLayout,
          workspaceNavigation: {
            currentLabel: "Test vault",
            items: [],
            onSelect: vi.fn(),
            onManage: vi.fn(),
          },
          onAppReady: (readyApp) => {
            app = readyApp;
            loadPlugins = vi.spyOn(app.plugins, "loadPlugins");
          },
        },
      }),
    );

    await vi.waitFor(() => {
      expect(
        target
          .querySelector('[data-ui-component="app-shell"]')
          ?.getAttribute("data-app-shell-ready"),
      ).toBe("true");
    });

    expect(
      target.querySelector('[data-ui-component="lapis-workspace-shell"]'),
    ).not.toBeNull();
    expect(
      target.querySelector('[aria-label="Current workspace: Test vault"]'),
    ).not.toBeNull();
    expect(
      target.querySelector('[data-workspace-tab-id="empty-start"]'),
    ).not.toBeNull();
    expect(
      target.querySelector('[data-ui-component="workspace-bottom-panel"]'),
    ).not.toBeNull();
    expect(
      target.querySelector('[data-workspace-tab-id="bottom-output"]'),
    ).not.toBeNull();
    expect(
      target.querySelector('[data-status-bar-item-id="notifications:status"]'),
    ).not.toBeNull();
    const version = target.querySelector<HTMLButtonElement>(
      '[data-status-bar-item-id="app-shell:version"]',
    );
    expect(version?.textContent).toContain("v0.0.1-test");
    version?.click();
    await vi.waitFor(() => {
      expect(
        target.querySelector('[data-ui-component="workspace-about-dialog"]'),
      ).not.toBeNull();
      expect(
        target.querySelector<HTMLImageElement>(
          '[data-ui-component="workspace-about-dialog"] img[alt="Lapis Notes"]',
        )?.src,
      ).toContain("lapis-logo.svg");
    });
    const ribbonSettings = target.querySelector<HTMLButtonElement>(
      '[data-ui-part="bottom-actions"] [aria-label="Settings"]',
    );
    expect(ribbonSettings).not.toBeNull();
    ribbonSettings?.click();
    await vi.waitFor(() => {
      expect(
        target.querySelector('[data-ui-component="app-shell-settings-dialog"]'),
      ).not.toBeNull();
    });
    expect(loadPlugins).not.toHaveBeenCalled();
    target.remove();
  });

  it("maps the persisted new-tab focus preference into the renderer policy", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    let app!: App;
    mounted.push(
      mount(WorkspaceShellTestHarness, {
        target,
        props: {
          layout: initialLayout,
          onAppReady: (readyApp) => {
            app = readyApp;
          },
        },
      }),
    );

    await vi.waitFor(() => {
      expect(
        target
          .querySelector('[data-ui-component="app-shell"]')
          ?.getAttribute("data-app-shell-ready"),
      ).toBe("true");
    });
    const renderer = getWorkspaceHostBinding(app.workspace).controller.renderer;
    expect(renderer.activateNewTabs).toBe(false);

    await app.configuration
      .getConfiguration()
      .update("editor.alwaysFocusNewTabs", true);
    await vi.waitFor(() => expect(renderer.activateNewTabs).toBe(true));

    target.remove();
  });
});
