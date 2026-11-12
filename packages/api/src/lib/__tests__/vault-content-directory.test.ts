import { expect, it, vi } from "vitest";
import {
  isVaultContent,
  vaultContentAdapter,
} from "../storage/vault-content-adapter";
import { DirectoryWatcher } from "../storage/directory-watcher";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

it("excludes the complete app-state directory without hiding similarly named user files", () => {
  for (const path of [
    ".lapis",
    ".lapis/app.json",
    ".lapis/workspace.json",
    ".lapis/plugin-registry-cache/index.json",
    ".lapis/plugins/tasks/data.json",
  ])
    expect(isVaultContent(path, ".lapis", "watch"), path).toBe(false);
  for (const path of ["Note.md", ".lapis-notes.md", "Notes/.lapis/example.md"])
    expect(isVaultContent(path, ".lapis", "watch"), path).toBe(true);
  expect(
    isVaultContent("custom/state/config.json", "/custom/state/", "watch"),
  ).toBe(false);
  expect(isVaultContent("custom/states/note.md", "custom/state", "watch")).toBe(
    true,
  );
});

it("does not list or stat app-state descendants while polling and retains direct config access", async () => {
  const adapter = new InMemoryDataAdapter();
  await adapter.mkdir(".lapis");
  await adapter.mkdir(".lapis/plugin-registry-cache");
  await adapter.write(".lapis/app.json", "{}");
  await adapter.write(".lapis/plugin-registry-cache/index.json", "{}");
  await adapter.write("Note.md", "note");
  const stat = vi.spyOn(adapter, "stat");
  const list = vi.spyOn(adapter, "list");
  const watcher = new DirectoryWatcher(
    vaultContentAdapter(adapter, () => ".lapis", "watch"),
    5,
  );
  try {
    const subscription = watcher.watch("/", { recursive: true });
    await subscription.ready;
    await vi.waitFor(() =>
      expect(
        list.mock.calls.filter(([path]) => path === "/").length,
      ).toBeGreaterThanOrEqual(2),
    );
    expect(
      stat.mock.calls.some(
        ([path]) =>
          path.replace(/^\//, "") === ".lapis" ||
          path.replace(/^\//, "").startsWith(".lapis/"),
      ),
    ).toBe(false);
    expect(
      list.mock.calls.some(
        ([path]) =>
          path.replace(/^\//, "") === ".lapis" ||
          path.replace(/^\//, "").startsWith(".lapis/"),
      ),
    ).toBe(false);
    expect(await adapter.read(".lapis/app.json")).toBe("{}");
    expect(
      stat.mock.calls.some(([path]) => path.replace(/^\//, "") === "Note.md"),
    ).toBe(true);
  } finally {
    await watcher.close();
  }
});

it("keeps registry caches out of initial content discovery while retaining configuration records", async () => {
  const adapter = new InMemoryDataAdapter();
  await adapter.mkdir(".lapis");
  await adapter.mkdir(".lapis/plugin-registry-cache");
  await adapter.write(".lapis/app.json", "{}");
  await adapter.write(".lapis/plugin-registry-cache/index.json", "{}");
  const content = vaultContentAdapter(adapter, () => ".lapis");
  expect((await content.list(".lapis")).folders).not.toContain(
    "plugin-registry-cache",
  );
  expect((await content.list(".lapis")).files).toContain("app.json");
  expect(await adapter.read(".lapis/plugin-registry-cache/index.json")).toBe(
    "{}",
  );
});

it("filters native root hints and preserves exact configuration and cross-scope renames", () => {
  const callbacks = new Map<string, (event: any) => void>();
  const adapter = Object.assign(new InMemoryDataAdapter(), {
    watch(
      path: string | string[],
      _options: unknown,
      accept: (event: any) => void,
    ) {
      callbacks.set(String(path), accept);
      return {
        close: async () => {
          callbacks.delete(String(path));
        },
      };
    },
  });
  const content = vaultContentAdapter(
    adapter,
    () => ".lapis",
    "watch",
  ) as typeof adapter;
  const root = vi.fn(),
    leaf = vi.fn();
  content.watch("/", { recursive: true }, root);
  content.watch(".lapis/app.json", { recursive: false }, leaf);
  const rootHint = callbacks.get("/")!;
  rootHint({ type: "modify", path: ".lapis/app.json" });
  rootHint({ type: "modify", path: ".lapis/plugin-registry-cache/index.json" });
  expect(root).not.toHaveBeenCalled();
  callbacks.get(".lapis/app.json")!({
    type: "modify",
    path: ".lapis/app.json",
  });
  expect(leaf).toHaveBeenCalledExactlyOnceWith({
    type: "modify",
    path: ".lapis/app.json",
  });
  rootHint({
    type: "modify",
    path: ".lapis/saved.md",
    previousPath: "Note.md",
  });
  expect(root).toHaveBeenLastCalledWith({ type: "delete", path: "Note.md" });
  rootHint({
    type: "modify",
    path: "Returned.md",
    previousPath: ".lapis/saved.md",
  });
  expect(root).toHaveBeenLastCalledWith({
    type: "create",
    path: "Returned.md",
  });
});
