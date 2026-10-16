import { expect, it, vi } from "vitest";
import { FileManager } from "../file-manager";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";
import type { TFile } from "../storage/fs";

const original = "---\ntitle: Original\n---\nBody\n";
const updated = "---\ntitle: Updated\n---\nBody\n";
function changed() {
  return Object.assign(new Error("changed"), { code: "ECONFLICT" });
}
async function fixture() {
  const adapter = new MemoryVaultAdapter({ "note.md": original });
  const write = vi.fn(
    async (path: string, data: string, expected: string | null) => {
      if ((await adapter.read(path)) !== expected) throw changed();
      await adapter.write(path, data);
    },
  );
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: true }),
    writeTextIfUnchanged: write,
  });
  const vault = new Vault(adapter);
  await vault.load();
  const registry = new FileEditingSessionRegistry();
  const app = {
    vault,
    fileEditingSessions: registry,
    metadataCache: {
      getFileCacheAsync: vi.fn(async () => ({
        frontmatter: { title: "Stale" },
      })),
      read: async (text: string) => ({
        frontmatter: { title: /title: (.*)/.exec(text)?.[1] },
      }),
      writeFrontmatter: (_file: TFile, data: Record<string, string>) =>
        `title: ${data.title}`,
    },
  };
  const manager = new FileManager(app as any);
  const file = vault.getFileByPath("note.md")!;
  return { adapter, write, registry, manager, file, app };
}

it("drains and protects document writers before changing frontmatter", async () => {
  const { adapter, registry, manager, file } = await fixture();
  const writer = {
    dirty: true,
    protect: vi.fn(async () => () => {}),
    flush: vi.fn(async () => {
      await adapter.write(file.path, original.replace("Body", "Unsaved body"));
      writer.dirty = false;
    }),
  };
  registry.register(file.path, writer);
  await manager.processFrontMatter(file, (data) => {
    data.title = "Updated";
  });
  expect(writer.protect).toHaveBeenCalledOnce();
  expect(writer.flush).toHaveBeenCalledOnce();
  expect(await adapter.read(file.path)).toContain("Unsaved body");
});

it("uses authoritative frontmatter rather than stale indexed metadata", async () => {
  const { adapter, manager, file, write } = await fixture();
  let seen: unknown;
  await manager.processFrontMatter(file, (data) => {
    seen = data.title;
    data.title = "Updated";
  });
  expect(seen).toBe("Original");
  expect(write).toHaveBeenCalledOnce();
  expect(await adapter.read(file.path)).toBe(updated);
});

it("retains a failed frontmatter draft and blocks shutdown until explicit recovery", async () => {
  const { adapter, manager, file, write, registry } = await fixture();
  write.mockImplementationOnce(async () => {
    await adapter.write(file.path, "external text");
    throw changed();
  });
  await expect(
    manager.processFrontMatter(file, (data) => {
      data.title = "Updated";
    }),
  ).rejects.toMatchObject({ code: "ECONFLICT" });
  expect(await adapter.read(file.path)).toBe("external text");
  expect(registry.textConflicts.entries).toHaveLength(1);
  await expect(registry.guard(undefined, async () => {})).rejects.toMatchObject(
    { code: "ECONFLICT" },
  );
  expect(registry.textConflicts.entries[0]).toMatchObject({
    local: updated,
    baseline: original,
    external: "external text",
  });
  await registry.textConflicts.entries[0].resolve("keep-local");
  expect(await adapter.read(file.path)).toBe(updated);
  await registry.guard(undefined, async () => {});
});

it("serializes queued mutations and joins them before lifecycle shutdown", async () => {
  const { adapter, manager, file, registry } = await fixture();
  const first = manager.processFrontMatter(file, (data) => {
    data.title = "First";
  });
  const second = manager.processFrontMatter(file, (data) => {
    data.title += " Second";
  });
  const close = registry.guard(undefined, async () => adapter.read(file.path));
  await Promise.all([first, second]);
  expect(await close).toBe("---\ntitle: First Second\n---\nBody\n");
});

it("rejects a Properties record based on stale displayed frontmatter without writing", async () => {
  const { adapter, manager, file, registry, write } = await fixture();
  await adapter.write(file.path, original.replace("Original", "External"));
  await expect(
    manager.processFrontMatter(
      file,
      (data) => {
        data.title = "Updated";
      },
      {
        expectedFrontmatter: { title: "Original" },
      },
    ),
  ).rejects.toMatchObject({ code: "ECONFLICT" });
  expect(write).not.toHaveBeenCalled();
  expect(registry.textConflicts.entries[0].local).toBe(updated);
  await registry.textConflicts.entries[0].resolve("use-external");
  await registry.guard(undefined, async () => {});
});

it("accepts unrelated body changes when the displayed Properties record is still current", async () => {
  const { adapter, manager, file } = await fixture();
  await adapter.write(file.path, original.replace("Body", "New body"));
  await manager.processFrontMatter(
    file,
    (data) => {
      data.title = "Updated";
    },
    {
      expectedFrontmatter: { title: "Original" },
    },
  );
  expect(await adapter.read(file.path)).toBe(
    updated.replace("Body", "New body"),
  );
});

it("rejects a target changed while its mutation is queued", async () => {
  const { adapter, manager, file, write, registry } = await fixture();
  await adapter.write("other.md", original);
  const pending = manager.processFrontMatter(file, (data) => {
    data.title = "Wrong target";
  });
  Object.assign(file, { path: "other.md" });
  await expect(pending).rejects.toThrow("target changed");
  expect(write).not.toHaveBeenCalled();
  expect(await adapter.read("other.md")).toBe(original);
  await registry.guard(undefined, async () => {});
});

it("retains failed IO drafts for explicit recovery instead of admitting newer untracked property edits", async () => {
  const { manager, file, write, registry, adapter } = await fixture();
  write.mockRejectedValueOnce(
    Object.assign(new Error("Read-only folder"), { code: "EACCES" }),
  );
  await expect(
    manager.processFrontMatter(file, (data) => {
      data.title = "Updated";
    }),
  ).rejects.toMatchObject({ code: "EACCES" });
  expect(registry.textConflicts.entries[0]).toMatchObject({
    local: updated,
    external: original,
  });
  await expect(registry.guard(undefined, async () => {})).rejects.toMatchObject(
    { code: "ECONFLICT" },
  );
  await registry.textConflicts.entries[0].resolve("keep-local");
  expect(await adapter.read(file.path)).toBe(updated);
  await registry.guard(undefined, async () => {});
});
