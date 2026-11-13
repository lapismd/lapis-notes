import { expect, it, vi } from "vitest";
import { installManifestDiscovery } from "../plugin-manifest-discovery";
import type { App } from "../context.svelte";
import type { LapisContributionIndexEntry } from "../lapis-extension";
import type { MarkdownViewMenuItemProvider } from "../markdown";

function fixture() {
  const file = { path: "Note.md" };
  const leaf = { id: "note", view: { file } };
  let currentLeaf: unknown = leaf;
  const providers = new Set<MarkdownViewMenuItemProvider>();
  const activateLeaf = vi.fn();
  const app = {
    workspace: { getLeafById: () => currentLeaf, activateLeaf },
    registerMarkdownViewMenuItem: (provider: MarkdownViewMenuItemProvider) => {
      providers.add(provider);
    },
    unregisterMarkdownViewMenuItem: (
      provider: MarkdownViewMenuItemProvider,
    ) => {
      providers.delete(provider);
    },
  } as unknown as App;
  let resume!: () => void;
  const gate = new Promise<void>((resolve) => {
    resume = resolve;
  });
  const execute = vi.fn();
  const invoke = vi.fn(async (_command: string, prepare?: () => boolean) => {
    await gate;
    if (prepare?.()) execute();
  });
  const dispose = installManifestDiscovery(
    app,
    {
      pluginId: "demand",
      kind: "markdownViewMenuItems",
      contribution: { id: "present", title: "Present", command: "present" },
    } as LapisContributionIndexEntry,
    invoke,
  );
  const provider = [...providers][0]!;
  let click!: () => unknown;
  const item = {
    setTitle: () => item,
    setIcon: () => item,
    setSection: () => item,
    onClick: (callback: () => unknown) => {
      click = callback;
      return item;
    },
  };
  const addItem = vi.fn((callback: (item: unknown) => void) => {
    callback(item);
  });
  const render = () =>
    provider({ menu: { addItem }, leaf, file, source: "more-options" } as any);
  render();
  return {
    leaf,
    retire: () => {
      currentLeaf = null;
    },
    invoke,
    execute,
    activateLeaf,
    resume,
    dispose,
    render,
    addItem,
    click: () => click(),
  };
}

it.each(["retired", "changed"])(
  "does not execute a %s Markdown menu target after activation",
  async (state) => {
    const f = fixture();
    const action = f.click();
    expect(f.invoke).toHaveBeenCalledOnce();
    if (state === "retired") f.retire();
    else f.leaf.view.file = { path: "Other.md" };
    f.resume();
    await action;
    expect(f.execute).not.toHaveBeenCalled();
    expect(f.activateLeaf).not.toHaveBeenCalled();
    f.dispose();
  },
);

it("keeps an admitted menu action when runtime activation replaces its placeholder", async () => {
  const f = fixture();
  const action = f.click();
  f.dispose();
  f.resume();
  await action;
  expect(f.execute).toHaveBeenCalledOnce();
  expect(f.activateLeaf).toHaveBeenCalledWith(
    f.leaf,
    expect.objectContaining({ source: "api" }),
  );
});

it("fences menu providers and callbacks retained after disposal", async () => {
  const f = fixture();
  f.dispose();
  f.render();
  await f.click();
  expect(f.addItem).toHaveBeenCalledTimes(1);
  expect(f.invoke).not.toHaveBeenCalled();
  f.resume();
});
