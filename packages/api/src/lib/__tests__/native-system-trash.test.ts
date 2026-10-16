import { afterEach, expect, it, vi } from "vitest";
import {
  NativeDesktopVaultAdapter,
  setNativeDesktopBridge,
  Vault,
  type DataAdapter,
} from "../storage";
import { InMemoryDataAdapter } from "./data-adapter-conformance";
afterEach(() => setNativeDesktopBridge(null));
function fixture(available = true) {
  const invoke = vi.fn(
    async (_command: string, _payload?: Record<string, unknown>) => true,
  );
  setNativeDesktopBridge({
    runtime: "tauri-desktop",
    capabilities: {
      "system-trash": {
        id: "system-trash",
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
it("advertises and invokes the implemented native system-trash port", async () => {
  const { adapter, invoke } = fixture();
  expect(adapter.getCapabilities().systemTrash).toBe(true);
  expect(await adapter.trashSystem("笔记/café.md")).toBe(true);
  expect(invoke).toHaveBeenCalledWith("desktop_fs_trash_system", {
    rootPath: "/vault",
    normalizedPath: "笔记/café.md",
  });
});
it("returns explicit unavailability without IO when no provider is advertised", async () => {
  const { adapter, invoke } = fixture(false);
  expect(adapter.getCapabilities().systemTrash).toBe(false);
  expect(await adapter.trashSystem("note.md")).toBe(false);
  expect(invoke).not.toHaveBeenCalled();
});
it("permits local fallback only for explicit unsupported system trash", async () => {
  const { adapter, invoke } = fixture();
  invoke.mockRejectedValueOnce(
    Object.assign(new Error("unsupported volume"), { code: "ENOTSUP" }),
  );
  expect(await adapter.trashSystem("note.md")).toBe(false);
  invoke.mockRejectedValueOnce(
    Object.assign(new Error("denied"), { code: "EACCES" }),
  );
  await expect(adapter.trashSystem("note.md")).rejects.toMatchObject({
    code: "EACCES",
  });
  expect(invoke).toHaveBeenCalledTimes(2);
});
it("rejects root trash before invoking the native provider", async () => {
  const { adapter, invoke } = fixture();
  await expect(adapter.trashSystem("/")).rejects.toMatchObject({
    code: "EINVAL",
  });
  expect(invoke).not.toHaveBeenCalled();
});
it("projects handled system trash without attempting to remove the file a second time", async () => {
  const adapter: DataAdapter = new InMemoryDataAdapter();
  await adapter.write("note.md", "before");
  await adapter.write("keep.md", "keep");
  const vault = new Vault(adapter);
  await vault.load();
  const keep = vault.getFiles().find((file) => file.path === "keep.md");
  const remove = vi.spyOn(adapter, "remove");
  vi.spyOn(adapter, "trashSystem").mockImplementation(async (path) => {
    await adapter.remove(path);
    return true;
  });
  const deleted = vi.fn();
  vault.on("delete", deleted);
  await vault.trash(vault.getFileByPath("note.md")!, true);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(vault.getFileByPath("note.md")).toBeNull();
  expect(vault.getFiles()).toEqual([keep]);
  expect(deleted).toHaveBeenCalledTimes(1);
});

it("rejects an invalid native acknowledgement instead of projecting success", async () => {
  const { adapter, invoke } = fixture();
  invoke.mockResolvedValueOnce({ handled: true } as unknown as boolean);
  await expect(adapter.trashSystem("note.md")).rejects.toMatchObject({
    code: "EINVAL",
  });
});
