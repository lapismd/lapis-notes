import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ManagedVaultStore } from "./managed-vaults.ts";
import { VaultEventHub } from "./events.ts";

describe("managed vaults on native Node filesystems", () => {
  let root: string;
  let vaultId: string;
  let store: ManagedVaultStore;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "lapis-node-files-"));
    vaultId = crypto.randomUUID();
    store = new ManagedVaultStore(root, new VaultEventHub());
    await store.initialize();
    await store.create(vaultId);
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("preserves bytes, atomic conditional saves and serialized append", async () => {
    const bytes = new Uint8Array([0, 128, 255, 10]);
    const etag = await store.replace(vaultId, "binary.dat", bytes, {
      ifNoneMatch: "*",
    });
    expect((await store.read(vaultId, "binary.dat")).bytes).toEqual(bytes);
    const writes = await Promise.allSettled([
      store.replace(vaultId, "binary.dat", new Uint8Array([1]), {
        ifMatch: etag,
      }),
      store.replace(vaultId, "binary.dat", new Uint8Array([2]), {
        ifMatch: etag,
      }),
    ]);
    expect(
      writes.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(writes.find((result) => result.status === "rejected")).toMatchObject(
      { reason: { code: "PRECONDITION_FAILED" } },
    );
    await Promise.all([
      store.append(vaultId, "note.md", new TextEncoder().encode("one")),
      store.append(vaultId, "note.md", new TextEncoder().encode("two")),
    ]);
    expect(
      new TextDecoder().decode((await store.read(vaultId, "note.md")).bytes),
    ).toBe("onetwo");
  });

  it("keeps idempotent mkdir, rename, copy, trash and empty-directory removal", async () => {
    await store.mkdir(vaultId, "notes");
    await store.mkdir(vaultId, "notes");
    await store.replace(
      vaultId,
      "notes/original.md",
      new TextEncoder().encode("note"),
    );
    await store.copy(vaultId, "notes/original.md", "copy.md");
    await store.rename(vaultId, "copy.md", "renamed.md");
    const trashed = await store.trash(vaultId, "renamed.md");
    expect((await store.read(vaultId, trashed)).bytes).toEqual(
      new TextEncoder().encode("note"),
    );
    await expect(store.remove(vaultId, "notes")).rejects.toMatchObject({
      code: "ENOTEMPTY",
    });
    await store.remove(vaultId, "notes/original.md");
    await store.remove(vaultId, "notes");
    expect(await store.stat(vaultId, "notes")).toBeNull();
    expect((await store.list(vaultId, "")).folders).toContain(".trash");
  });

  it("rejects traversal and symlink escape without touching outside content", async () => {
    const outside = join(root, "outside");
    await mkdir(outside);
    await writeFile(join(outside, "secret.md"), "private");
    await symlink(outside, join(root, "vaults", vaultId, "content", "escape"));
    await expect(store.read(vaultId, "escape/secret.md")).rejects.toMatchObject(
      { code: "INVALID_PATH" },
    );
    await expect(
      store.replace(vaultId, "escape/new.md", new Uint8Array([1])),
    ).rejects.toMatchObject({ code: "INVALID_PATH" });
    await expect(
      store.replace(vaultId, "../outside/secret.md", new Uint8Array([1])),
    ).rejects.toMatchObject({ code: "INVALID_PATH" });
    expect(await readFile(join(outside, "secret.md"), "utf8")).toBe("private");
  });
});
