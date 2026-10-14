import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
  rename,
  readdir,
  symlink,
  stat,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { SyncHostSecurityService } from "../../api/src/lib/sync-host-security";
import { NativeSyncVault } from "./sync-vault";
import type { SyncFileMutation } from "@lapis-notes/api/sync-repository";
import type { PendingMutation, VaultJournal } from "./sync-vault-state";
import { NativeSyncRepository } from "./sync-repository";
import { hash } from "./sync-vault-files";

const physicalFault = vi.hoisted(() => ({
  beforeRename: undefined as
    ((source: unknown, target: unknown) => Promise<void>) | undefined,
  beforeLink: undefined as
    ((source: unknown, target: unknown) => Promise<void>) | undefined,
}));
vi.mock("node:fs/promises", async (original) => {
  const fs = await original<typeof import("node:fs/promises")>();
  return {
    ...fs,
    async rename(...args: Parameters<typeof fs.rename>) {
      const before = physicalFault.beforeRename;
      physicalFault.beforeRename = undefined;
      await before?.(...args);
      return fs.rename(...args);
    },
    async link(...args: Parameters<typeof fs.link>) {
      const before = physicalFault.beforeLink;
      physicalFault.beforeLink = undefined;
      await before?.(...args);
      return fs.link(...args);
    },
  };
});

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  physicalFault.beforeLink = undefined;
  physicalFault.beforeRename = undefined;
  vi.restoreAllMocks();
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "lapis-guarded-vault-"));
  cleanups.push(() => rm(directory, { recursive: true, force: true }));
  const rootPath = join(directory, "vault");
  await mkdir(rootPath);
  const database = new MemoryAppDatabase("guarded-native-test");
  await database.open();
  cleanups.push(() => database.close());
  const security = new SyncHostSecurityService(database, () => undefined, {
    argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 },
  });
  cleanups.push(async () => {
    security.lock("sync");
  });
  await security.enroll("sync", "guarded fixture passphrase");
  const baseCrypto = security.crypto("sync", "test"),
    status = await baseCrypto.status();
  const fault: {
    phase: string | null;
    receipt?: boolean;
    maxRootBytes?: number;
    beforeSeal?: (mutation: PendingMutation) => Promise<void>;
  } = { phase: null };
  const crypto = {
    ...baseCrypto,
    async encryptObject(input: Parameters<typeof baseCrypto.encryptObject>[0]) {
      const payload = JSON.parse(new TextDecoder().decode(input.plaintext));
      if (payload.domain === "lapis-native-receipt-v1" && fault.receipt) {
        fault.receipt = false;
        throw new Error("Injected receipt persistence failure");
      }
      if (
        ["lapis-native-apply-v1", "lapis-native-apply-v2"].includes(
          payload.domain,
        ) &&
        fault.maxRootBytes &&
        input.plaintext.byteLength > fault.maxRootBytes
      )
        throw new Error("Active journal exceeded bounded record budget");
      if (
        ["lapis-native-apply-v1", "lapis-native-apply-v2"].includes(
          payload.domain,
        )
      )
        for (const mutation of Object.values(
          payload.state.mutations,
        ) as PendingMutation[]) {
          await fault.beforeSeal?.(mutation);
          if (fault.phase === mutation.phase) {
            fault.phase = null;
            throw new Error("Injected journal persistence failure");
          }
        }
      return baseCrypto.encryptObject(input);
    },
  };
  const options = {
    rootPath,
    statePath: join(directory, "apply.sqlite"),
    vaultId: status.vaultId!,
    devicePublicKey: status.devicePublicKey!,
    crypto,
  };
  const vault = await NativeSyncVault.open(options);
  cleanups.push(() => vault.close());
  return { directory, rootPath, options, vault, security, fault };
}
const source = (text: string) => new Blob([text]).stream();

type Fixture = Awaited<ReturnType<typeof fixture>>;
interface JournalPayload {
  domain: string;
  version: number;
  epoch: number;
  state: Omit<VaultJournal, "schemaVersion"> & { schemaVersion: number };
}
async function readJournal(f: Fixture) {
  const repository = await NativeSyncRepository.open(
    f.options.statePath,
    hash(`native-apply:${f.options.vaultId}:${f.options.devicePublicKey}`),
  );
  try {
    const record = (await repository.readState())!;
    const bytes = await f.security
      .crypto("sync", "journal-fixture")
      .decryptObject({
        epoch: record.epoch,
        type: "local-state",
        envelope: record.ciphertext,
      });
    try {
      return {
        record,
        payload: JSON.parse(new TextDecoder().decode(bytes)) as JournalPayload,
      };
    } finally {
      bytes.fill(0);
    }
  } finally {
    await repository.close();
  }
}
async function rewriteJournal(
  f: Fixture,
  edit: (payload: JournalPayload) => void,
) {
  const { record, payload } = await readJournal(f);
  edit(payload);
  payload.version = record.version + 1;
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let sealed;
  try {
    sealed = await f.security.crypto("sync", "journal-fixture").encryptObject({
      epoch: record.epoch,
      type: "local-state",
      plaintext: bytes,
    });
  } finally {
    bytes.fill(0);
  }
  const repository = await NativeSyncRepository.open(
    f.options.statePath,
    hash(`native-apply:${f.options.vaultId}:${f.options.devicePublicKey}`),
  );
  try {
    expect(
      await repository.compareAndSwap(record.version, {
        version: payload.version,
        epoch: record.epoch,
        ciphertext: sealed.bytes,
      }),
    ).toBe(true);
  } finally {
    await repository.close();
  }
}
const asLegacy = (payload: JournalPayload) => {
  payload.domain = "lapis-native-apply-v1";
  payload.state.schemaVersion = 1;
};
async function trackVault(options: Parameters<typeof NativeSyncVault.open>[0]) {
  const vault = await NativeSyncVault.open(options);
  cleanups.push(() => vault.close());
  return vault;
}

describe("native indexed journal migration", () => {
  it.each(["prepared", "claimed", "installed", "completed"] as const)(
    "upgrades legacy %s intent before access without changing working bytes",
    async (phase) => {
      const f = await fixture();
      const path = join(f.rootPath, "note.md");
      await writeFile(path, "legacy working preimage");
      const file = (await f.vault.list())[0];
      const operation: SyncFileMutation = {
        id: `legacy-${phase}`,
        kind: "write",
        path: file.path,
        fileId: file.fileId,
        expected: {
          fileId: file.fileId,
          hostFileId: file.hostFileId,
          contentGeneration: file.contentGeneration,
        },
      };
      if (phase === "completed") f.fault.receipt = true;
      else
        f.fault.phase = {
          prepared: "claimed",
          claimed: "installed",
          installed: "completed",
        }[phase];
      await expect(
        f.vault.mutate(operation, source("legacy incoming content")),
      ).rejects.toThrow("Injected");
      if (phase === "completed")
        await writeFile(path, "edit after completed legacy mutation");
      const working = () =>
        readFile(path, "utf8").catch((error) => {
          if (error.code === "ENOENT") return null;
          throw error;
        });
      const beforeBytes = await working();
      await f.vault.close();
      await rewriteJournal(f, asLegacy);
      const before = await readJournal(f);
      const vault = await trackVault(f.options);
      expect(await working()).toBe(beforeBytes);
      const upgraded = await readJournal(f);
      expect(upgraded.payload.domain).toBe("lapis-native-apply-v2");
      expect(upgraded.payload.state.schemaVersion).toBe(2);
      expect(upgraded.payload.state.counter).toBe(before.payload.state.counter);
      expect(upgraded.payload.state.paths).toEqual(before.payload.state.paths);
      if (phase !== "completed")
        expect(upgraded.payload.state.mutations).toEqual(
          before.payload.state.mutations,
        );
      const receipt = await vault.receipt(operation.id);
      expect(receipt?.operation.id).toBe(operation.id);
      expect(
        await vault.mutate(operation, source("retry must not overwrite")),
      ).toEqual(receipt);
      expect(await working()).toBe(
        phase === "completed"
          ? "edit after completed legacy mutation"
          : "legacy incoming content",
      );
    },
  );

  it.each([
    { domain: "lapis-native-apply-v3", schema: 3 },
    { domain: "lapis-native-apply-v1", schema: 2 },
    { domain: "lapis-native-apply-v2", schema: 1 },
  ])(
    "rejects incompatible journal format $domain / $schema without rewriting encrypted state",
    async ({ domain, schema }) => {
      const f = await fixture();
      await f.vault.close();
      await rewriteJournal(f, (payload) => {
        payload.domain = domain;
        payload.state.schemaVersion = schema;
      });
      const before = await readJournal(f);
      await expect(trackVault(f.options)).rejects.toThrow(/journal/i);
      expect((await readJournal(f)).record).toEqual(before.record);
    },
  );

  it.each(["before", "after"])(
    "recovers an uncertain upgrade %s its durable commit",
    async (when) => {
      const f = await fixture();
      await writeFile(join(f.rootPath, "note.md"), "unchanged during upgrade");
      await f.vault.list();
      await f.vault.close();
      await rewriteJournal(f, asLegacy);
      const before = await readJournal(f);
      const repository = await NativeSyncRepository.open(
        f.options.statePath,
        hash(`native-apply:${f.options.vaultId}:${f.options.devicePublicKey}`),
      );
      let attempts = 0;
      const wrapped = {
        records: repository.records,
        blobs: repository.blobs,
        readState: () => repository.readState(),
        close: () => repository.close(),
        async compareAndSwap(
          ...args: Parameters<typeof repository.compareAndSwap>
        ) {
          attempts++;
          if (when === "before") throw new Error("Uncertain format upgrade");
          await repository.compareAndSwap(...args);
          throw new Error("Uncertain format upgrade");
        },
      };
      await expect(
        trackVault({ ...f.options, repository: wrapped }),
      ).rejects.toThrow("Uncertain format upgrade");
      expect(attempts).toBe(1);
      if (when === "before")
        expect((await readJournal(f)).record).toEqual(before.record);
      const vault = await trackVault(f.options);
      const after = await readJournal(f);
      expect(after.payload.domain).toBe("lapis-native-apply-v2");
      expect(after.payload.state.schemaVersion).toBe(2);
      expect(after.record.version).toBe(before.record.version + 1);
      expect((await vault.list())[0].fileId).toBe(
        Object.values(before.payload.state.paths)[0].fileId,
      );
      expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
        "unchanged during upgrade",
      );
    },
  );

  it("fences membership changes while sealing a legacy upgrade", async () => {
    const f = await fixture();
    await f.vault.close();
    await rewriteJournal(f, asLegacy);
    const before = await readJournal(f);
    let raced = false;
    const crypto = {
      ...f.options.crypto,
      async encryptObject(
        input: Parameters<typeof f.options.crypto.encryptObject>[0],
      ) {
        const payload = JSON.parse(new TextDecoder().decode(input.plaintext));
        if (!raced && payload.domain === "lapis-native-apply-v2") {
          raced = true;
          await f.security.membership("sync", "test").renameDevice({
            publicKey: f.options.devicePublicKey,
            alias: "Changed during upgrade",
          });
        }
        return f.options.crypto.encryptObject(input);
      },
    };
    await expect(trackVault({ ...f.options, crypto })).rejects.toThrow(
      "authority changed",
    );
    expect(raced).toBe(true);
    expect((await readJournal(f)).record).toEqual(before.record);
    await trackVault(f.options);
    expect((await readJournal(f)).payload.state.schemaVersion).toBe(2);
  });
});

describe("native guarded sync vault", () => {
  it("retains completed preimages until a retention policy is provided", async () => {
    const f = await fixture();
    await writeFile(join(f.rootPath, "note.md"), "retained working preimage");
    const file = (await f.vault.list())[0];
    await f.vault.mutate(
      {
        id: "retain-preimage",
        kind: "write",
        path: file.path,
        expected: file,
        fileId: file.fileId,
      },
      source("installed content"),
    );
    const staging = join(f.rootPath, ".lapis/sync-apply");
    const backups = (await readdir(staging)).filter((name) =>
      name.endsWith(".before"),
    );
    expect(backups).toHaveLength(1);
    expect(await readFile(join(staging, backups[0]), "utf8")).toBe(
      "retained working preimage",
    );
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "installed content",
    );
  });
  it("rejects an authority change while reading an indexed receipt", async () => {
    const f = await fixture();
    const receipt = await f.vault.mutate(
      {
        id: "receipt-race",
        kind: "write",
        path: "note.md",
        expected: null,
        fileId: "remote",
      },
      source("preserved"),
    );
    await f.vault.close();
    const repository = await NativeSyncRepository.open(
      f.options.statePath,
      hash(`native-apply:${f.options.vaultId}:${f.options.devicePublicKey}`),
    );
    let armed = false;
    const vault = await NativeSyncVault.open({
      ...f.options,
      repository: {
        blobs: repository.blobs,
        records: {
          putIfAbsent: repository.records.putIfAbsent,
          async get(key: string) {
            const record = await repository.records.get(key);
            if (armed && record) {
              armed = false;
              await f.security.membership("sync", "test").renameDevice({
                publicKey: f.options.devicePublicKey,
                alias: "Changed during receipt read",
              });
            }
            return record;
          },
        },
        readState: () => repository.readState(),
        compareAndSwap: (
          ...args: Parameters<typeof repository.compareAndSwap>
        ) => repository.compareAndSwap(...args),
        close: () => repository.close(),
      },
    });
    cleanups.push(() => vault.close());
    armed = true;
    await expect(vault.receipt("receipt-race")).rejects.toThrow(
      "authority changed",
    );
    expect(await vault.receipt("receipt-race")).toEqual(receipt);
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "preserved",
    );
  });
  it("requires a readable indexed receipt before compacting completed journal work", async () => {
    const f = await fixture();
    await f.vault.close();
    const repository = await NativeSyncRepository.open(
      f.options.statePath,
      hash(`native-apply:${f.options.vaultId}:${f.options.devicePublicKey}`),
    );
    const vault = await NativeSyncVault.open({
      ...f.options,
      repository: {
        blobs: repository.blobs,
        records: { get: repository.records.get, putIfAbsent: async () => true },
        readState: () => repository.readState(),
        compareAndSwap: (
          ...args: Parameters<typeof repository.compareAndSwap>
        ) => repository.compareAndSwap(...args),
        close: () => repository.close(),
      },
    });
    cleanups.push(() => vault.close());
    const operation: SyncFileMutation = {
      id: "missing-store",
      kind: "write",
      path: "note.md",
      expected: null,
      fileId: "remote",
    };
    await expect(
      vault.mutate(operation, source("completed mutation")),
    ).rejects.toThrow("durable record");
    await writeFile(
      join(f.rootPath, "note.md"),
      "edit after incomplete archive",
    );
    await vault.close();
    const reopened = await NativeSyncVault.open(f.options);
    cleanups.push(() => reopened.close());
    expect((await reopened.receipt(operation.id))?.operation).toEqual(
      operation,
    );
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "edit after incomplete archive",
    );
  });
  it.each(["before receipt", "after receipt", "after compaction"])(
    "recovers uncertain indexed persistence %s without repeating a completed mutation",
    async (phase) => {
      const f = await fixture();
      await f.vault.close();
      const repository = await NativeSyncRepository.open(
        f.options.statePath,
        hash(`native-apply:${f.options.vaultId}:${f.options.devicePublicKey}`),
      );
      let armed = true,
        stored = false;
      const wrapped = {
        blobs: repository.blobs,
        records: {
          get: (key: string) => repository.records.get(key),
          async putIfAbsent(
            ...args: Parameters<typeof repository.records.putIfAbsent>
          ) {
            if (armed && phase === "before receipt") {
              armed = false;
              throw new Error("Uncertain indexed persistence");
            }
            const result = await repository.records.putIfAbsent(...args);
            stored = true;
            if (armed && phase === "after receipt") {
              armed = false;
              throw new Error("Uncertain indexed persistence");
            }
            return result;
          },
        },
        readState: () => repository.readState(),
        async compareAndSwap(
          ...args: Parameters<typeof repository.compareAndSwap>
        ) {
          const result = await repository.compareAndSwap(...args);
          if (armed && stored && phase === "after compaction") {
            armed = false;
            throw new Error("Uncertain indexed persistence");
          }
          return result;
        },
        close: () => repository.close(),
      };
      const vault = await NativeSyncVault.open({
        ...f.options,
        repository: wrapped,
      });
      cleanups.push(() => vault.close());
      const operation: SyncFileMutation = {
        id: "uncertain-index",
        kind: "write",
        path: "note.md",
        expected: null,
        fileId: "remote",
      };
      await expect(
        vault.mutate(operation, source("installed remote content")),
      ).rejects.toThrow("Uncertain indexed persistence");
      await expect(vault.receipt(operation.id)).rejects.toThrow("uncertain");
      await writeFile(
        join(f.rootPath, "note.md"),
        "user edit after completed mutation",
      );
      await vault.close();
      const reopened = await NativeSyncVault.open(f.options);
      cleanups.push(() => reopened.close());
      const receipt = await reopened.receipt(operation.id);
      expect(receipt?.operation).toEqual(operation);
      expect(
        await reopened.mutate(
          operation,
          source("duplicate must not replace edit"),
        ),
      ).toEqual(receipt);
      expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
        "user edit after completed mutation",
      );
    },
  );

  it("rejects substitution of an indexed receipt for another operation", async () => {
    const f = await fixture();
    await f.vault.mutate(
      {
        id: "receipt-one",
        kind: "write",
        path: "one.md",
        expected: null,
        fileId: "one",
      },
      source("first"),
    );
    await f.vault.mutate(
      {
        id: "receipt-two",
        kind: "write",
        path: "two.md",
        expected: null,
        fileId: "two",
      },
      source("second"),
    );
    await f.vault.close();
    const repository = await NativeSyncRepository.open(
      f.options.statePath,
      hash(`native-apply:${f.options.vaultId}:${f.options.devicePublicKey}`),
    );
    const substituted = await repository.records.get(hash("receipt-two"));
    const vault = await NativeSyncVault.open({
      ...f.options,
      repository: {
        blobs: repository.blobs,
        records: {
          get: (key: string) =>
            key === hash("receipt-one")
              ? Promise.resolve(substituted)
              : repository.records.get(key),
          putIfAbsent: repository.records.putIfAbsent,
        },
        readState: () => repository.readState(),
        compareAndSwap: (
          ...args: Parameters<typeof repository.compareAndSwap>
        ) => repository.compareAndSwap(...args),
        close: () => repository.close(),
      },
    });
    cleanups.push(() => vault.close());
    await expect(vault.receipt("receipt-one")).rejects.toThrow(
      "does not belong",
    );
    expect(await readFile(join(f.rootPath, "one.md"), "utf8")).toBe("first");
  });

  it("keeps completed receipts outside the bounded active journal", async () => {
    const f = await fixture();
    f.fault.maxRootBytes = 8192;
    let expected: SyncFileMutation["expected"] = null;
    const receipts = [];
    for (let index = 0; index < 24; index++) {
      const receipt = await f.vault.mutate(
        {
          id: `bounded-${index}-${"x".repeat(128)}`,
          kind: "write",
          path: "note.md",
          fileId: "stable",
          expected,
        },
        source(`content ${index}`),
      );
      receipts.push(receipt);
      expected = receipt.result;
    }
    await f.vault.close();
    const reopened = await NativeSyncVault.open(f.options);
    cleanups.push(() => reopened.close());
    for (const receipt of receipts)
      expect(await reopened.receipt(receipt.operation.id)).toEqual(receipt);
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "content 23",
    );
    const staged = await readdir(join(f.rootPath, ".lapis/sync-apply"));
    expect(staged.filter((name) => name.endsWith(".after"))).toHaveLength(0);
    expect(staged.filter((name) => name.endsWith(".before"))).toHaveLength(23);
  });
  it("durably applies once, reopens receipts and preserves identity through physical rename", async () => {
    const f = await fixture();
    const operation = {
      id: "first",
      kind: "write" as const,
      path: "note.md",
      expected: null,
      fileId: "protocol-file",
    };
    const receipt = await f.vault.mutate(operation, source("one"));
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe("one");
    expect(receipt.result?.fileId).toBe("protocol-file");
    await f.vault.close();
    const reopened = await NativeSyncVault.open(f.options);
    cleanups.push(() => reopened.close());
    expect(await reopened.receipt("first")).toEqual(receipt);
    expect(
      await reopened.mutate(operation, source("must not overwrite")),
    ).toEqual(receipt);
    await rename(join(f.rootPath, "note.md"), join(f.rootPath, "renamed.md"));
    const files = await reopened.list();
    expect(files.map((file) => file.path)).toEqual(["renamed.md"]);
    expect(files[0].fileId).toBe("protocol-file");
    expect(await new Response(await files[0].openRead()).text()).toBe("one");
  });

  it("rejects a stale captured generation while preserving user content", async () => {
    const f = await fixture();
    await writeFile(join(f.rootPath, "note.md"), "before");
    const file = (await f.vault.list())[0];
    await writeFile(join(f.rootPath, "note.md"), "user edit");
    await expect(
      f.vault.mutate(
        {
          id: "stale",
          kind: "write",
          path: file.path,
          expected: file,
          fileId: file.fileId,
        },
        source("remote"),
      ),
    ).rejects.toThrow(/changed|stale/i);
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "user edit",
    );
    expect(await f.vault.receipt("stale")).toBeNull();
  });

  it.each(["claimed", "installed", "completed"])(
    "recovers a physical mutation before %s persistence",
    async (phase) => {
      const f = await fixture();
      await writeFile(join(f.rootPath, "note.md"), "old working content");
      const file = (await f.vault.list())[0];
      const operation: SyncFileMutation = {
        id: "recover",
        kind: "write",
        path: file.path,
        expected: file,
        fileId: file.fileId,
      };
      f.fault.phase = phase;
      await expect(
        f.vault.mutate(operation, source("incoming content")),
      ).rejects.toThrow("Injected");
      await f.vault.close();
      const reopened = await NativeSyncVault.open(f.options);
      cleanups.push(() => reopened.close());
      await expect(reopened.list()).rejects.toThrow("pending native apply");
      const receipt = await reopened.receipt(operation.id);
      expect(receipt?.result?.fileId).toBe(file.fileId);
      expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
        "incoming content",
      );
      const inode = (await stat(join(f.rootPath, "note.md"))).ino;
      await reopened.mutate(
        operation,
        source("a duplicate must not be installed"),
      );
      expect((await stat(join(f.rootPath, "note.md"))).ino).toBe(inode);
    },
  );

  it.each(["prepared", "completed"])(
    "recovers a lost %s journal commit response",
    async (phase) => {
      const f = await fixture();
      await f.vault.close();
      const repository = await NativeSyncRepository.open(
        f.options.statePath,
        hash(`native-apply:${f.options.vaultId}:${f.options.devicePublicKey}`),
      );
      let observedPhase: string | undefined,
        armed = true;
      f.fault.beforeSeal = async (mutation) => {
        if (mutation.operation.id === "lost") observedPhase = mutation.phase;
      };
      const wrapped = {
        blobs: repository.blobs,
        records: repository.records,
        readState: () => repository.readState(),
        close: () => repository.close(),
        async compareAndSwap(
          ...args: Parameters<typeof repository.compareAndSwap>
        ) {
          const accepted = await repository.compareAndSwap(...args);
          if (armed && observedPhase === phase) {
            armed = false;
            throw new Error("Injected lost commit response");
          }
          return accepted;
        },
      };
      const vault = await NativeSyncVault.open({
        ...f.options,
        repository: wrapped,
      });
      cleanups.push(() => vault.close());
      await expect(
        vault.mutate(
          {
            id: "lost",
            kind: "write",
            path: "note.md",
            expected: null,
            fileId: "remote",
          },
          source("stable retry content"),
        ),
      ).rejects.toThrow("lost commit response");
      await vault.close();
      const reopened = await NativeSyncVault.open(f.options);
      cleanups.push(() => reopened.close());
      expect((await reopened.receipt("lost"))?.result?.fileId).toBe("remote");
      expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
        "stable retry content",
      );
    },
  );

  it("preserves an edit made during streaming without preparing a mutation", async () => {
    const f = await fixture();
    await writeFile(join(f.rootPath, "note.md"), "old");
    const file = (await f.vault.list())[0];
    const stream = new ReadableStream<Uint8Array>(
      {
        async pull(controller) {
          await writeFile(
            join(f.rootPath, "note.md"),
            "edited while streaming",
          );
          controller.enqueue(new TextEncoder().encode("incoming"));
          controller.close();
        },
      },
      { highWaterMark: 0 },
    );
    await expect(
      f.vault.mutate(
        {
          id: "stream",
          kind: "write",
          path: file.path,
          expected: file,
          fileId: file.fileId,
        },
        stream,
      ),
    ).rejects.toThrow("changed during streaming");
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "edited while streaming",
    );
    expect(await f.vault.receipt("stream")).toBeNull();
  });

  it("rejects membership changes during streaming before working-file mutation", async () => {
    const f = await fixture();
    await writeFile(join(f.rootPath, "note.md"), "preserve local bytes");
    const file = (await f.vault.list())[0];
    const membership = f.security.membership("sync", "test");
    const stream = new ReadableStream<Uint8Array>(
      {
        async pull(controller) {
          await membership.renameDevice({
            publicKey: f.options.devicePublicKey,
            alias: "Changed membership",
          });
          controller.enqueue(new TextEncoder().encode("incoming"));
          controller.close();
        },
      },
      { highWaterMark: 0 },
    );
    await expect(
      f.vault.mutate(
        {
          id: "authority",
          kind: "write",
          path: file.path,
          expected: file,
          fileId: file.fileId,
        },
        stream,
      ),
    ).rejects.toThrow(/authority changed/i);
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "preserve local bytes",
    );
    expect(await f.vault.receipt("authority")).toBeNull();
  });

  it("does not replace a file recreated after preimage capture", async () => {
    const f = await fixture();
    await writeFile(join(f.rootPath, "note.md"), "original preimage");
    const file = (await f.vault.list())[0];
    f.fault.beforeSeal = async (mutation) => {
      if (mutation.phase === "claimed") {
        f.fault.beforeSeal = undefined;
        await writeFile(
          join(f.rootPath, "note.md"),
          "new concurrent working file",
        );
      }
    };
    await expect(
      f.vault.mutate(
        {
          id: "recreated",
          kind: "write",
          path: file.path,
          expected: file,
          fileId: file.fileId,
        },
        source("incoming"),
      ),
    ).rejects.toThrow("changed after claim");
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "new concurrent working file",
    );
    const stage = join(f.rootPath, ".lapis/sync-apply");
    const backup = (await readdir(stage)).find((name) =>
      name.endsWith(".before"),
    )!;
    expect(await readFile(join(stage, backup), "utf8")).toBe(
      "original preimage",
    );
  });

  it("restores an edit that races between the final guard and preimage capture", async () => {
    const f = await fixture();
    await writeFile(join(f.rootPath, "note.md"), "original");
    const file = (await f.vault.list())[0];
    physicalFault.beforeRename = async (path) => {
      await writeFile(String(path), "edit racing with claim");
    };
    await expect(
      f.vault.mutate(
        {
          id: "claim-race",
          kind: "write",
          path: file.path,
          expected: file,
          fileId: file.fileId,
        },
        source("incoming"),
      ),
    ).rejects.toThrow("preimage changed");
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "edit racing with claim",
    );
    await expect(f.vault.receipt("claim-race")).rejects.toThrow(
      "preimage changed",
    );
  });

  it("uses no-replace installation when a file appears after the final absence check", async () => {
    const f = await fixture();
    physicalFault.beforeLink = async (_source, target) => {
      await writeFile(String(target), "concurrent file must survive");
    };
    await expect(
      f.vault.mutate(
        {
          id: "link-race",
          kind: "write",
          path: "note.md",
          expected: null,
          fileId: "remote",
        },
        source("incoming"),
      ),
    ).rejects.toMatchObject({ code: "EEXIST" });
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "concurrent file must survive",
    );
    await expect(f.vault.receipt("link-race")).rejects.toThrow(
      "changed after claim",
    );
  });

  it("preserves an existing staging file when exclusive creation fails", async () => {
    const f = await fixture(),
      token = "00000000-0000-4000-8000-000000000001";
    const path = join(f.rootPath, ".lapis/sync-apply", `${token}.after`);
    await writeFile(path, "existing recoverable staging bytes");
    vi.spyOn(crypto, "randomUUID").mockReturnValueOnce(token);
    await expect(
      f.vault.mutate(
        {
          id: "collision",
          kind: "write",
          path: "note.md",
          expected: null,
          fileId: "remote",
        },
        source("incoming"),
      ),
    ).rejects.toMatchObject({ code: "EEXIST" });
    expect(await readFile(path, "utf8")).toBe(
      "existing recoverable staging bytes",
    );
  });

  it.each([false, true])(
    "cleans up an interrupted stream without deleting replaced staging (%s)",
    async (replace) => {
      const f = await fixture(),
        token = "00000000-0000-4000-8000-000000000002";
      const path = join(f.rootPath, ".lapis/sync-apply", `${token}.after`);
      const retained = `${path}.retained`;
      vi.spyOn(crypto, "randomUUID").mockReturnValueOnce(token);
      let sent = false;
      const stream = new ReadableStream<Uint8Array>(
        {
          async pull(controller) {
            if (!sent) {
              sent = true;
              controller.enqueue(
                new TextEncoder().encode("partial incoming bytes"),
              );
              return;
            }
            if (replace) {
              await rename(path, retained);
              await writeFile(path, "replacement staging must survive");
            }
            controller.error(new Error("Interrupted incoming stream"));
          },
        },
        { highWaterMark: 0 },
      );
      await expect(
        f.vault.mutate(
          {
            id: "interrupted-stream",
            kind: "write",
            path: "note.md",
            expected: null,
            fileId: "remote",
          },
          stream,
        ),
      ).rejects.toThrow("Interrupted incoming stream");
      expect(await f.vault.receipt("interrupted-stream")).toBeNull();
      await expect(readFile(join(f.rootPath, "note.md"))).rejects.toMatchObject(
        { code: "ENOENT" },
      );
      if (replace) {
        expect(await readFile(path, "utf8")).toBe(
          "replacement staging must survive",
        );
        expect(await readFile(retained, "utf8")).toBe("partial incoming bytes");
      } else {
        await expect(readFile(path)).rejects.toMatchObject({ code: "ENOENT" });
      }
    },
  );

  it("rejects recovery after an unreceipted installed file is edited", async () => {
    const f = await fixture();
    f.fault.phase = "installed";
    await expect(
      f.vault.mutate(
        {
          id: "edited",
          kind: "write",
          path: "note.md",
          expected: null,
          fileId: "remote",
        },
        source("incoming"),
      ),
    ).rejects.toThrow("Injected");
    await writeFile(
      join(f.rootPath, "note.md"),
      "user edit after interrupted install",
    );
    await f.vault.close();
    const reopened = await NativeSyncVault.open(f.options);
    cleanups.push(() => reopened.close());
    await expect(reopened.receipt("edited")).rejects.toThrow(/content changed/);
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "user edit after interrupted install",
    );
    await expect(reopened.list()).rejects.toThrow("pending native apply");
  });

  it("retains deletion receipts and rejects reused operation IDs", async () => {
    const f = await fixture();
    await writeFile(join(f.rootPath, "note.md"), "delete me");
    const file = (await f.vault.list())[0],
      operation: SyncFileMutation = {
        id: "remove",
        kind: "remove",
        path: file.path,
        expected: file,
        fileId: file.fileId,
      };
    const receipt = await f.vault.mutate(operation);
    expect(receipt.result).toBeNull();
    await expect(readFile(join(f.rootPath, "note.md"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(await f.vault.mutate(operation)).toEqual(receipt);
    await expect(
      f.vault.mutate({ ...operation, path: "another.md" }),
    ).rejects.toThrow("reused");
  });

  it("arbitrates vault ownership independently of journal location", async () => {
    const f = await fixture();
    await expect(
      NativeSyncVault.open({
        ...f.options,
        statePath: join(f.directory, "second.sqlite"),
      }),
    ).rejects.toThrow("Another native apply owner");
    await f.vault.close();
    const reopened = await NativeSyncVault.open(f.options);
    cleanups.push(() => reopened.close());
    expect(await reopened.list()).toEqual([]);
  });

  it("rejects traversal, reserved paths and symlink parents", async () => {
    const f = await fixture(),
      outside = join(f.directory, "outside");
    await mkdir(outside);
    await symlink(outside, join(f.rootPath, "linked"));
    for (const path of [
      "../escape.md",
      "/absolute.md",
      "a/../b.md",
      ".lapis/notes.md",
      "linked/private.md",
    ]) {
      await expect(
        f.vault.mutate(
          { id: path, kind: "write", path, expected: null, fileId: "remote" },
          source("secret"),
        ),
      ).rejects.toThrow(/path|parent/);
    }
    expect(await readdir(outside)).toEqual([]);
    await expect(f.vault.list()).rejects.toThrow("Symlinks");
  });

  it("keeps prototype-shaped paths and journal metadata safe across reopen", async () => {
    const f = await fixture();
    for (const path of ["__proto__", "constructor", "toString"])
      await f.vault.mutate(
        { id: path, kind: "write", path, expected: null, fileId: path },
        source(`private content for ${path}`),
      );
    await f.vault.close();
    const reopened = await NativeSyncVault.open(f.options);
    cleanups.push(() => reopened.close());
    const files = await reopened.list();
    expect(files.map((file) => file.path).sort()).toEqual(
      ["__proto__", "constructor", "toString"].sort(),
    );
    for (const file of files)
      expect(await new Response(await file.openRead()).text()).toBe(
        `private content for ${file.path}`,
      );
    const bytes = await readFile(f.options.statePath);
    expect(bytes.includes(Buffer.from("private content for"))).toBe(false);
    expect(bytes.includes(Buffer.from("contentGeneration"))).toBe(false);
  });

  it("rejects locked access and journal substitution to a different physical root", async () => {
    const f = await fixture();
    f.security.lock("sync");
    await expect(f.vault.list()).rejects.toThrow("unlocked");
    await f.vault.close();
    await f.security.unlock("sync", "guarded fixture passphrase");
    const rootPath = join(f.directory, "other-vault");
    await mkdir(rootPath);
    await expect(
      NativeSyncVault.open({ ...f.options, rootPath }),
    ).rejects.toThrow("does not belong");
  });

  it("rejects an unsupported encryption suite before exposing capture", async () => {
    const f = await fixture(),
      status = f.options.crypto.status;
    f.options.crypto.status = async () => ({
      ...(await status()),
      suite: "plaintext" as "lapis-sync-v1-xchacha20poly1305-schnorr",
    });
    await expect(f.vault.list()).rejects.toThrow(/encryption/);
  });

  it("closes capture streams and releases ownership", async () => {
    const f = await fixture();
    await writeFile(join(f.rootPath, "note.md"), "capture bytes");
    const file = (await f.vault.list())[0],
      stream = await file.openRead();
    await f.vault.close();
    await expect(new Response(stream).text()).rejects.toThrow("closing");
    const reopened = await NativeSyncVault.open(f.options);
    cleanups.push(() => reopened.close());
    expect((await reopened.list())[0].fileId).toBe(file.fileId);
  });

  it("cancels blocked staging without waiting for an uncooperative source cancellation", async () => {
    const f = await fixture();
    let started!: () => void,
      cancelled = false;
    const reading = new Promise<void>((resolve) => {
      started = resolve;
    });
    const stream = new ReadableStream<Uint8Array>(
      {
        pull() {
          started();
        },
        cancel() {
          cancelled = true;
          return new Promise<void>(() => {});
        },
      },
      { highWaterMark: 0 },
    );
    const applying = f.vault.mutate(
      {
        id: "closing",
        kind: "write",
        path: "note.md",
        expected: null,
        fileId: "remote",
      },
      stream,
    );
    const failed = expect(applying).rejects.toThrow(/closing|closed/);
    await reading;
    await f.vault.close();
    await failed;
    expect(cancelled).toBe(true);
    const reopened = await NativeSyncVault.open(f.options);
    cleanups.push(() => reopened.close());
    expect(await reopened.receipt("closing")).toBeNull();
    expect(await reopened.list()).toEqual([]);
  });
});
