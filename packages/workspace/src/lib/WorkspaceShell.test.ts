import { mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    width: "0px",
  },
  right: {
    id: "right",
    type: "split",
    direction: "vertical",
    sizes: [],
    children: [],
    width: "0px",
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
      target.querySelector('[data-workspace-tab-id="empty-start"]'),
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
    expect(loadPlugins).not.toHaveBeenCalled();
    target.remove();
  });
});
