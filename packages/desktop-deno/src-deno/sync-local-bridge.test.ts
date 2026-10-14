import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  truncate,
  symlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import { DenoSyncSecurityHost } from "./sync-security";
import { inspectNativeSyncRoot } from "@lapis-notes/deno-host-services/sync-vault-root";
import * as rootInspection from "@lapis-notes/deno-host-services/sync-vault-root";
import { createDesktopSyncHostProviders } from "../src/deno-sync-security";
import { SYNC_LOCAL_WIRE_CHARS } from "../src/sync-local-protocol";
import {
  decodeSyncValue,
  encodeSyncValue,
} from "../src/sync-security-protocol";
import type { SyncLocalOperation } from "../src/sync-local-protocol";
import { DenoSyncLocalSession } from "./sync-local";
import { NativeSyncSecurityStore } from "@lapis-notes/deno-host-services/sync-security-store";

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});
async function fixture() {
  const directory = await realpath(
    await mkdtemp(join(tmpdir(), "lapis-native-data-")),
  );
  cleanups.push(() => rm(directory, { recursive: true, force: true }));
  const rootPath = join(directory, "vault");
  await mkdir(rootPath);
  await writeFile(join(rootPath, "note.md"), "private native note");
  const root = await inspectNativeSyncRoot(rootPath);
  let lease: object | undefined = {};
  const host = new DenoSyncSecurityHost({
    userDataPath: join(directory, "data"),
    getProfileLease: () => lease,
    getProfileRoot: () =>
      lease ? { rootPath: root.root, rootBinding: root.binding } : undefined,
    getWrappingKey: async () => ({
      provider: "os-credential-store",
      keyId: "data-fixture",
      wrappingKeyBase64: btoa("x".repeat(32)),
    }),
    securityOptions: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } },
  });
  let expectCleanupFailure = false;
  cleanups.push(async () => {
    if (expectCleanupFailure)
      await expect(host.closeAll()).rejects.toThrow(/shutdown/);
    else await host.closeAll();
  });
  const invoke = vi.fn(
    async (command: string, payload: Record<string, unknown> = {}) => {
      const result = await host.handle(
        command,
        JSON.parse(JSON.stringify(payload)),
      );
      return result === undefined
        ? undefined
        : JSON.parse(JSON.stringify(result));
    },
  );
  const create = () =>
    createDesktopSyncHostProviders({
      vaultId: "profile",
      invoke,
      requestRecoveryPassphrase: async () => "fixture recovery",
    });
  const providers = create();
  const security = providers.security.forRuntime("runtime");
  await security.crypto.enrollNewVault({ deviceAlias: "Desktop" });
  const local = providers.local.forRuntime("runtime");
  const sessionToken = invoke.mock.results.find(
    (_, index) =>
      invoke.mock.calls[index]?.[0] === "desktop_sync_security_open",
  )!;
  const session = (await sessionToken.value) as { sessionToken: string };
  const call = async (operation: SyncLocalOperation, args: unknown[]) =>
    decodeSyncValue(
      await host.handle("desktop_sync_local_call", {
        ...session,
        operation,
        args: encodeSyncValue(args),
      }),
    );
  const authority = async () => {
    const status = await security.crypto.status();
    return {
      vaultId: status.vaultId!,
      devicePublicKey: status.devicePublicKey!,
      epoch: status.currentEpoch!,
      membershipGeneration: status.membershipGeneration!,
    };
  };
  return {
    directory,
    rootPath,
    host,
    invoke,
    providers,
    security,
    local,
    authority,
    create,
    call,
    revoke() {
      lease = undefined;
    },
    expectCleanupFailure() {
      expectCleanupFailure = true;
    },
  };
}

async function bodies(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? bodies(join(directory, entry.name))
          : Promise.resolve(
              entry.name === "body" ? [join(directory, entry.name)] : [],
            ),
      ),
    )
  ).flat();
}

it("captures, streams and guards real files over the shared JSON-only security session", async () => {
  const { local, rootPath, authority, invoke } = await fixture();
  const [file] = await local.list();
  expect(await new Response(await file!.openRead()).text()).toBe(
    "private native note",
  );
  const bytes = new Uint8Array(20 * 1024 * 1024);
  for (let index = 0; index < bytes.length; index++) bytes[index] = index % 251;
  const receipt = await local.apply.mutate(
    {
      id: "write",
      kind: "write",
      path: "note.md",
      fileId: file!.fileId,
      expected: file!,
    },
    new Blob([bytes]).stream(),
    await authority(),
  );
  expect(receipt.result?.fileId).toBe(file!.fileId);
  const actual = await readFile(join(rootPath, "note.md"));
  expect(actual.byteLength).toBe(bytes.byteLength);
  expect(createHash("sha256").update(actual).digest("hex")).toBe(
    createHash("sha256").update(bytes).digest("hex"),
  );
  for (const [command, payload] of invoke.mock.calls)
    if (command === "desktop_sync_local_call")
      expect(String(payload.args).length).toBeLessThanOrEqual(
        SYNC_LOCAL_WIRE_CHARS,
      );
  expect(
    invoke.mock.calls.filter(
      ([command]) => command === "desktop_sync_security_open",
    ),
  ).toHaveLength(1);
});

it("persists sealed repository state and ciphertext through independent runtime reopen", async () => {
  const { local, security, authority, providers, create } = await fixture();
  const encrypted = await security.crypto.encryptObject({
    epoch: 1,
    type: "local-state",
    plaintext: new TextEncoder().encode("private state"),
  });
  const object = await local.repository.blobs.put(encrypted.bytes);
  expect(await local.repository.blobs.get(object.hash)).toEqual(
    encrypted.bytes,
  );
  expect(
    await local.repository.compareAndSwap(
      0,
      { epoch: 1, version: 1, ciphertext: encrypted.bytes },
      await authority(),
    ),
  ).toBe(true);
  await providers.local.revokeRuntime("runtime");
  await providers.security.revokeRuntime("runtime");
  const next = create();
  const keys = next.security.forRuntime("reopened"),
    reopened = next.local.forRuntime("reopened");
  expect((await keys.crypto.status()).state).toBe("locked");
  await keys.crypto.requestUnlock();
  expect(await reopened.repository.readState()).toEqual({
    epoch: 1,
    version: 1,
    ciphertext: encrypted.bytes,
  });
  expect(
    new TextDecoder().decode(
      await keys.crypto.decryptObject({
        epoch: 1,
        type: "local-state",
        envelope: await reopened.repository.blobs.get(object.hash),
      }),
    ),
  ).toBe("private state");
});

it("retries lost chunk and completion responses without duplicating working mutations", async () => {
  const { invoke, local, authority, rootPath } = await fixture();
  const original = invoke.getMockImplementation()!;
  let droppedChunk = false,
    droppedFinish = false;
  invoke.mockImplementation(async (...args) => {
    const result = await original(...args);
    if (args[1]?.operation === "uploadChunk" && !droppedChunk) {
      droppedChunk = true;
      throw new Error("lost chunk response");
    }
    if (args[1]?.operation === "uploadFinish" && !droppedFinish) {
      droppedFinish = true;
      throw new Error("lost finish response");
    }
    return result;
  });
  const [file] = await local.list();
  await local.apply.mutate(
    {
      id: "retry",
      kind: "write",
      path: "note.md",
      fileId: file!.fileId,
      expected: file!,
    },
    new Blob(["replacement"]).stream(),
    await authority(),
  );
  expect(droppedChunk && droppedFinish).toBe(true);
  expect(await readFile(join(rootPath, "note.md"), "utf8")).toBe("replacement");
  expect(
    (await local.apply.receipt("retry", await authority()))?.operation.id,
  ).toBe("retry");
});

it("rejects missing/stale authority without touching files or committed state", async () => {
  const { local, security, authority, rootPath } = await fixture();
  const [file] = await local.list(),
    stale = await authority();
  const mutation = {
    id: "guard",
    kind: "remove" as const,
    path: "note.md",
    fileId: file!.fileId,
    expected: file!,
  };
  await expect(local.apply.mutate(mutation)).rejects.toThrow(/authority/i);
  await security.membership.renameDevice({
    publicKey: stale.devicePublicKey,
    alias: "Renamed",
  });
  await expect(local.apply.mutate(mutation, undefined, stale)).rejects.toThrow(
    /failed|authority/i,
  );
  expect(await readFile(join(rootPath, "note.md"), "utf8")).toBe(
    "private native note",
  );
  expect(await local.repository.readState()).toBeNull();
});

it("revokes active read streams and rejects arbitrary root fields at native dispatch", async () => {
  const { local, invoke, providers, host, revoke } = await fixture();
  const [file] = await local.list();
  const reader = (await file!.openRead()).getReader();
  void reader.closed.catch(() => undefined);
  const call = invoke.mock.calls.find(
    ([command]) => command === "desktop_sync_local_call",
  )!;
  await expect(
    host.handle("desktop_sync_local_call", { ...call[1], rootPath: "/other" }),
  ).rejects.toThrow(/invalid/i);
  revoke();
  await host.closeInactiveProfiles();
  await expect(reader.read()).rejects.toThrow(/revoked|unavailable|failed/i);
  await providers.local.revokeRuntime("runtime");
});

it.each(["state", "write"] as const)(
  "retains the initial authority across a multipart %s upload",
  async (kind) => {
    const f = await fixture(),
      fence = await f.authority(),
      [file] = await f.local.list();
    await f.call("uploadStart", ["authority-upload", kind, fence]);
    await f.call("uploadChunk", [
      "authority-upload",
      0,
      new Uint8Array(256 * 1024).fill(42),
    ]);
    await f.security.membership.renameDevice({
      publicKey: fence.devicePublicKey,
      alias: "Changed during upload",
    });
    await f.call("uploadChunk", ["authority-upload", 1, new Uint8Array([43])]);
    await expect(
      f.call("uploadFinish", [
        "authority-upload",
        kind === "state"
          ? { expectedVersion: 0, version: 1, epoch: 1 }
          : {
              id: "stale-upload",
              kind: "write",
              path: file!.path,
              fileId: file!.fileId,
              expected: {
                fileId: file!.fileId,
                contentGeneration: file!.contentGeneration,
                hostFileId: file!.hostFileId,
              },
            },
      ]),
    ).rejects.toThrow(/failed/);
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "private native note",
    );
    expect(await f.local.repository.readState()).toBeNull();
    expect(
      await f.local.apply.receipt("stale-upload", await f.authority()),
    ).toBeNull();
    await f.call("uploadClose", ["authority-upload"]);
    expect(await bodies(f.directory)).toEqual([]);
  },
);

it.each(["tamper", "truncate"] as const)(
  "rejects staged %s before publishing state or replacing a file",
  async (fault) => {
    const f = await fixture(),
      [file] = await f.local.list(),
      fence = await f.authority();
    const original = f.invoke.getMockImplementation()!;
    f.invoke.mockImplementation(async (...args) => {
      if (args[1]?.operation === "uploadFinish") {
        const [body] = await bodies(f.directory);
        if (fault === "tamper") await writeFile(body!, new Uint8Array([99]));
        else await truncate(body!, 0);
      }
      return original(...args);
    });
    await expect(
      f.local.apply.mutate(
        {
          id: `staged-${fault}`,
          kind: "write",
          path: file!.path,
          fileId: file!.fileId,
          expected: file!,
        },
        new Blob(["untrusted staging"]).stream(),
        fence,
      ),
    ).rejects.toThrow(/failed/);
    expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
      "private native note",
    );
    expect(await f.local.apply.receipt(`staged-${fault}`, fence)).toBeNull();
    await expect(
      f.local.repository.compareAndSwap(
        0,
        { version: 1, epoch: 1, ciphertext: new Uint8Array([1, 2, 3]) },
        fence,
      ),
    ).rejects.toThrow(/failed/);
    expect(await f.local.repository.readState()).toBeNull();
    expect(await bodies(f.directory)).toEqual([]);
  },
);

it("keeps the owned staging handle when its pathname is substituted", async () => {
  const f = await fixture(),
    [file] = await f.local.list(),
    original = f.invoke.getMockImplementation()!;
  f.invoke.mockImplementation(async (...args) => {
    if (args[1]?.operation === "uploadFinish") {
      const [body] = await bodies(f.directory);
      await rename(body!, `${body}.original`);
      await writeFile(body!, "substituted content");
    }
    return original(...args);
  });
  await f.local.apply.mutate(
    {
      id: "owned",
      kind: "write",
      path: file!.path,
      fileId: file!.fileId,
      expected: file!,
    },
    new Blob(["owned content"]).stream(),
    await f.authority(),
  );
  expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
    "owned content",
  );
  expect(await bodies(f.directory)).toEqual([]);
});

it("rejects a staging parent redirected into the working vault after physical admission", async () => {
  const f = await fixture();
  await f.local.list();
  const inspect = rootInspection.inspectNativeSyncRoot;
  let redirected = false;
  const root = vi
    .spyOn(rootInspection, "inspectNativeSyncRoot")
    .mockImplementation(async (path) => {
      const bound = await inspect(path);
      if (
        !redirected &&
        path.includes("/sync-data/") &&
        !path.endsWith("/transfers")
      ) {
        redirected = true;
        await rename(bound.root, `${bound.root}.original`);
        await symlink(f.rootPath, bound.root, "dir");
      }
      return bound;
    });
  try {
    await expect(
      f.call("uploadStart", ["redirected", "blob", null]),
    ).rejects.toThrow(/failed/);
    expect(redirected).toBe(true);
    expect(await bodies(f.rootPath)).toEqual([]);
  } finally {
    root.mockRestore();
  }
});

it("rejects replay substitution and out-of-order chunks while retaining idempotent retries", async () => {
  const f = await fixture();
  await f.call("uploadStart", ["replay", "blob", null]);
  await f.call("uploadStart", ["replay", "blob", null]);
  await expect(
    f.call("uploadStart", ["replay", "write", await f.authority()]),
  ).rejects.toThrow(/failed/);
  await expect(
    f.call("uploadChunk", ["replay", 1, new Uint8Array([1])]),
  ).rejects.toThrow(/failed/);
  await f.call("uploadChunk", ["replay", 0, new Uint8Array([1])]);
  await f.call("uploadChunk", ["replay", 0, new Uint8Array([1])]);
  await expect(
    f.call("uploadChunk", ["replay", 0, new Uint8Array([2])]),
  ).rejects.toThrow(/failed/);
  const result = await f.call("uploadFinish", ["replay", null]);
  expect(await f.call("uploadFinish", ["replay", null])).toEqual(result);
  await expect(f.call("uploadFinish", ["replay", {}])).rejects.toThrow(
    /failed/,
  );
  await expect(
    f.call("uploadChunk", ["replay", 1, new Uint8Array([3])]),
  ).rejects.toThrow(/failed/);
  await f.call("uploadClose", ["replay"]);
});

it("pages large captures and retains guarded prototype-shaped filenames after capture disposal", async () => {
  const f = await fixture();
  await mkdir(join(f.rootPath, ".obsidian"));
  await writeFile(
    join(f.rootPath, ".obsidian", "credentials"),
    "never capture",
  );
  const names = [
    "__proto__",
    "constructor",
    ...Array.from({ length: 260 }, (_, index) => `note-${index}.md`),
  ];
  await Promise.all(
    names.map((name) => writeFile(join(f.rootPath, name), name)),
  );
  const files = await f.local.list();
  expect(files).toHaveLength(263);
  expect(
    f.invoke.mock.calls.filter(
      ([, payload]) => payload.operation === "capturePage",
    ).length,
  ).toBeGreaterThan(2);
  for (const name of ["__proto__", "constructor"])
    expect(
      await new Response(
        await files.find((file) => file.path === name)!.openRead(),
      ).text(),
    ).toBe(name);
  expect(files.some((file) => file.path.startsWith(".obsidian/"))).toBe(false);
  const proto = files.find((file) => file.path === "__proto__")!;
  await writeFile(join(f.rootPath, proto.path), "new generation");
  await expect(
    (async () => new Response(await proto.openRead()).text())(),
  ).rejects.toThrow(/failed|changed/);
});

it("rejects excluded or substituted descriptors and physical root replacement", async () => {
  const f = await fixture(),
    [file] = await f.local.list();
  await expect(
    f.call("fileRead", [
      "excluded",
      {
        path: ".obsidian/secret",
        fileId: file!.fileId,
        contentGeneration: file!.contentGeneration,
      },
    ]),
  ).rejects.toThrow(/failed/);
  await expect(
    f.call("fileRead", [
      "changed",
      {
        path: file!.path,
        fileId: "other",
        contentGeneration: file!.contentGeneration,
      },
    ]),
  ).rejects.toThrow(/failed/);
  await rename(f.rootPath, `${f.rootPath}.old`);
  await mkdir(f.rootPath);
  await writeFile(join(f.rootPath, "note.md"), "replacement root");
  await expect(f.local.list()).rejects.toThrow(/failed/);
  await expect(file!.openRead()).rejects.toThrow(/failed/);
});

it("cancels a multipart upload on profile revocation and removes transfer staging", async () => {
  const f = await fixture(),
    [file] = await f.local.list(),
    original = f.invoke.getMockImplementation()!;
  f.invoke.mockImplementation(async (...args) => {
    const result = await original(...args);
    if (args[1]?.operation === "uploadChunk") {
      f.revoke();
      await f.host.closeInactiveProfiles();
    }
    return result;
  });
  await expect(
    f.local.apply.mutate(
      {
        id: "cancelled",
        kind: "write",
        path: file!.path,
        fileId: file!.fileId,
        expected: file!,
      },
      new Blob([new Uint8Array(512 * 1024)]).stream(),
      await f.authority(),
    ),
  ).rejects.toThrow(/revoked|failed|unavailable/);
  expect(await readFile(join(f.rootPath, "note.md"), "utf8")).toBe(
    "private native note",
  );
  expect(await bodies(f.directory)).toEqual([]);
});

it.each(["blobHas", "stateRead", "uploadFinish"] as const)(
  "rejects malformed %s responses rather than trusting JSON casts",
  async (operation) => {
    const f = await fixture(),
      original = f.invoke.getMockImplementation()!;
    f.invoke.mockImplementation(async (...args) => {
      const result = await original(...args);
      if (args[1]?.operation === operation)
        return encodeSyncValue(
          operation === "blobHas"
            ? "true"
            : operation === "stateRead"
              ? { id: "wrong-transfer", version: -1, epoch: 0 }
              : { hash: "not-a-hash", size: -1 },
        );
      return result;
    });
    await expect(
      operation === "blobHas"
        ? f.local.repository.blobs.has("0".repeat(64))
        : operation === "stateRead"
          ? f.local.repository.readState()
          : f.local.repository.blobs.put(new Uint8Array([1])),
    ).rejects.toThrow(/invalid/i);
  },
);

it("retries lost read responses without skipping or repeating attachment bytes", async () => {
  const f = await fixture(),
    original = f.invoke.getMockImplementation()!;
  const input = new Uint8Array(600 * 1024);
  for (let index = 0; index < input.length; index++) input[index] = index % 251;
  await writeFile(join(f.rootPath, "attachment.bin"), input);
  let dropped = false;
  f.invoke.mockImplementation(async (...args) => {
    const result = await original(...args);
    if (args[1]?.operation === "readChunk" && !dropped) {
      dropped = true;
      throw new Error("lost read response");
    }
    return result;
  });
  const files = await f.local.list(),
    attachment = files.find((file) => file.path === "attachment.bin")!;
  expect(
    new Uint8Array(
      await new Response(await attachment.openRead()).arrayBuffer(),
    ),
  ).toEqual(input);
  expect(dropped).toBe(true);
});

it("reports data cleanup failure, closes key storage and blocks a replacement native writer", async () => {
  const f = await fixture();
  await f.call("uploadStart", ["cleanup", "blob", null]);
  await f.call("uploadChunk", ["cleanup", 0, new Uint8Array([1])]);
  const close = DenoSyncLocalSession.prototype.close;
  const failedClose = vi
    .spyOn(DenoSyncLocalSession.prototype, "close")
    .mockImplementationOnce(async function () {
      await close.call(this);
      throw new Error("private backend cleanup failure");
    });
  const keyClose = vi.spyOn(NativeSyncSecurityStore.prototype, "close");
  f.expectCleanupFailure();
  try {
    await expect(f.providers.local.revokeRuntime("runtime")).rejects.toThrow(
      "Native Sync session cleanup failed",
    );
    expect(keyClose).toHaveBeenCalledOnce();
    expect(await bodies(f.directory)).toEqual([]);
    await expect(
      f.host.handle("desktop_sync_security_open", {
        pluginId: "sync",
        vaultId: "profile",
        runtimeId: "replacement",
      }),
    ).rejects.toThrow("Native Sync session cleanup failed");
  } finally {
    failedClose.mockRestore();
    keyClose.mockRestore();
  }
});
