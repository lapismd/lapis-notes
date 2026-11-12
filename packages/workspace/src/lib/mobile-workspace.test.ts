import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, unmount } from "svelte";
import type { App } from "../../test/api-app";
import WorkspaceShellTestHarness from "./WorkspaceShellTestHarness.test.svelte";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  bindMobileWorkspaceCommands,
  mobileWorkspaceActions,
} from "./mobile-workspace";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

async function fixture() {
  const target = document.body.appendChild(document.createElement("div"));
  let app!: App;
  let dispose!: () => void;
  const component = mount(WorkspaceShellTestHarness, {
    target,
    props: {
      layout: {},
      displayMode: "mobile",
      onAppReady: (ready) => {
        app = ready;
        dispose = bindMobileWorkspaceCommands(
          app,
          getWorkspaceHostBinding(app.workspace).controller,
        );
      },
    },
  });
  await vi.waitFor(
    () =>
      expect(
        target.querySelector('[data-app-shell-ready="true"]'),
      ).not.toBeNull(),
    { timeout: 15_000 },
  );
  const { controller } = getWorkspaceHostBinding(app.workspace);
  await app.fileManager.createFile("Untitled.md", "Existing note");
  cleanups.push(async () => {
    dispose();
    await unmount(component);
    await app.fileEditingSessions.dispose();
    await app.workspace.disposeWorkspaceHost();
    target.remove();
  });
  return { app, adapter: app.vault.adapter, controller, dispose };
}

describe("mobile workspace integration", () => {
  it("cycles persisted modes and exposes controller-owned navigation commands", async () => {
    const { app, controller } = await fixture();
    await app.commands.executeCommand("workspace:use-mobile-layout");
    expect(
      app.configuration.getConfiguration().get("workspace.mobile.mode"),
    ).toBe("always");
    await app.commands.executeCommand("workspace:toggle-mobile-layout");
    expect(
      app.configuration.getConfiguration().get("workspace.mobile.mode"),
    ).toBe("never");
    await app.commands.executeCommand("workspace:toggle-mobile-layout");
    expect(
      app.configuration.getConfiguration().get("workspace.mobile.mode"),
    ).toBe("auto");
    await app.commands.executeCommand("workspace:open-mobile-tabs");
    expect(controller.renderer.mobileNavigation.page).toBe("tabs");
    await app.commands.executeCommand("workspace:open-mobile-right-sidebar");
    expect(controller.renderer.mobileNavigation.reveal).toBe("right");
    expect(controller.renderer.mobileNavigation.page).toBe("editor");
  });

  it("runs the registered Search command before revealing its mobile sidebar", async () => {
    const { app, controller } = await fixture();
    const search = vi.fn(() =>
      controller.renderer.mobileNavigation.openSidebar("right"),
    );
    app.commands.registerCommand({
      id: "search:open-search",
      name: "Open Search",
      callback: search,
    });
    const actions = mobileWorkspaceActions(app);
    expect(actions.search.disabled).toBe(false);
    await actions.search.onSelect();
    expect(search).toHaveBeenCalledOnce();
    expect(controller.renderer.mobileNavigation.reveal).toBe("right");
    app.commands.unregisterCommand("search:open-search");
    expect(mobileWorkspaceActions(app).search.disabled).toBe(true);
  });

  it("serializes new-note creation without replacing existing bytes and opens both files", async () => {
    const { app, adapter } = await fixture();
    const before = new Set(app.vault.getFiles().map((file) => file.path));
    const open = vi.spyOn(app, "openFile").mockResolvedValue(undefined);
    await Promise.all([
      app.commands.executeCommand("app:new-note"),
      app.commands.executeCommand("app:new-note"),
    ]);
    expect(await adapter.read("/Untitled.md")).toBe("Existing note");
    expect(
      app.vault
        .getFiles()
        .map((file) => file.path)
        .filter((path) => !before.has(path))
        .sort(),
    ).toEqual(["Untitled 1.md", "Untitled 2.md"]);
    expect(open.mock.calls.map(([file]) => file.path)).toEqual([
      "Untitled 1.md",
      "Untitled 2.md",
    ]);
  });

  it("removes only its owned commands and preserves a replacement registration", async () => {
    const { app, dispose } = await fixture();
    app.commands.unregisterCommand("workspace:use-mobile-layout");
    const replacement = {
      id: "workspace:use-mobile-layout",
      name: "Replacement",
      callback: vi.fn(),
    };
    app.commands.registerCommand(replacement);
    const registeredReplacement = app.commands.getCommand(replacement.id);
    dispose();
    expect(app.commands.getCommand("workspace:use-mobile-layout")).toBe(
      registeredReplacement,
    );
    expect(
      app.commands.getCommand("workspace:open-mobile-tabs"),
    ).toBeUndefined();
    expect(app.commands.getCommand("app:new-note")).toBeUndefined();
  });
});
