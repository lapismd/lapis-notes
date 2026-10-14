import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { DenoSyncSecurityHost } from "./sync-security";
import {
  decodeSyncValue,
  encodeSyncValue,
} from "../src/sync-security-protocol";
import { NativeSyncSecurityStore } from "@lapis-notes/deno-host-services/sync-security-store";

const fixtures: { directory: string; hosts: DenoSyncSecurityHost[] }[] = [];
afterEach(async () => {
  for (const fixture of fixtures.splice(0)) {
    await Promise.allSettled(fixture.hosts.map((host) => host.closeAll()));
    await rm(fixture.directory, { recursive: true, force: true });
  }
});

async function fixture() {
  const directory = await mkdtemp(
    join(tmpdir(), "lapis-sync-native-security-"),
  );
  const record = { directory, hosts: [] as DenoSyncSecurityHost[] };
  fixtures.push(record);
  let lease: object | undefined = {};
  const wrapping = vi.fn(async (_vaultId: string, create: boolean) => {
    expect(create).toBeTypeOf("boolean");
    return {
      provider: "os-credential-store" as const,
      keyId: "fixture:profile:sync",
      wrappingKeyBase64: btoa("k".repeat(32)),
    };
  });
  const create = () => {
    const host = new DenoSyncSecurityHost({
      userDataPath: directory,
      getProfileLease: (vaultId) => (vaultId === "profile" ? lease : undefined),
      getWrappingKey: wrapping,
      securityOptions: {
        argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 },
      },
    });
    record.hosts.push(host);
    return host;
  };
  return {
    directory,
    wrapping,
    create,
    replaceLease: (next: object | undefined) => {
      lease = next;
    },
  };
}

async function open(host: DenoSyncSecurityHost, runtimeId = "runtime-1") {
  return host.handle("desktop_sync_security_open", {
    vaultId: "profile",
    pluginId: "sync",
    runtimeId,
  }) as Promise<{ sessionToken: string }>;
}
async function call(
  host: DenoSyncSecurityHost,
  sessionToken: string,
  group: string,
  method: string,
  args: unknown[] = [],
  passphrase?: string,
) {
  return decodeSyncValue(
    (await host.handle("desktop_sync_security_call", {
      sessionToken,
      group,
      method,
      args: encodeSyncValue(args),
      passphrase,
    })) as string,
  ) as any;
}

it("keeps new-vault enrollment explicit and does not retrieve OS material for status", async () => {
  const { create, wrapping } = await fixture();
  const host = create(),
    session = await open(host);
  expect(
    (await call(host, session.sessionToken, "crypto", "status")).state,
  ).toBe("unenrolled");
  await expect(
    call(host, session.sessionToken, "crypto", "requestUnlock"),
  ).rejects.toThrow();
  expect(wrapping).not.toHaveBeenCalled();
});

it("recovers native credentials and ciphertext after host recreation without returning keys", async () => {
  const { create, wrapping, directory } = await fixture();
  const first = create(),
    session = await open(first);
  const enrolled = await call(
    first,
    session.sessionToken,
    "crypto",
    "enrollNewVault",
    [{ deviceAlias: "Desktop" }],
  );
  const encrypted = await call(
    first,
    session.sessionToken,
    "crypto",
    "encryptObject",
    [
      {
        epoch: 1,
        type: "local-state",
        plaintext: new TextEncoder().encode("private note and filename.md"),
      },
    ],
  );
  expect(encrypted.bytes).toBeInstanceOf(Uint8Array);
  expect(enrolled).not.toHaveProperty("wrappingKeyBase64");
  await first.closeAll();
  const next = create(),
    reopened = await open(next, "runtime-2");
  expect(
    (await call(next, reopened.sessionToken, "crypto", "status")).state,
  ).toBe("locked");
  const unlocked = await call(
    next,
    reopened.sessionToken,
    "crypto",
    "requestUnlock",
  );
  expect(unlocked.devicePublicKey).toBe(enrolled.devicePublicKey);
  const bytes = await call(
    next,
    reopened.sessionToken,
    "crypto",
    "decryptObject",
    [{ epoch: 1, type: "local-state", envelope: encrypted.bytes }],
  );
  expect(new TextDecoder().decode(bytes)).toBe("private note and filename.md");
  expect(wrapping.mock.calls.map((args) => args[1])).toEqual([true, false]);
  for (const file of await readdir(join(directory, "sync-security"))) {
    const disk = (
      await readFile(join(directory, "sync-security", file))
    ).toString();
    expect(disk).not.toMatch(
      /private note|filename\.md|deviceSecretHex|wrappingKeyBase64/,
    );
  }
});

it("binds sessions to an admitted profile and one Sync runtime", async () => {
  const { create, wrapping } = await fixture();
  const host = create();
  await expect(
    host.handle("desktop_sync_security_open", {
      vaultId: "missing",
      pluginId: "sync",
      runtimeId: "r",
    }),
  ).rejects.toThrow(/profile/i);
  await expect(
    host.handle("desktop_sync_security_open", {
      vaultId: "profile",
      pluginId: "nostr-sync",
      runtimeId: "r",
    }),
  ).rejects.toThrow(/plugin/i);
  const session = await open(host);
  expect(await open(host)).toEqual(session);
  await expect(open(host, "another-runtime")).rejects.toThrow(/runtime/i);
  await expect(call(host, "wrong-token", "crypto", "status")).rejects.toThrow(
    /session/i,
  );
  await expect(
    call(host, session.sessionToken, "crypto", "constructor"),
  ).rejects.toThrow(/operation/i);
  expect(wrapping).not.toHaveBeenCalled();
});

it("serializes competing enrollment without replacing the OS wrapping key", async () => {
  const { create, wrapping } = await fixture();
  const host = create(),
    session = await open(host);
  const results = await Promise.allSettled(
    [1, 2].map(() =>
      call(host, session.sessionToken, "crypto", "enrollNewVault", [
        { deviceAlias: "Desktop" },
      ]),
    ),
  );
  expect(results.map((r) => r.status).sort()).toEqual([
    "fulfilled",
    "rejected",
  ]);
  expect(wrapping).toHaveBeenCalledExactlyOnceWith("profile", true);
});

it("drains a committed enrollment on close and rejects its late result", async () => {
  const { create } = await fixture();
  const host = create(),
    session = await open(host);
  await call(host, session.sessionToken, "crypto", "status");
  const original = NativeSyncSecurityStore.prototype.transactMeta;
  let release!: () => void;
  const hold = new Promise<void>((done) => {
    release = done;
  });
  let committed!: () => void;
  const durable = new Promise<void>((done) => {
    committed = done;
  });
  const transaction = vi
    .spyOn(NativeSyncSecurityStore.prototype, "transactMeta")
    .mockImplementationOnce(async function (input) {
      const result = await original.call(this, input);
      committed();
      await hold;
      return result;
    });
  const enrolling = call(
    host,
    session.sessionToken,
    "crypto",
    "enrollNewVault",
    [{ deviceAlias: "Desktop" }],
  );
  const outcome = enrolling.then(
    () => null,
    (error: unknown) => error,
  );
  await durable;
  const closing = host.handle("desktop_sync_security_close", session);
  const closingAgain = host.handle("desktop_sync_security_close", session);
  let closed = false;
  void closing.then(() => {
    closed = true;
  });
  let duplicateClosed = false;
  void closingAgain.then(() => {
    duplicateClosed = true;
  });
  await Promise.resolve();
  expect(closed).toBe(false);
  expect(duplicateClosed).toBe(false);
  await expect(
    call(host, session.sessionToken, "crypto", "status"),
  ).rejects.toThrow(/session/i);
  release();
  expect(await outcome).toBeInstanceOf(Error);
  await Promise.all([closing, closingAgain]);
  transaction.mockRestore();
  const next = await open(host, "next-runtime");
  expect((await call(host, next.sessionToken, "crypto", "status")).state).toBe(
    "locked",
  );
  await call(host, next.sessionToken, "crypto", "requestUnlock");
});

it("invalidates a replaced profile lease and refuses new work after shutdown", async () => {
  const { create, replaceLease } = await fixture();
  const host = create(),
    session = await open(host);
  replaceLease({});
  await expect(
    call(host, session.sessionToken, "crypto", "status"),
  ).rejects.toThrow(/profile|session/i);
  await host.closeInactiveProfiles();
  const next = await open(host, "new-runtime");
  expect(next.sessionToken).not.toBe(session.sessionToken);
  await host.closeAll();
  await expect(open(host)).rejects.toThrow(/closed/i);
});

it("routes identity, membership, pairing and encrypted recovery through native custody", async () => {
  const { create } = await fixture();
  const host = create(),
    session = await open(host);
  await call(host, session.sessionToken, "crypto", "enrollNewVault", [
    { deviceAlias: "Desktop" },
  ]);
  expect(
    (await call(host, session.sessionToken, "syncIdentity", "status")).state,
  ).toBe("active");
  const membership = await call(
    host,
    session.sessionToken,
    "membership",
    "getSnapshot",
  );
  expect(membership.devices).toHaveLength(1);
  const pairing = await call(
    host,
    session.sessionToken,
    "pairing",
    "beginOwner",
    [{ delivery: "host" }],
  );
  expect(pairing.delivery).toBe("host");
  expect(pairing.relayUrls).toEqual([]);
  const bundle = await call(
    host,
    session.sessionToken,
    "recovery",
    "exportBundle",
    [{ metadata: { note: "private recovery metadata" } }],
    "test recovery phrase",
  );
  expect(bundle).toBeInstanceOf(Uint8Array);
  expect(new TextDecoder().decode(bundle)).not.toMatch(
    /private recovery|test recovery phrase|deviceSecretHex/,
  );
});

it("keeps backend error content out of the RPC response and never falls back", async () => {
  const { create, wrapping } = await fixture();
  const host = create(),
    session = await open(host);
  wrapping.mockRejectedValueOnce(new Error("private secret from backend"));
  await expect(
    call(host, session.sessionToken, "crypto", "enrollNewVault", [
      { deviceAlias: "Desktop" },
    ]),
  ).rejects.toThrow("Native Sync security operation failed");
  expect(
    (await call(host, session.sessionToken, "crypto", "status")).state,
  ).toBe("unenrolled");
});

it("sanitizes close failures and keeps the failed profile closed to new writers", async () => {
  const { create } = await fixture();
  const host = create(),
    session = await open(host);
  await call(host, session.sessionToken, "crypto", "status");
  const original = NativeSyncSecurityStore.prototype.close;
  const close = vi
    .spyOn(NativeSyncSecurityStore.prototype, "close")
    .mockImplementationOnce(async function () {
      await original.call(this);
      throw new Error("private backend diagnostics");
    });
  try {
    await expect(
      host.handle("desktop_sync_security_close", session),
    ).rejects.toThrow("Native Sync session cleanup failed");
    await expect(open(host, "next-runtime")).rejects.toThrow(
      "Native Sync session cleanup failed",
    );
  } finally {
    close.mockRestore();
  }
});
