import { describe, expect, it, vi } from "vitest";
import type { App, FileTextConflict } from "@lapis-notes/api";
import { FileTextConflictRegistry } from "@lapis-notes/api";
import * as workspace from "../index";

vi.mock("@lapis-notes/api/workspace-host", () => ({
  getWorkspaceHostBinding: (app: { controller: unknown }) => ({
    controller: app.controller,
  }),
}));

type Bind = (app: App, options?: { disabled?: () => boolean }) => () => void;
function bind(): Bind {
  const value = Reflect.get(workspace, "bindFileConflictReviews");
  expect(
    value,
    "Workspace must expose its owned text-conflict presentation",
  ).toBeTypeOf("function");
  return value;
}

function fixture() {
  const conflicts = new FileTextConflictRegistry();
  const collection = { set: vi.fn(), delete: vi.fn(), dispose: vi.fn() };
  const stopNavigation = vi.fn();
  const controller = {
    start: vi.fn(async () => {}),
    commands: { execute: vi.fn(async () => {}) },
    workspace: { closeLeaf: vi.fn() },
  };
  const leaf = {
    id: "review-leaf",
    setViewState: vi.fn(async () => {}),
    view: { getState: () => ({ path: "Note.md" }) },
    containerEl: document.createElement("div"),
  };
  const app = {
    controller,
    fileEditingSessions: { textConflicts: conflicts },
    notifications: { notify: vi.fn() },
    workspace: {
      controller,
      diagnostics: { createCollection: vi.fn(() => collection) },
      registerView:
        vi.fn<(type: string, create: (leaf: unknown) => object) => void>(),
      unregisterView:
        vi.fn<(type: string, create: (leaf: unknown) => object) => void>(),
      registerDiagnosticOpener: vi.fn<
        (open: (location: unknown) => Promise<boolean>) => () => void
      >(() => stopNavigation),
      getLeavesOfType: vi.fn(() => [] as (typeof leaf)[]),
      getLeaf: vi.fn(() => leaf),
      setActiveLeaf: vi.fn(),
      revealLeaf: vi.fn(async () => {}),
      requestSaveLayout: vi.fn(),
    },
  };
  Object.assign(leaf, { app });
  const conflict: FileTextConflict = {
    id: "captured-conflict",
    path: "Note.md",
    baseline: "before",
    local: "local",
    external: "disk",
    resolve: vi.fn(async () => {}),
    resolveMerged: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
  };
  return {
    app: app as unknown as App,
    raw: app,
    conflicts,
    collection,
    stopNavigation,
    leaf,
    conflict,
  };
}

describe("shared file-conflict binding", () => {
  it("shares an early host lease with shell leases and disposes only after final release", async () => {
    const f = fixture();
    const subscribe = vi.spyOn(f.conflicts, "subscribe");
    const first = bind()(f.app);
    const second = bind()(f.app);
    f.conflicts.publish(f.conflict);
    await vi.waitFor(() =>
      expect(f.raw.controller.commands.execute).toHaveBeenCalledExactlyOnceWith(
        "app-shell:show-problems",
      ),
    );
    expect(subscribe).toHaveBeenCalledOnce();
    expect(f.raw.workspace.registerView).toHaveBeenCalledExactlyOnceWith(
      "desktop:file-conflict",
      expect.any(Function),
    );
    expect(
      f.raw.workspace.diagnostics.createCollection,
    ).toHaveBeenCalledExactlyOnceWith("desktop:file-conflicts", {
      label: "File conflicts",
    });
    first();
    first();
    expect(f.collection.dispose).not.toHaveBeenCalled();
    second();
    second();
    expect(f.collection.dispose).toHaveBeenCalledOnce();
    expect(f.stopNavigation).toHaveBeenCalledOnce();
    expect(f.raw.workspace.unregisterView).toHaveBeenCalledExactlyOnceWith(
      "desktop:file-conflict",
    );
    expect(f.conflicts.entries).toEqual([f.conflict]);
    expect(f.conflict.resolve).not.toHaveBeenCalled();
  });

  it("keeps diagnostics and lifetime isolated between explicitly owned Apps", () => {
    const a = fixture(),
      b = fixture();
    const stopA = bind()(a.app),
      stopB = bind()(b.app);
    a.conflicts.publish(a.conflict);
    expect(a.collection.set).toHaveBeenCalledOnce();
    expect(b.collection.set).not.toHaveBeenCalled();
    stopA();
    b.conflicts.publish(b.conflict);
    expect(b.collection.set).toHaveBeenCalledOnce();
    expect(b.collection.dispose).not.toHaveBeenCalled();
    stopB();
  });

  it("combines live disabled predicates instead of caching the first default", () => {
    const f = fixture();
    const shell = bind()(f.app);
    let blocked = true;
    const early = bind()(f.app, { disabled: () => blocked });
    const create = f.raw.workspace.registerView.mock.calls[0][1] as (
      leaf: unknown,
    ) => object;
    const view = create(f.leaf);
    const model = Reflect.get(view, "model");
    expect(model.disabled()).toBe(true);
    blocked = false;
    expect(model.disabled()).toBe(false);
    blocked = true;
    early();
    expect(model.disabled()).toBe(false);
    shell();
  });

  it("reuses the captured path review and fences a retained opener after disposal", async () => {
    const f = fixture();
    const stop = bind()(f.app);
    f.conflicts.publish(f.conflict);
    const open = f.raw.workspace.registerDiagnosticOpener.mock.calls[0][0] as (
      location: unknown,
    ) => Promise<boolean>;
    const location = { resource: { uri: "lapis-file-conflict:Note.md" } };
    expect(await open({ resource: { uri: "unrelated:Note.md" } })).toBe(false);
    expect(await open(location)).toBe(true);
    expect(f.leaf.setViewState).toHaveBeenCalledExactlyOnceWith({
      type: "desktop:file-conflict",
      state: { path: "Note.md" },
    });
    f.raw.workspace.getLeavesOfType.mockReturnValue([f.leaf]);
    await open(location);
    expect(f.leaf.setViewState).toHaveBeenCalledOnce();
    stop();
    f.raw.workspace.getLeaf.mockClear();
    f.raw.workspace.getLeavesOfType.mockReturnValue([]);
    expect(await open(location)).toBe(true);
    expect(f.raw.workspace.getLeaf).not.toHaveBeenCalled();
    expect(f.conflict.resolveMerged).not.toHaveBeenCalled();
  });

  for (const boundary of ["setViewState", "revealLeaf"] as const) {
    it(`fences navigation after final disposal while ${boundary} is pending`, async () => {
      const f = fixture();
      let release!: () => void;
      const waiting = new Promise<void>((resolve) => { release = resolve; });
      const delayed = boundary === "setViewState" ? f.leaf.setViewState : f.raw.workspace.revealLeaf;
      delayed.mockImplementation(async () => { await waiting; });
      const stop = bind()(f.app);
      f.conflicts.publish(f.conflict);
      const open = f.raw.workspace.registerDiagnosticOpener.mock.calls[0][0] as (location: unknown) => Promise<boolean>;
      const pending = open({ resource: { uri: "lapis-file-conflict:Note.md" } });
      await vi.waitFor(() => expect(delayed).toHaveBeenCalledOnce());
      stop();
      f.raw.workspace.setActiveLeaf.mockClear();
      f.raw.workspace.revealLeaf.mockClear();
      f.raw.workspace.requestSaveLayout.mockClear();
      release();
      expect(await pending).toBe(true);
      expect(f.raw.workspace.setActiveLeaf).not.toHaveBeenCalled();
      expect(f.raw.workspace.revealLeaf).not.toHaveBeenCalled();
      expect(f.raw.workspace.requestSaveLayout).not.toHaveBeenCalled();
    });
  }

});
