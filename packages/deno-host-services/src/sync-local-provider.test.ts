import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { SyncHostSecurityService } from "../../api/src/lib/sync-host-security";
import { NativeSyncLocalProvider } from "./sync-local-provider";
import { NativeSyncVault } from "./sync-vault";
import { NativeSyncRepository } from "./sync-repository";

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});
const source = (text: string) => new Blob([text]).stream();

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "lapis-local-provider-"));
  cleanups.push(() => rm(directory, { force: true, recursive: true }));
  const rootPath = join(directory, "vault"),
    storagePath = join(directory, "state");
  await mkdir(rootPath);
  await writeFile(join(rootPath, "note.md"), "private working note");
  const database = new MemoryAppDatabase("local-provider-keys");
  await database.open();
  cleanups.push(() => database.close());
  const security = new SyncHostSecurityService(database, () => undefined, {
    argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 },
  });
  await security.enroll("sync", "fixture passphrase for native local");
  const crypto = security.crypto("sync", "fixture");
  let admitted = true;
  const options = {
    rootPath,
    storagePath,
    crypto,
    includePath: (path: string) => !path.startsWith(".obsidian/"),
    assertActive() {
      if (!admitted) throw new Error("profile revoked");
    },
  };
  const providers: NativeSyncLocalProvider[] = [];
  const create = () => {
    const provider = new NativeSyncLocalProvider(options);
    providers.push(provider);
    return provider;
  };
  cleanups.push(async () => {
    for (const provider of providers) await provider.close();
    security.lock("sync");
  });
  const provider = create(),
    local = provider.forRuntime("runtime-1");
  return {
    directory,
    rootPath,
    storagePath,
    provider,
    local,
    crypto,
    security,
    create,
    revokeAdmission() {
      admitted = false;
    },
  };
}

it("uses real guarded files and independent sealed engine storage across reopen", async () => {
  const { rootPath, provider, local, crypto, create, storagePath } =
    await fixture();
  const [file] = await local.list();
  expect(await new Response(await file!.openRead()).text()).toBe(
    "private working note",
  );
  const sealed = await crypto.encryptObject({
    epoch: 1,
    type: "local-state",
    plaintext: new TextEncoder().encode("private snapshot metadata"),
  });
  expect(
    await local.repository.compareAndSwap(0, {
      version: 1,
      epoch: 1,
      ciphertext: sealed.bytes,
    }),
  ).toBe(true);
  await local.apply.mutate(
    {
      id: "write-1",
      kind: "write",
      path: "note.md",
      expected: file!,
      fileId: file!.fileId,
    },
    source("remote working note"),
  );
  await provider.revokeRuntime("runtime-1");
  const next = create().forRuntime("runtime-2");
  expect(await next.repository.readState()).toEqual({
    version: 1,
    epoch: 1,
    ciphertext: sealed.bytes,
  });
  expect(await next.apply.receipt("write-1")).toMatchObject({
    operation: { id: "write-1" },
  });
  expect(await readFile(join(rootPath, "note.md"), "utf8")).toBe(
    "remote working note",
  );
  const bytes = await readFile(join(storagePath, "engine.sqlite"));
  expect(bytes.includes(Buffer.from("private snapshot metadata"))).toBe(false);
  expect(bytes.includes(Buffer.from("note.md"))).toBe(false);
});

it("rejects competing runtimes and preserves old handles after closing only as revoked", async () => {
  const { provider, local } = await fixture();
  const [file] = await local.list();
  expect(() => provider.forRuntime("runtime-2")).toThrow(/another|owns/i);
  await provider.revokeRuntime("runtime-1");
  await expect(local.repository.readState()).rejects.toThrow(/revoked|closed/i);
  await expect(file!.openRead()).rejects.toThrow(/revoked|closed/i);
  expect(await provider.forRuntime("runtime-2").list()).toHaveLength(1);
});

it("rejects locked, unenrolled or no-longer-admitted endpoints without creating history", async () => {
  const { provider, local, security, revokeAdmission } = await fixture();
  security.lock("sync");
  await expect(local.list()).rejects.toThrow(/unlocked|active/i);
  await security.unlock("sync", "fixture passphrase for native local");
  expect(await local.list()).toHaveLength(1);
  revokeAdmission();
  await expect(local.repository.readState()).rejects.toThrow(
    /profile revoked/i,
  );
  await provider.close();
  expect(() => provider.forRuntime("runtime-2")).toThrow(/closed/i);
});

it("retains ciphertext hashes and state compare-and-swap through the host adapter", async () => {
  const { local } = await fixture();
  const ciphertext = new Uint8Array([9, 8, 7]);
  const stored = await local.repository.blobs.put(ciphertext);
  expect(await local.repository.blobs.has(stored.hash)).toBe(true);
  expect(await local.repository.blobs.get(stored.hash)).toEqual(ciphertext);
  const state = { version: 1, epoch: 1, ciphertext };
  expect(
    await Promise.all([
      local.repository.compareAndSwap(0, state),
      local.repository.compareAndSwap(0, state),
    ]),
  ).toEqual([true, false]);
});

it("aborts retained reads when the admitted profile disappears", async () => {
  const { local, revokeAdmission, provider } = await fixture();
  const [file] = await local.list();
  const reader = (await file!.openRead()).getReader();
  revokeAdmission();
  await expect(reader.read()).rejects.toThrow(/profile revoked/i);
  await provider.close();
});

it("uses the host inclusion policy for capture and guarded mutations", async () => {
  const { rootPath, local } = await fixture();
  await mkdir(join(rootPath, ".obsidian"));
  await writeFile(
    join(rootPath, ".obsidian", "credentials.json"),
    "private host credentials",
  );
  expect((await local.list()).map((file) => file.path)).toEqual(["note.md"]);
  await expect(
    local.apply.mutate(
      {
        id: "excluded",
        kind: "write",
        path: ".obsidian/credentials.json",
        expected: null,
        fileId: "excluded",
      },
      source("replacement"),
    ),
  ).rejects.toThrow(/excluded/i);
  expect(
    await readFile(join(rootPath, ".obsidian", "credentials.json"), "utf8"),
  ).toBe("private host credentials");
});

it("cancels unused write streams before acknowledging a stale-file rejection", async () => {
  const { local } = await fixture();
  const cancel = vi.fn();
  await expect(
    local.apply.mutate(
      {
        id: "stale",
        kind: "write",
        path: "note.md",
        expected: null,
        fileId: "replacement",
      },
      new ReadableStream<Uint8Array>({ cancel }),
    ),
  ).rejects.toThrow(/changed|preserve/i);
  expect(cancel).toHaveBeenCalledOnce();
});

it("retains failed initialization resources until explicit drained revocation", async () => {
  const { local, provider } = await fixture();
  const originalOpen = NativeSyncRepository.open;
  const open = vi
    .spyOn(NativeSyncRepository, "open")
    .mockImplementation(async (path, namespace) => {
      if (path.endsWith("engine.sqlite"))
        throw new Error("injected engine open failure");
      return originalOpen(path, namespace);
    });
  const originalClose = NativeSyncVault.prototype.close;
  vi.spyOn(NativeSyncVault.prototype, "close").mockImplementationOnce(
    async function (this: NativeSyncVault) {
      await originalClose.call(this);
      throw new Error("injected close response loss");
    },
  );
  await expect(local.list()).rejects.toThrow(/initialization cleanup failed/);
  open.mockRestore();
  await expect(local.list()).rejects.toThrow(/initialization cleanup failed/);
  expect(() => provider.forRuntime("replacement")).toThrow(/another|owns/i);
  await provider.revokeRuntime("runtime-1");
  expect(await provider.forRuntime("replacement").list()).toHaveLength(1);
});
