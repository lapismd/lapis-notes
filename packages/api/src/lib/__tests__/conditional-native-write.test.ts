import { afterEach, expect, it, vi } from "vitest";
import { NativeDesktopVaultAdapter, setNativeDesktopBridge } from "../storage";

afterEach(() => setNativeDesktopBridge(null));

function fixture(available = true) {
  const invoke = vi.fn(
    async (_command: string, _payload?: Record<string, unknown>) => undefined,
  );
  setNativeDesktopBridge({
    runtime: "tauri-desktop",
    capabilities: {
      "conditional-text-write": {
        id: "conditional-text-write",
        status: available ? "available" : "unavailable",
      },
    },
    invoke: async <T>(command: string, payload?: Record<string, unknown>) =>
      (await invoke(command, payload)) as T,
  });
  return {
    invoke,
    adapter: new NativeDesktopVaultAdapter(
      "/vault",
      undefined,
      "tauri-desktop",
    ),
  };
}

it("passes the exact conditional text snapshot and metadata through the public native adapter", async () => {
  const { invoke, adapter } = fixture();
  await adapter.writeTextIfUnchanged("笔记/café.md", "next", "baseline", {
    mtime: 123,
  });
  expect(invoke).toHaveBeenCalledExactlyOnceWith(
    "desktop_fs_write_text_if_unchanged",
    {
      rootPath: "/vault",
      normalizedPath: "笔记/café.md",
      data: "next",
      expected: "baseline",
      options: { mtime: 123 },
    },
  );
  expect(adapter.getCapabilities().conditionalTextWrite).toBe(true);
});

it("represents expected absence explicitly rather than as an unconditional write", async () => {
  const { invoke, adapter } = fixture();
  await adapter.writeTextIfUnchanged("new.md", "new", null);
  expect(invoke.mock.calls[0]?.[1]).toMatchObject({
    expected: null,
    data: "new",
  });
});

it("fails closed when a native host does not support conditional text writes", async () => {
  const { invoke, adapter } = fixture(false);
  await expect(
    adapter.writeTextIfUnchanged("note.md", "next", "old"),
  ).rejects.toThrow("unavailable");
  expect(invoke).not.toHaveBeenCalled();
  expect(adapter.getCapabilities().conditionalTextWrite).toBe(false);
});

it("preserves a portable conflict failure without retrying or falling back", async () => {
  const { invoke, adapter } = fixture();
  const failure = Object.assign(new Error("File changed on disk"), {
    code: "ECONFLICT",
  });
  invoke.mockRejectedValue(failure);
  await expect(
    adapter.writeTextIfUnchanged("note.md", "next", "old"),
  ).rejects.toBe(failure);
  expect(invoke).toHaveBeenCalledTimes(1);
});

it("keeps legacy native hosts without a capability advertisement unsupported", async () => {
  const invoke = vi.fn(async <T>() => undefined as T);
  setNativeDesktopBridge({ runtime: "deno-desktop", invoke });
  const adapter = new NativeDesktopVaultAdapter("/vault");
  await expect(
    adapter.writeTextIfUnchanged("note.md", "new", "old"),
  ).rejects.toThrow("unavailable");
  expect(invoke).not.toHaveBeenCalled();
  expect(adapter.getCapabilities().conditionalTextWrite).toBe(false);
});

it("rejects an invalid expected snapshot before sending a native request", async () => {
  const { invoke, adapter } = fixture();
  await expect(
    adapter.writeTextIfUnchanged("note.md", "next", undefined as never),
  ).rejects.toThrow("expected");
  expect(invoke).not.toHaveBeenCalled();
});
