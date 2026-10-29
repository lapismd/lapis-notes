import { describe, expect, it, vi } from "vitest";
import { FileManager } from "../file-manager";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { TFile, TFolder } from "../storage/fs";

function fixture(path = "Notes/Note.md") {
  const sessions = new FileEditingSessionRegistry();
  const trash = vi.fn(async () => {});
  const manager = new FileManager({
    fileEditingSessions: sessions,
    vault: { trash },
  } as any);
  const file = new TFile(path, { ctime: 1, mtime: 1, size: 1 }, null);
  return { sessions, trash, manager, file };
}
describe("protected managed trash", () => {
  it("protects and flushes file writers before removal and releases after IO", async () => {
    const { sessions, trash, manager, file } = fixture();
    const order: string[] = [];
    sessions.register(file.path, {
      dirty: false,
      protect: async () => {
        order.push("protect");
        return () => {
          order.push("release");
        };
      },
      flush: async () => {
        order.push("flush");
      },
    });
    trash.mockImplementation(async () => {
      order.push("trash");
    });
    await manager.trashFile(file);
    expect(order).toEqual(["protect", "flush", "trash", "release"]);
    expect(trash).toHaveBeenCalledWith(file, true);
  });
  it("blocks folder removal for failed descendant writers and preserves retry", async () => {
    const { sessions, trash, manager } = fixture();
    let fail = true;
    const release = vi.fn();
    sessions.register("Notes/Nested/Note.md", {
      get dirty() {
        return fail;
      },
      protect: async () => release,
      flush: async () => {
        if (fail) throw new Error("save failed");
      },
    });
    const folder = new TFolder("Notes");
    await expect(manager.trashFile(folder)).rejects.toThrow("save failed");
    expect(trash).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
    fail = false;
    await manager.trashFile(folder);
    expect(trash).toHaveBeenCalledTimes(1);
  });
  it("rejects a changed target before IO after asynchronous admission", async () => {
    const { sessions, trash, manager, file } = fixture();
    sessions.register(file.path, {
      dirty: false,
      protect: async () => {
        file.path = "Other.md";
        return () => {};
      },
      flush: async () => {},
    });
    await expect(manager.trashFile(file)).rejects.toThrow("target changed");
    expect(trash).not.toHaveBeenCalled();
  });
  it("releases protection after failed native removal and permits retry", async () => {
    const { sessions, trash, manager, file } = fixture();
    const release = vi.fn();
    sessions.register(file.path, {
      dirty: false,
      protect: async () => release,
      flush: async () => {},
    });
    trash.mockRejectedValueOnce(new Error("native removal failed"));
    await expect(manager.promptForDeletion(file)).rejects.toThrow(
      "native removal failed",
    );
    expect(release).toHaveBeenCalledTimes(1);
    await manager.promptForDeletion(file);
    expect(release).toHaveBeenCalledTimes(2);
  });
});
