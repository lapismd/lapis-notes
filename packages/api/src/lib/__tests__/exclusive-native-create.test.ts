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
      "exclusive-create": {
        id: "exclusive-create",
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
it("encodes Unicode text and binary bytes through the exclusive native port", async () => {
  const { adapter, invoke } = fixture();
  await adapter.writeExclusive("笔记/café.md", "# 笔记\n", { mtime: 123 });
  expect(invoke.mock.calls[0]).toEqual([
    "desktop_fs_create_exclusive",
    {
      rootPath: "/vault",
      normalizedPath: "笔记/café.md",
      data: [...new TextEncoder().encode("# 笔记\n")],
      options: { mtime: 123 },
    },
  ]);
  const bytes = Uint8Array.from([0, 255, 128]);
  await adapter.writeExclusive("附件.bin", bytes.buffer);
  expect(invoke.mock.calls[1]?.[1]).toMatchObject({ data: [0, 255, 128] });
  expect(adapter.getCapabilities().exclusiveCreate).toBe(true);
});
it("rejects unsupported exclusive creation before IO without fallback", async () => {
  const { adapter, invoke } = fixture(false);
  await expect(adapter.writeExclusive("new.md", "new")).rejects.toMatchObject({
    code: "ENOTSUP",
  });
  expect(invoke).not.toHaveBeenCalled();
});
it("preserves collision errors without retrying as an overwrite", async () => {
  const { adapter, invoke } = fixture();
  invoke.mockRejectedValueOnce(
    Object.assign(new Error("destination exists"), { code: "EEXIST" }),
  );
  await expect(adapter.writeExclusive("new.md", "new")).rejects.toMatchObject({
    code: "EEXIST",
  });
  expect(invoke).toHaveBeenCalledTimes(1);
});
