import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { argon2idAsync } from "@noble/hashes/argon2.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, randomBytes } from "@noble/hashes/utils.js";
import { getPublicKey, verifyEvent } from "nostr-tools/pure";
import { describe, expect, it, vi } from "vitest";
import { SyncHostService } from "../sync-host";
import type { SyncHostServiceOptions } from "../sync-host";
import type {
  SyncCryptoEnrollmentRequest,
  SyncCryptoStatus,
} from "../sync-host-security";
import { MemoryAppDatabase, MemoryVaultAdapter, Vault } from "../storage";

async function createHarness(
  seed: Record<string, string> = {},
  options: SyncHostServiceOptions = {},
) {
  let now = 100;
  const database = new MemoryAppDatabase("sync-host-test");
  await database.open();
  const vault = new Vault(
    new MemoryVaultAdapter(seed, {
      vaultId: "sync-host-test",
      clock: () => ++now,
    }),
  );
  const service = new SyncHostService(database, vault, () => ++now, options);
  await service.ready();
  return { database, vault, service };
}

function textStream(value: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(value));
      controller.close();
    },
  });
}

async function createPairingOwnerFixture() {
  const fixture = await createHarness(
    {},
    { security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } } },
  );
  await fixture.service.enrollPluginCrypto(
    "pairing-test",
    "delivery fixture passphrase",
  );
  const host = fixture.service.forPlugin("pairing-test", ["crypto:nostr-sync"]);
  return { ...fixture, host };
}

describe("SyncHostService", () => {
  it.each([
    {
      name: "host with relay addresses",
      input: { delivery: "host", relayUrls: ["wss://relay.example"] },
      error: /host.*relay/i,
    },
    {
      name: "host with an explicit empty relay list",
      input: { delivery: "host", relayUrls: [] },
      error: /host.*relay/i,
    },
    {
      name: "unknown delivery mode",
      input: { delivery: "unknown", relayUrls: ["wss://relay.example"] },
      error: /unsupported.*delivery/i,
    },
    {
      name: "null delivery mode",
      input: { delivery: null, relayUrls: ["wss://relay.example"] },
      error: /unsupported.*delivery/i,
    },
    {
      name: "empty relay mode",
      input: { relayUrls: [] },
      error: /one and eight relay/i,
    },
  ])("rejects ambiguous pairing delivery: $name", async ({ input, error }) => {
    const { host } = await createPairingOwnerFixture();
    await expect(host.pairing.beginOwner(input as never)).rejects.toThrow(
      error,
    );
  });

  it.each(["relay", "host"] as const)(
    "requires matching explicit delivery for %s invitations",
    async (delivery) => {
      const { host: owner } = await createPairingOwnerFixture();
      const begun = await owner.pairing.beginOwner(
        delivery === "host"
          ? { delivery }
          : { relayUrls: ["wss://relay.example"] },
      );
      const memberHarness = await createHarness();
      const member = memberHarness.service.forPlugin("pairing-test", [
        "crypto:nostr-sync",
      ]);
      await expect(
        member.pairing.acceptInvite({
          invitationUri: begun.invitationUri!,
          deviceAlias: "Member",
          ...(delivery === "relay" ? { delivery: "host" as const } : {}),
        }),
      ).rejects.toThrow(/relay/i);
      expect((await member.crypto.status()).state).toBe("unenrolled");
      const accepted = await member.pairing.acceptInvite({
        invitationUri: begun.invitationUri!,
        deviceAlias: "Member",
        ...(delivery === "host" ? { delivery } : {}),
      });
      expect(accepted.session.sessionId).toBe(begun.session.sessionId);
      expect(accepted.session.state).toBe("waiting-for-sas");
      expect(accepted.delivery).toBe(delivery);
    },
  );
  it("reports independent installed key epochs only while unlocked", async () => {
    const { service } = await createHarness(
      {},
      { security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } } },
    );
    const host = service.forPlugin("sync-a", ["crypto:nostr-sync"]);
    expect((await host.crypto.status()).installedEpochs).toBeUndefined();
    await service.enrollPluginCrypto("sync-a", "epoch listing fixture");
    const status = await host.crypto.status();
    expect(status.installedEpochs).toEqual([1]);
    status.installedEpochs!.push(99);
    expect((await host.crypto.status()).installedEpochs).toEqual([1]);
    service.lockPluginCrypto("sync-a");
    expect((await host.crypto.status()).installedEpochs).toBeUndefined();
    await service.unlockPluginCrypto("sync-a", "epoch listing fixture");
    expect((await host.crypto.status()).installedEpochs).toEqual([1]);
  });
  it("preserves identity across edits and renames but not delete and recreate", async () => {
    const { vault, service } = await createHarness({ "notes/a.md": "one" });
    const host = service.forPlugin("sync-a");
    const initial = await host.files.getIdentity("notes/a.md");
    expect(initial).toMatchObject({
      currentPath: "notes/a.md",
      state: "present",
      contentGeneration: 1,
    });

    const file = vault.getFileByPath("notes/a.md")!;
    await vault.modify(file, "two");
    await service.ready();
    const edited = await host.files.getIdentity("notes/a.md");
    expect(edited?.fileId).toBe(initial?.fileId);
    expect(edited?.contentGeneration).toBe(2);

    await vault.rename(vault.getFileByPath("notes/a.md")!, "archive/a.md");
    await service.ready();
    const renamed = await host.files.getIdentity("archive/a.md");
    expect(renamed?.fileId).toBe(initial?.fileId);
    expect(await host.files.getIdentity("notes/a.md")).toBeNull();

    await vault.delete(vault.getFileByPath("archive/a.md")!);
    await service.ready();
    await expect(
      host.files.resolveIdentity(initial!.fileId),
    ).resolves.toMatchObject({
      state: "tombstoned",
    });
    await vault.create("archive/a.md", "two");
    await service.ready();
    const recreated = await host.files.getIdentity("archive/a.md");
    expect(recreated?.fileId).not.toBe(initial?.fileId);
  });

  it.each(["open", "stream"] as const)(
    "reconciles files removed during startup fingerprinting (%s)",
    async (boundary) => {
      const database = new MemoryAppDatabase(`sync-host-missing-${boundary}`);
      await database.open();
      const missingPath = ".lapis/plugins/ai/manifest.json";
      const adapter = new MemoryVaultAdapter({
        [missingPath]: '{"id":"ai"}',
        "remaining.md": "keep tracking",
      });
      const openRead = adapter.openRead.bind(adapter);
      vi.spyOn(adapter, "openRead").mockImplementation(async (path) => {
        if (path !== missingPath) return openRead(path);
        await adapter.remove(path);
        const error = Object.assign(new Error(`ENOENT: ${path}`), {
          code: "ENOENT",
        });
        if (boundary === "open") throw error;
        return {
          size: 11,
          mtime: 0,
          stream: () =>
            new ReadableStream({
              start(controller) {
                controller.error(error);
              },
            }),
        };
      });
      const service = new SyncHostService(database, new Vault(adapter));
      await expect(service.ready()).resolves.toBeUndefined();
      const host = service.forPlugin("sync-a");
      await expect(host.files.getIdentity(missingPath)).resolves.toBeNull();
      await expect(
        host.files.getIdentity("remaining.md"),
      ).resolves.toMatchObject({
        state: "present",
        contentFingerprint: bytesToHex(
          sha256(new TextEncoder().encode("keep tracking")),
        ),
      });
      const changes = await host.files.listChangedSince();
      expect(changes.changes.map((change) => change.file.currentPath)).toEqual([
        "remaining.md",
      ]);
    },
  );

  it("preserves unexpected startup fingerprint errors", async () => {
    const database = new MemoryAppDatabase("sync-host-read-denied");
    await database.open();
    const adapter = new MemoryVaultAdapter({ "denied.md": "private" });
    const denied = Object.assign(new Error("read denied"), { code: "EACCES" });
    vi.spyOn(adapter, "openRead").mockRejectedValue(denied);
    const service = new SyncHostService(database, new Vault(adapter));
    await expect(service.ready()).rejects.toBe(denied);
  });

  it("recovers one offline rename by strong fingerprint but never merges ambiguous copies", async () => {
    let now = 1_000;
    const database = new MemoryAppDatabase("sync-host-reconcile");
    await database.open();
    const adapter = new MemoryVaultAdapter(
      { "a.md": "same bytes", "copy.md": "same bytes" },
      { vaultId: "sync-host-reconcile", clock: () => ++now },
    );
    const firstService = new SyncHostService(
      database,
      new Vault(adapter),
      () => ++now,
    );
    await firstService.ready();
    const first = firstService.forPlugin("sync-a");
    const a = (await first.files.getIdentity("a.md"))!;
    const copy = (await first.files.getIdentity("copy.md"))!;
    expect(a.fileId).not.toBe(copy.fileId);
    const cursor = (await first.files.listChangedSince()).nextCursor;

    await adapter.rename("a.md", "renamed.md");
    const renamedService = new SyncHostService(
      database,
      new Vault(adapter),
      () => ++now,
    );
    await renamedService.ready();
    const renamed = renamedService.forPlugin("sync-a");
    expect((await renamed.files.getIdentity("renamed.md"))?.fileId).toBe(
      a.fileId,
    );
    await expect(renamed.files.listChangedSince(cursor)).resolves.toMatchObject(
      {
        changes: [
          expect.objectContaining({
            kind: "rename",
            previousPath: "a.md",
            file: expect.objectContaining({ fileId: a.fileId }),
          }),
        ],
      },
    );

    await adapter.remove("renamed.md");
    await adapter.remove("copy.md");
    await adapter.write("ambiguous.md", "same bytes");
    const ambiguousService = new SyncHostService(
      database,
      new Vault(adapter),
      () => ++now,
    );
    await ambiguousService.ready();
    const ambiguous = ambiguousService.forPlugin("sync-a");
    const candidate = await ambiguous.files.getIdentity("ambiguous.md");
    expect(candidate?.fileId).not.toBe(a.fileId);
    expect(candidate?.fileId).not.toBe(copy.fileId);
  });

  it("coalesces missed file changes behind a generation-scoped cursor", async () => {
    const { database, vault, service } = await createHarness({ "a.md": "a" });
    const host = service.forPlugin("sync-a");
    const initial = await host.files.listChangedSince();
    const cursor = initial.nextCursor;
    const fileId = (await host.files.getIdentity("a.md"))!.fileId;

    for (const value of ["ab", "abc", "abcd"]) {
      await vault.modify(vault.getFileByPath("a.md")!, value);
    }
    await service.ready();
    const changed = await host.files.listChangedSince(cursor);
    expect(changed.status).toBe("ok");
    expect(changed.changes).toHaveLength(1);
    expect(changed.changes[0]?.file).toMatchObject({
      fileId,
      contentGeneration: 4,
    });

    await database.setMeta("sync-host:v1:database-generation", "replacement");
    await expect(
      host.files.listChangedSince(changed.nextCursor),
    ).resolves.toMatchObject({
      status: "reset-required",
      databaseGenerationId: "replacement",
      nextCursor: { sequence: 0 },
    });
  });

  it("isolates bindings and commits generated state with optimistic revisions", async () => {
    const { service } = await createHarness({ "a.md": "a" });
    const first = service.forPlugin("sync-a");
    const second = service.forPlugin("sync-b");
    const identity = (await first.files.getIdentity("a.md"))!;

    await expect(
      first.files.bindExternalIdentity(identity.fileId, "remote-a"),
    ).resolves.toMatchObject({
      namespace: "sync-a",
      localFileId: identity.fileId,
    });
    await expect(
      first.files.getExternalBinding("remote-a"),
    ).resolves.toMatchObject({
      localFileId: identity.fileId,
    });
    await expect(
      second.files.getExternalBinding("remote-a"),
    ).resolves.toBeNull();

    await expect(
      first.generatedState.transact({
        expectedRevision: 0,
        expectedSchemaVersion: 0,
        schemaVersion: 1,
        mutations: [
          { type: "set", key: "outbox/revision-1", value: { state: "queued" } },
          { type: "set", key: "cursor", value: { sequence: 4 } },
        ],
      }),
    ).resolves.toEqual({ applied: true, revision: 1, schemaVersion: 1 });
    await expect(
      first.generatedState.transact({
        expectedRevision: 0,
        mutations: [{ type: "delete", key: "cursor" }],
      }),
    ).resolves.toEqual({ applied: false, revision: 1, schemaVersion: 1 });
    await expect(
      first.generatedState.scan({ prefix: "outbox/" }),
    ).resolves.toMatchObject({
      records: [
        {
          key: "outbox/revision-1",
          value: { state: "queued" },
          version: 1,
        },
      ],
    });
    await expect(second.generatedState.get("cursor")).resolves.toBeNull();

    service.revokePlugin("sync-a");
    await expect(first.generatedState.get("cursor")).rejects.toThrow(/revoked/);
  });

  it("fails closed when a runtime was not granted a sync-host capability", async () => {
    const { service } = await createHarness({ "a.md": "a" });
    const host = service.forPlugin("limited", ["metadata:identity"]);

    await expect(host.files.getIdentity("a.md")).resolves.toMatchObject({
      currentPath: "a.md",
    });
    await expect(host.files.listChangedSince()).rejects.toThrow(
      /not granted metadata:changes/,
    );
    await expect(host.crypto.status()).rejects.toThrow(
      /not granted crypto:nostr-sync/,
    );
    await expect(host.generatedState.get("cursor")).rejects.toThrow(
      /not granted plugin:generated-state/,
    );
  });

  it("classifies an opaque origin only for its active plugin runtime", async () => {
    const { vault, service } = await createHarness({ "a.md": "a" });
    const first = service.forPlugin("sync-a");
    const second = service.forPlugin("sync-b");
    const before = await first.files.listChangedSince();
    const origin = await first.origins.create();
    const file = vault.getFileByPath("a.md")!;

    await expect(
      second.vault.atomicWrite("a.md", textStream("forged"), { origin }),
    ).rejects.toThrow(/belongs to another plugin runtime/);

    await service.recordOriginatedChange("sync-a", origin, "modify", file);
    await expect(
      first.files.listChangedSince(before.nextCursor),
    ).resolves.toMatchObject({
      changes: [{ selfOriginated: true }],
    });
    await expect(
      second.files.listChangedSince(before.nextCursor),
    ).resolves.toMatchObject({
      changes: [{ selfOriginated: false }],
    });

    service.revokePlugin("sync-a");
    const restarted = service.forPlugin("sync-a");
    await expect(
      restarted.files.listChangedSince(before.nextCursor),
    ).resolves.toMatchObject({ changes: [{ selfOriginated: true }] });
  });

  it("streams ranges and atomically applies guarded self-originated writes", async () => {
    const { vault, service } = await createHarness({ "data.bin": "abcdef" });
    const host = service.forPlugin("sync-a");
    const before = await host.files.listChangedSince();
    const identity = (await host.files.getIdentity("data.bin"))!;
    const read = await host.vault.openRead("data.bin");
    const range = await new Response(
      read.stream({ offset: 1, length: 3 }),
    ).arrayBuffer();
    expect(new TextDecoder().decode(range)).toBe("bcd");
    expect(read).toMatchObject({
      size: 6,
      fileId: identity.fileId,
      contentGeneration: identity.contentGeneration,
    });

    await expect(
      host.vault.atomicWrite("data.bin", textStream("blocked"), {
        expectedFileId: identity.fileId,
        expectedContentGeneration: identity.contentGeneration + 1,
      }),
    ).rejects.toThrow(/generation changed/);
    await expect(vault.read(vault.getFileByPath("data.bin")!)).resolves.toBe(
      "abcdef",
    );

    const origin = await host.origins.create();
    const written = await host.vault.atomicWrite(
      "data.bin",
      textStream("replacement"),
      {
        origin,
        expectedFileId: identity.fileId,
        expectedContentGeneration: identity.contentGeneration,
      },
    );
    expect(written).toMatchObject({
      fileId: identity.fileId,
      contentGeneration: identity.contentGeneration + 1,
    });
    await expect(vault.read(vault.getFileByPath("data.bin")!)).resolves.toBe(
      "replacement",
    );
    await expect(
      host.files.listChangedSince(before.nextCursor),
    ).resolves.toMatchObject({
      changes: [{ selfOriginated: true }],
    });

    const removed = await host.vault.remove("data.bin", {
      origin,
      expectedFileId: written.fileId,
      expectedContentGeneration: written.contentGeneration,
    });
    expect(removed).toMatchObject({
      fileId: identity.fileId,
      state: "tombstoned",
    });
  });

  it("keeps sync keys behind a lockable versioned crypto capability", async () => {
    const { database, service } = await createHarness(
      {},
      {
        security: {
          argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 },
        },
      },
    );
    const host = service.forPlugin("sync-a");
    await expect(host.crypto.status()).resolves.toMatchObject({
      state: "unenrolled",
    });
    await expect(
      service.enrollPluginCrypto("sync-a", "correct horse battery staple"),
    ).resolves.toMatchObject({ state: "unlocked" });

    const first = await host.crypto.encryptObject({
      epoch: 1,
      type: "file-content",
      plaintext: new TextEncoder().encode("secret note"),
    });
    const second = await host.crypto.encryptObject({
      epoch: 1,
      type: "file-content",
      plaintext: new TextEncoder().encode("secret note"),
    });
    expect(first.objectHash).not.toBe(second.objectHash);
    const decrypted = await host.crypto.decryptObject({
      epoch: 1,
      type: "file-content",
      envelope: first.bytes,
    });
    expect(new TextDecoder().decode(decrypted)).toBe("secret note");
    await expect(
      host.crypto.decryptObject({
        epoch: 1,
        type: "file-manifest",
        envelope: first.bytes,
      }),
    ).rejects.toThrow(/envelope is invalid/);
    await expect(
      host.crypto.encryptObject({
        epoch: 1,
        type: "file-content",
        plaintext: new Uint8Array(32 * 1024 * 1024 + 1),
      }),
    ).rejects.toThrow(/exceeds/);
    const contentId = await host.crypto.calculateContentId({
      epoch: 1,
      plaintext: new TextEncoder().encode("secret note"),
    });
    await expect(
      host.crypto.calculateContentId({
        epoch: 1,
        plaintext: new TextEncoder().encode("secret note"),
      }),
    ).resolves.toBe(contentId);
    const signed = await host.crypto.signDeviceEvent({
      kind: 78,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["d", "opaque"]],
      content: "encrypted",
    });
    expect(verifyEvent(signed)).toBe(true);
    const syncStatus = await host.syncIdentity.status();
    expect(syncStatus).toMatchObject({
      state: "active",
      generation: 1,
      canRotate: true,
    });
    expect(syncStatus.publicKey).not.toBe(signed.pubkey);
    const transported = await host.syncIdentity.signEvent({
      purpose: "transport",
      event: {
        kind: 78,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["d", "opaque"]],
        content: signed.content,
      },
    });
    expect(verifyEvent(transported)).toBe(true);
    expect(transported.pubkey).toBe(syncStatus.publicKey);

    const stored = await database.scanMeta({
      prefix: "sync-host:v1:security:crypto:",
    });
    expect(stored.entries).toHaveLength(1);
    expect(stored.entries[0]?.value).toMatchObject({
      version: 3,
      kdf: { name: "argon2id" },
      publicKey: signed.pubkey,
      role: "owner",
      currentEpoch: 1,
      membershipGeneration: 1,
    });
    expect(JSON.stringify(stored.entries[0]?.value)).not.toMatch(
      /vaultKey|deviceSecret|ownerSecret|recoverySecret|syncSecret/,
    );

    service.lockPluginCrypto("sync-a");
    await expect(host.crypto.getDevicePublicKey()).rejects.toThrow(/locked/);
    await expect(
      service.unlockPluginCrypto("sync-a", "wrong passphrase"),
    ).rejects.toThrow(/unlock failed/);
    await expect(
      service.unlockPluginCrypto("sync-a", "correct horse battery staple"),
    ).resolves.toMatchObject({ state: "unlocked", publicKey: signed.pubkey });

    const wrappingKey = new Uint8Array(32).fill(9);
    await expect(
      service.enrollPluginCryptoWithWrappingKey("sync-b", wrappingKey, {
        name: "external",
        provider: "webauthn-prf",
        keyId: "credential-1",
      }),
    ).resolves.toMatchObject({ state: "unlocked" });
    service.lockPluginCrypto("sync-b");
    await expect(
      service.unlockPluginCryptoWithWrappingKey(
        "sync-b",
        new Uint8Array(32).fill(8),
      ),
    ).rejects.toThrow(/unlock failed/);
    await expect(
      service.unlockPluginCryptoWithWrappingKey("sync-b", wrappingKey),
    ).resolves.toMatchObject({ state: "unlocked" });
  });

  it("encrypts durable local sync state with a separate authenticated purpose", async () => {
    const { service } = await createHarness(
      {},
      { security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } } },
    );
    await service.enrollPluginCrypto("sync-a", "local repository passphrase");
    const host = service.forPlugin("sync-a");
    const plaintext = new TextEncoder().encode(
      '{"private-path.md":"private merge decision"}',
    );
    const state = await host.crypto.encryptObject({
      epoch: 1,
      type: "local-state",
      plaintext,
    });
    expect(state.bytes[1]).toBe(8);
    const decrypted = await host.crypto.decryptObject({
      epoch: 1,
      type: "local-state",
      envelope: state.bytes,
    });
    expect([...decrypted]).toEqual([...plaintext]);
    await expect(
      host.crypto.decryptObject({
        epoch: 1,
        type: "revision-archive",
        envelope: state.bytes,
      }),
    ).rejects.toThrow(/invalid/);
    await expect(
      host.crypto.decryptObject({
        epoch: 2,
        type: "local-state",
        envelope: state.bytes,
      }),
    ).rejects.toThrow();
    expect(new TextDecoder().decode(state.bytes)).not.toContain(
      "private-path.md",
    );
  });

  it("migrates a v1 envelope without re-encrypting existing epoch-one objects", async () => {
    const database = new MemoryAppDatabase("sync-host-v1-migration");
    await database.open();
    const passphrase = "legacy wrapping passphrase";
    const salt = new Uint8Array(16).fill(3);
    const wrappingKey = await argon2idAsync(
      new TextEncoder().encode(passphrase),
      salt,
      { t: 1, m: 32, p: 1, dkLen: 32 },
    );
    const vaultKey = randomBytes(32);
    const deviceSecret = randomBytes(32);
    const plaintext = new Uint8Array(64);
    plaintext.set(vaultKey);
    plaintext.set(deviceSecret, 32);
    const nonce = new Uint8Array(24).fill(7);
    const ciphertext = xchacha20poly1305(
      wrappingKey,
      nonce,
      new TextEncoder().encode("lapis-sync-envelope:nostr-sync:v1"),
    ).encrypt(plaintext);
    await database.setMeta("sync-host:v1:security:crypto:nostr-sync", {
      version: 1,
      suite: "lapis-sync-v1-xchacha20poly1305-schnorr",
      kdf: {
        name: "argon2id",
        timeCost: 1,
        memoryKiB: 32,
        parallelism: 1,
        dkLen: 32,
        saltHex: bytesToHex(salt),
      },
      nonceHex: bytesToHex(nonce),
      ciphertextHex: bytesToHex(ciphertext),
      publicKey: getPublicKey(deviceSecret),
    });
    plaintext.fill(0);
    wrappingKey.fill(0);

    const objectPlaintext = new TextEncoder().encode("legacy encrypted note");
    const objectNonce = new Uint8Array(24).fill(9);
    const objectCiphertext = xchacha20poly1305(
      hkdf(
        sha256,
        vaultKey,
        undefined,
        new TextEncoder().encode("lapis-sync-v1:file-content:epoch:1"),
        32,
      ),
      objectNonce,
      new TextEncoder().encode("lapis-sync-v1:file-content:1"),
    ).encrypt(objectPlaintext);
    const objectEnvelope = new Uint8Array(2 + 24 + objectCiphertext.length);
    objectEnvelope[0] = 1;
    objectEnvelope[1] = 1;
    objectEnvelope.set(objectNonce, 2);
    objectEnvelope.set(objectCiphertext, 26);
    vaultKey.fill(0);
    deviceSecret.fill(0);

    const vault = new Vault(
      new MemoryVaultAdapter({}, { vaultId: "sync-host-v1-migration" }),
    );
    const service = new SyncHostService(database, vault, Date.now, {
      security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } },
    });
    await service.ready();
    const host = service.forPlugin("nostr-sync");
    await expect(
      service.unlockPluginCrypto("nostr-sync", passphrase),
    ).resolves.toMatchObject({
      state: "unlocked",
      role: "owner",
      currentEpoch: 1,
    });
    const migrated = await database.getMeta<{ version: number }>(
      "sync-host:v1:security:crypto:nostr-sync",
    );
    expect(migrated?.version).toBe(3);
    const decrypted = await host.crypto.decryptObject({
      epoch: 1,
      type: "file-content",
      envelope: objectEnvelope,
    });
    expect(new TextDecoder().decode(decrypted)).toBe("legacy encrypted note");
  });

  it("migrates a v2 keyring into setup-required Sync Identity state", async () => {
    const pluginId = "nostr-sync-v2";
    const database = new MemoryAppDatabase("sync-host-v2-migration");
    await database.open();
    const passphrase = "v2 wrapping passphrase";
    const salt = new Uint8Array(16).fill(4);
    const wrappingKey = await argon2idAsync(
      new TextEncoder().encode(passphrase),
      salt,
      { t: 1, m: 32, p: 1, dkLen: 32 },
    );
    const deviceSecret = randomBytes(32);
    const ownerSecret = randomBytes(32);
    const recoverySecret = randomBytes(32);
    const vaultKey = randomBytes(32);
    const devicePublicKey = getPublicKey(deviceSecret);
    const ownerPublicKey = getPublicKey(ownerSecret);
    const recoveryPublicKey = getPublicKey(recoverySecret);
    const vaultId = bytesToHex(randomBytes(16));
    const material = {
      schemaVersion: 2,
      vaultId,
      deviceAlias: "Legacy owner",
      role: "owner",
      currentEpoch: 1,
      membershipGeneration: 1,
      vaultKeys: { "1": bytesToHex(vaultKey) },
      deviceSecretHex: bytesToHex(deviceSecret),
      ownerSecretHex: bytesToHex(ownerSecret),
      ownerPublicKey,
      recoverySecretHex: bytesToHex(recoverySecret),
      recoveryPublicKey,
      membership: {
        schemaVersion: 1,
        vaultId,
        ownerPublicKey,
        generation: 1,
        currentEpoch: 1,
        devices: [
          {
            publicKey: devicePublicKey,
            alias: "Legacy owner",
            role: "owner",
            state: "active",
            addedAt: 1,
          },
        ],
      },
    };
    const nonce = new Uint8Array(24).fill(8);
    const ciphertext = xchacha20poly1305(
      wrappingKey,
      nonce,
      new TextEncoder().encode(`lapis-sync-envelope:${pluginId}:v2`),
    ).encrypt(new TextEncoder().encode(JSON.stringify(material)));
    await database.setMeta(`sync-host:v1:security:crypto:${pluginId}`, {
      version: 2,
      suite: "lapis-sync-v1-xchacha20poly1305-schnorr",
      kdf: {
        name: "argon2id",
        timeCost: 1,
        memoryKiB: 32,
        parallelism: 1,
        dkLen: 32,
        saltHex: bytesToHex(salt),
      },
      nonceHex: bytesToHex(nonce),
      ciphertextHex: bytesToHex(ciphertext),
      publicKey: devicePublicKey,
      vaultId,
      deviceAlias: "Legacy owner",
      role: "owner",
      deviceState: "active",
      currentEpoch: 1,
      membershipGeneration: 1,
      ownerPublicKey,
      recoveryPublicKey,
    });
    wrappingKey.fill(0);
    deviceSecret.fill(0);
    ownerSecret.fill(0);
    recoverySecret.fill(0);
    vaultKey.fill(0);

    const vault = new Vault(
      new MemoryVaultAdapter({}, { vaultId: "sync-host-v2-migration" }),
    );
    const service = new SyncHostService(database, vault, Date.now, {
      security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } },
    });
    await service.ready();
    const host = service.forPlugin(pluginId);
    await expect(
      service.unlockPluginCrypto(pluginId, passphrase),
    ).resolves.toMatchObject({
      state: "unlocked",
      syncIdentity: { state: "setup-required", generation: 0 },
    });
    const initialized = await host.syncIdentity.initialize({
      cutoffHeads: { [devicePublicKey]: "legacy-head" },
    });
    expect(initialized.status).toMatchObject({
      state: "active",
      generation: 1,
    });
    expect(initialized.membershipEvent.kind).toBe(30_079);
    await expect(
      database.getMeta<{ version: number }>(
        `sync-host:v1:security:crypto:${pluginId}`,
      ),
    ).resolves.toMatchObject({ version: 3 });
  });

  it("requires explicit enrollment before host-controlled unlock", async () => {
    let service!: SyncHostService;
    const requestCryptoUnlock = vi.fn(
      async (
        pluginId: string,
        _status: SyncCryptoStatus,
        enrollment?: SyncCryptoEnrollmentRequest,
      ) => {
        await service.enrollPluginCrypto(
          pluginId,
          "correct horse battery staple",
          enrollment,
        );
      },
    );
    ({ service } = await createHarness(
      {},
      {
        security: {
          argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 },
        },
        requestCryptoUnlock,
      },
    ));
    const host = service.forPlugin("sync-a", ["crypto:nostr-sync"]);

    await expect(host.crypto.requestUnlock()).rejects.toThrow(
      /enrollment is required/i,
    );
    await expect(
      host.crypto.enrollNewVault({ deviceAlias: "Primary Mac" }),
    ).resolves.toMatchObject({
      state: "unlocked",
      role: "owner",
      deviceAlias: "Primary Mac",
      currentEpoch: 1,
    });
    expect(requestCryptoUnlock).toHaveBeenCalledWith(
      "sync-a",
      expect.objectContaining({ state: "unenrolled" }),
      expect.objectContaining({
        mode: "new-vault",
        deviceAlias: "Primary Mac",
      }),
    );
    expect(Object.keys(host.crypto)).not.toContain("enroll");
    expect(Object.keys(host.crypto)).not.toContain("unlock");
  });

  it("keeps remote authentication behind purpose-scoped Sync Identity signing", async () => {
    const { service } = await createHarness(
      {},
      {
        security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } },
      },
    );
    const host = service.forPlugin("nostr-sync");
    await service.enrollPluginCrypto(
      "nostr-sync",
      "correct horse battery staple",
    );
    const status = await host.crypto.status();
    const sync = await host.syncIdentity.status();
    const createdAt = Math.floor(Date.now() / 1000);

    const relayAuth = await host.syncIdentity.signEvent({
      purpose: "relay-auth",
      event: {
        kind: 22_242,
        created_at: createdAt,
        tags: [
          ["relay", "wss://relay.example"],
          ["challenge", "challenge-value"],
        ],
        content: "",
      },
    });
    const blossomAuth = await host.syncIdentity.signEvent({
      purpose: "blossom-auth",
      event: {
        kind: 24_242,
        created_at: createdAt,
        tags: [
          ["t", "upload"],
          ["expiration", String(createdAt + 60)],
          ["server", "https://blossom.example"],
          ["x", "0".repeat(64)],
        ],
        content: "Upload an encrypted Lapis object",
      },
    });
    const pairingProbe = await host.pairing.createRelayProbe();

    expect(verifyEvent(relayAuth)).toBe(true);
    expect(verifyEvent(blossomAuth)).toBe(true);
    expect(verifyEvent(pairingProbe)).toBe(true);
    expect(relayAuth.pubkey).toBe(sync.publicKey);
    expect(blossomAuth.pubkey).toBe(sync.publicKey);
    expect(relayAuth.pubkey).not.toBe(status.devicePublicKey);
    expect(pairingProbe.kind).toBe(24_134);
    expect(pairingProbe.pubkey).not.toBe(sync.publicKey);
    expect(pairingProbe.pubkey).not.toBe(status.devicePublicKey);
    await expect(
      host.syncIdentity.signEvent({
        purpose: "relay-auth",
        event: {
          kind: 78,
          created_at: createdAt,
          tags: [["d", "not-auth"]],
          content: "",
        },
      }),
    ).rejects.toThrow(/NIP-42/i);
  });

  it.each(["relay", "host"] as const)(
    "pairs a distinct member through encrypted SAS-confirmed sessions (%s)",
    async (delivery) => {
      let ownerService!: SyncHostService;
      let memberService!: SyncHostService;
      const ownerHarness = await createHarness(
        {},
        {
          security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } },
          requestCryptoUnlock: async (pluginId, _status, enrollment) => {
            await ownerService.enrollPluginCrypto(
              pluginId,
              "owner wrapping passphrase",
              enrollment,
            );
          },
        },
      );
      ownerService = ownerHarness.service;
      const memberHarness = await createHarness(
        {},
        {
          security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } },
          requestCryptoUnlock: async (pluginId, _status, enrollment) => {
            await memberService.enrollPluginCrypto(
              pluginId,
              "member wrapping passphrase",
              enrollment,
            );
          },
        },
      );
      memberService = memberHarness.service;
      const owner = ownerService.forPlugin("nostr-sync", ["crypto:nostr-sync"]);
      const member = memberService.forPlugin("nostr-sync", [
        "crypto:nostr-sync",
      ]);
      await owner.crypto.enrollNewVault({ deviceAlias: "Owner device" });
      const ownerPublicKey = await owner.crypto.getDevicePublicKey();
      const ownerSyncIdentity = await owner.syncIdentity.status();

      await expect(
        owner.pairing.beginOwner({
          relayUrls: ["wss://relay.example"],
          metadata: { value: "x".repeat(17 * 1024) },
        }),
      ).rejects.toThrow(/metadata exceeds/i);

      const begun = await owner.pairing.beginOwner({
        ...(delivery === "host"
          ? { delivery }
          : { relayUrls: ["wss://relay.example"] }),
        cutoffHeads: { [ownerPublicKey]: "head-before-pairing" },
        metadata: {
          blossomServers: ["https://blossom.example"],
          syncEnabled: true,
        },
      });
      expect(begun.invitationUri).not.toContain("blossom.example");
      const accepted = await member.pairing.acceptInvite({
        invitationUri: begun.invitationUri!,
        deviceAlias: "Member phone",
        ...(delivery === "host" ? { delivery } : {}),
      });
      expect(begun.delivery ?? "relay").toBe(delivery);
      expect(accepted.delivery ?? "relay").toBe(delivery);
      expect(accepted.relayUrls).toEqual(
        delivery === "host" ? [] : ["wss://relay.example"],
      );
      const invitation = JSON.parse(
        Buffer.from(
          new URL(begun.invitationUri!).searchParams.get("data")!,
          "base64url",
        ).toString(),
      );
      expect(Object.keys(invitation).sort()).toEqual(["e", "p", "r", "s", "v"]);
      expect(invitation.r).toEqual(accepted.relayUrls);
      const ownerHello = await owner.pairing.ingest({
        sessionId: begun.session.sessionId,
        event: accepted.outboundEvents[0]!,
      });
      await expect(
        owner.pairing.ingest({
          sessionId: begun.session.sessionId,
          event: accepted.outboundEvents[0]!,
        }),
      ).rejects.toThrow(/replayed/i);
      const memberAck = await member.pairing.ingest({
        sessionId: accepted.session.sessionId,
        event: ownerHello.outboundEvents[0]!,
      });
      expect(ownerHello.session.sas).toMatch(/^\d{6}$/u);
      expect(memberAck.session.sas).toBe(ownerHello.session.sas);
      await expect(
        member.pairing.confirm(accepted.session.sessionId, "000000"),
      ).rejects.toThrow(/SAS does not match/i);

      const memberConfirmed = await member.pairing.confirm(
        accepted.session.sessionId,
        memberAck.session.sas,
      );
      await owner.pairing.ingest({
        sessionId: begun.session.sessionId,
        event: memberConfirmed.outboundEvents[0]!,
      });
      const ownerConfirmed = await owner.pairing.confirm(
        begun.session.sessionId,
        ownerHello.session.sas,
      );
      expect(ownerConfirmed.membershipEvent?.kind).toBe(30_079);
      expect(ownerConfirmed.outboundEvents).toHaveLength(2);
      await member.pairing.ingest({
        sessionId: accepted.session.sessionId,
        event: ownerConfirmed.outboundEvents[0]!,
      });
      const transferred = await member.pairing.ingest({
        sessionId: accepted.session.sessionId,
        event: ownerConfirmed.outboundEvents[1]!,
      });
      expect(transferred.session.state).toBe("ready-to-enroll");
      expect(transferred.metadata).toEqual({
        blossomServers: ["https://blossom.example"],
        syncEnabled: true,
      });
      const completed = await member.pairing.confirm(
        accepted.session.sessionId,
      );
      expect(completed.session.state).toBe("complete");
      expect(completed.metadata).toEqual(transferred.metadata);
      await owner.pairing.ingest({
        sessionId: begun.session.sessionId,
        event: completed.outboundEvents[0]!,
      });

      const memberStatus = await member.crypto.status();
      expect(memberStatus).toMatchObject({
        state: "unlocked",
        role: "member",
        deviceAlias: "Member phone",
        membershipGeneration: 2,
        installedEpochs: [1],
        syncIdentity: {
          state: "active",
          publicKey: ownerSyncIdentity.publicKey,
          generation: 1,
        },
      });
      expect(memberStatus.publicKey).not.toBe(ownerPublicKey);
      const createdAt = Math.floor(Date.now() / 1000);
      const ownerAttestation = await owner.crypto.signDeviceEvent({
        kind: 78,
        created_at: createdAt,
        tags: [["d", "owner-revision"]],
        content: "owner payload",
      });
      const memberAttestation = await member.crypto.signDeviceEvent({
        kind: 78,
        created_at: createdAt,
        tags: [["d", "member-revision"]],
        content: "member payload",
      });
      const ownerTransport = await owner.syncIdentity.signEvent({
        purpose: "transport",
        event: {
          kind: 78,
          created_at: createdAt,
          tags: [["d", "owner-revision"]],
          content: ownerAttestation.id,
        },
      });
      const memberTransport = await member.syncIdentity.signEvent({
        purpose: "transport",
        event: {
          kind: 78,
          created_at: createdAt,
          tags: [["d", "member-revision"]],
          content: memberAttestation.id,
        },
      });
      expect(ownerAttestation.pubkey).toBe(ownerPublicKey);
      expect(memberAttestation.pubkey).toBe(memberStatus.devicePublicKey);
      expect(memberAttestation.pubkey).not.toBe(ownerAttestation.pubkey);
      expect(ownerTransport.pubkey).toBe(ownerSyncIdentity.publicKey);
      expect(memberTransport.pubkey).toBe(ownerSyncIdentity.publicKey);
      const ownerMembership = await owner.membership.getSnapshot();
      expect(ownerMembership).toMatchObject({
        generation: 2,
        devices: expect.arrayContaining([
          expect.objectContaining({ alias: "Member phone", role: "member" }),
        ]),
      });

      const pendingRotation = await owner.syncIdentity.beginRotation();
      expect(pendingRotation).toMatchObject({ state: "rotation-pending" });
      expect(pendingRotation.pendingPublicKey).not.toBe(
        ownerSyncIdentity.publicKey,
      );
      const pendingProbe = await owner.syncIdentity.signEvent({
        purpose: "connection-probe",
        identity: "pending",
        event: {
          kind: 78,
          created_at: Math.floor(Date.now() / 1000),
          tags: [
            ["d", "sync-identity-rotation-probe"],
            ["expiration", String(Math.floor(Date.now() / 1000) + 60)],
          ],
          content: "",
        },
      });
      expect(pendingProbe.pubkey).toBe(pendingRotation.pendingPublicKey);
      const rotated = await owner.syncIdentity.commitRotation({
        pendingPublicKey: pendingRotation.pendingPublicKey!,
        cutoffHeads: {
          [ownerPublicKey]: "owner-before-sync-rotation",
          [memberStatus.devicePublicKey!]: "member-before-sync-rotation",
        },
      });
      expect(rotated.status).toMatchObject({
        state: "active",
        publicKey: pendingRotation.pendingPublicKey,
        generation: 2,
      });
      expect(rotated.status.history).toContainEqual(
        expect.objectContaining({
          publicKey: ownerSyncIdentity.publicKey,
          generation: 1,
          retiredMembershipGeneration: 3,
        }),
      );
      await member.membership.ingest(rotated.membershipEvent);
      await expect(member.syncIdentity.status()).resolves.toMatchObject({
        state: "active",
        publicKey: pendingRotation.pendingPublicKey,
        generation: 2,
      });

      const revoked = await owner.membership.revokeDevice({
        publicKey: memberStatus.publicKey!,
        cutoffHeads: {
          [ownerPublicKey]: "owner-head",
          [memberStatus.publicKey!]: "member-head",
        },
      });
      expect(revoked).toMatchObject({
        generation: 4,
        currentEpoch: 2,
        syncIdentity: { publicKey: pendingRotation.pendingPublicKey },
      });
      expect(revoked.epochEnvelopes).not.toHaveProperty(
        memberStatus.publicKey!,
      );
      const memberRevoked = await member.membership.ingest(revoked.event!);
      expect(memberRevoked.devices).toContainEqual(
        expect.objectContaining({
          publicKey: memberStatus.publicKey,
          state: "revoked",
          cutoffHead: "member-head",
        }),
      );
      await expect(
        member.crypto.encryptObject({
          epoch: 2,
          type: "file-content",
          plaintext: new TextEncoder().encode("future data"),
        }),
      ).rejects.toThrow(/revoked/i);
      await expect(
        member.syncIdentity.signEvent({
          purpose: "transport",
          event: {
            kind: 78,
            created_at: Math.floor(Date.now() / 1000),
            tags: [["d", "revoked-device-attempt"]],
            content: "",
          },
        }),
      ).rejects.toThrow(/revoked/i);
      await expect(owner.syncIdentity.status()).resolves.toMatchObject({
        publicKey: pendingRotation.pendingPublicKey,
        generation: 2,
      });
      await expect(member.crypto.status()).resolves.toMatchObject({
        deviceState: "revoked",
        currentEpoch: 2,
        installedEpochs: [1],
      });
      expect((await owner.crypto.status()).installedEpochs).toEqual([1, 2]);
    },
  );

  it.each(["relay", "host"] as const)(
    "expires pairing invitations after the bounded two-minute window (%s)",
    async (delivery) => {
      let ownerService!: SyncHostService;
      const ownerHarness = await createHarness(
        {},
        {
          security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } },
          requestCryptoUnlock: async (pluginId, _status, enrollment) => {
            await ownerService.enrollPluginCrypto(
              pluginId,
              "owner wrapping passphrase",
              enrollment,
            );
          },
        },
      );
      ownerService = ownerHarness.service;
      const owner = ownerService.forPlugin("nostr-sync", ["crypto:nostr-sync"]);
      await owner.crypto.enrollNewVault({ deviceAlias: "Owner device" });
      const begun = await owner.pairing.beginOwner({
        ...(delivery === "host"
          ? { delivery }
          : { relayUrls: ["wss://relay.example"] }),
      });
      const memberHarness = await createHarness();
      const member = memberHarness.service.forPlugin("nostr-sync", [
        "crypto:nostr-sync",
      ]);
      vi.useFakeTimers();
      try {
        vi.setSystemTime(begun.session.expiresAt + 1);
        await expect(
          member.pairing.acceptInvite({
            invitationUri: begun.invitationUri!,
            deviceAlias: "Late device",
            ...(delivery === "host" ? { delivery } : {}),
          }),
        ).rejects.toThrow(/invitation expired/i);
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it("exports authenticated owner recovery and restores a fresh rotated identity", async () => {
    let sourceService!: SyncHostService;
    const sourceHarness = await createHarness(
      {},
      {
        security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } },
        requestCryptoUnlock: async (pluginId, _status, enrollment) => {
          await sourceService.enrollPluginCrypto(
            pluginId,
            "source wrapping passphrase",
            enrollment,
          );
        },
        requestRecoveryPassphrase: async () => "recovery bundle passphrase",
      },
    );
    sourceService = sourceHarness.service;
    const source = sourceService.forPlugin("nostr-sync", ["crypto:nostr-sync"]);
    await source.crypto.enrollNewVault({ deviceAlias: "Original owner" });
    const original = await source.crypto.status();
    const bundle = await source.recovery.exportBundle({
      metadata: { relays: ["wss://relay.example"] },
    });

    let restoredService!: SyncHostService;
    const restoredHarness = await createHarness(
      {},
      {
        security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } },
        requestCryptoUnlock: async (pluginId, _status, enrollment) => {
          await restoredService.enrollPluginCrypto(
            pluginId,
            "restored wrapping passphrase",
            enrollment,
          );
        },
        requestRecoveryPassphrase: async () => "recovery bundle passphrase",
      },
    );
    restoredService = restoredHarness.service;
    const restored = restoredService.forPlugin("nostr-sync", [
      "crypto:nostr-sync",
    ]);
    const imported = await restored.recovery.importBundle({ bundle });
    expect(imported.metadata).toEqual({ relays: ["wss://relay.example"] });
    expect(imported.status).toMatchObject({
      state: "unlocked",
      role: "owner",
      deviceAlias: "Recovered owner",
      deviceState: "recovery-pending",
      currentEpoch: 1,
      installedEpochs: [1],
      membershipGeneration: 1,
    });
    expect(imported.status.vaultId).toBe(original.vaultId);
    expect(imported.status.publicKey).not.toBe(original.publicKey);
    expect(imported.status.syncIdentity).toMatchObject({
      state: "active",
      publicKey: original.syncIdentity?.publicKey,
      generation: original.syncIdentity?.generation,
    });
    const recoveredMembership = await restored.membership.recoverOwner({
      cutoffHeads: { [original.publicKey!]: "last-known-owner-head" },
    });
    expect(recoveredMembership).toMatchObject({
      generation: 2,
      currentEpoch: 2,
      devices: expect.arrayContaining([
        expect.objectContaining({
          publicKey: imported.status.publicKey,
          role: "owner",
          state: "active",
        }),
      ]),
    });
    await expect(restored.crypto.status()).resolves.toMatchObject({
      deviceState: "active",
      currentEpoch: 2,
      installedEpochs: [1, 2],
      membershipGeneration: 2,
      syncIdentity: {
        publicKey: original.syncIdentity?.publicKey,
        generation: original.syncIdentity?.generation,
      },
    });

    const tampered = bundle.slice();
    tampered[tampered.length - 2] ^= 1;
    const wrongHarness = await createHarness(
      {},
      {
        security: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } },
        requestRecoveryPassphrase: async () => "recovery bundle passphrase",
      },
    );
    const wrong = wrongHarness.service.forPlugin("nostr-sync", [
      "crypto:nostr-sync",
    ]);
    await expect(
      wrong.recovery.importBundle({ bundle: tampered }),
    ).rejects.toThrow(/invalid|unsupported|authentication/i);
  });

  it("brokers only granted network origins and reauthorizes redirects", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "https://objects.example/file" },
        }),
      )
      .mockResolvedValueOnce(new Response("payload", { status: 200 }));
    const { service } = await createHarness(
      {},
      {
        security: { fetch: fetchMock },
      },
    );
    const host = service.forPlugin("sync-a");
    await service.grantPluginNetworkOrigin("sync-a", "https://relay.example");

    await expect(
      host.network.request({ url: "https://relay.example/revision" }),
    ).rejects.toThrow(/not granted.*objects\.example/);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await service.grantPluginNetworkOrigin("sync-a", "https://objects.example");
    const response = await host.network.request({
      url: "https://relay.example/revision",
    });
    await expect(response.text()).resolves.toBe("payload");
    expect(fetchMock.mock.calls.at(-1)?.[1]).toMatchObject({
      credentials: "omit",
      redirect: "manual",
    });
    await expect(
      service.grantPluginNetworkOrigin("sync-a", "http://192.168.1.2"),
    ).rejects.toThrow(/must be explicit/);
    await expect(
      service.grantPluginNetworkOrigin("sync-a", "http://localhost:3000", {
        allowPrivateNetwork: true,
      }),
    ).resolves.toBeUndefined();
    await service.revokePluginNetworkOrigin(
      "sync-a",
      "https://objects.example",
    );
    await expect(
      host.network.request({ url: "https://objects.example/file" }),
    ).rejects.toThrow(/not granted/);
  });

  it("persists a host-approved exact origin grant and aborts active requests on revocation", async () => {
    let requestSignal: AbortSignal | undefined;
    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      requestSignal = init?.signal ?? undefined;
      return new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("open"));
          },
        }),
      );
    });
    const requestNetworkOriginGrant = vi.fn(async () => true);
    const { service } = await createHarness(
      {},
      {
        security: { fetch: fetchMock },
        requestNetworkOriginGrant,
      },
    );
    const host = service.forPlugin("sync-a", ["network:connect"]);

    await host.network.requestOriginGrant("https://objects.example");
    await host.network.requestOriginGrant("https://objects.example/path");
    expect(requestNetworkOriginGrant).toHaveBeenCalledTimes(1);
    expect(requestNetworkOriginGrant).toHaveBeenCalledWith({
      pluginId: "sync-a",
      origin: "https://objects.example",
      allowPrivateNetwork: false,
    });

    const response = await host.network.request({
      url: "https://objects.example/object",
      timeoutMs: 60_000,
    });
    expect(response.body).not.toBeNull();
    expect(requestSignal?.aborted).toBe(false);
    service.revokePlugin("sync-a");
    expect(requestSignal?.aborted).toBe(true);
  });

  it("aborts a brokered request when its bounded timeout expires", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(init.signal?.reason),
            { once: true },
          );
        }),
    );
    const { service } = await createHarness(
      {},
      {
        security: { fetch: fetchMock },
      },
    );
    const host = service.forPlugin("sync-a");
    await service.grantPluginNetworkOrigin("sync-a", "https://objects.example");
    await expect(
      host.network.request({
        url: "https://objects.example/slow",
        timeoutMs: 1,
      }),
    ).rejects.toMatchObject({ name: "TimeoutError" });
  });
});
