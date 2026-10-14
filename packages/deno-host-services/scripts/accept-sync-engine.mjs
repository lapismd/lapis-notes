// Development acceptance only. The low-cost KDF and passphrase are test fixtures.
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { SyncHostSecurityService } from "@lapis-notes/api/sync-security-host";
import { NativeSyncRepository } from "../src/sync-repository.ts";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const enginePath = process.argv.slice(2).find((value) => value !== "--");
if (!enginePath) throw new Error("Pass the built plugin ./engine file path");
const {
  LocalSyncEngine,
  createMembershipHistoryAuthority,
  unwrapDeviceTransportEvent,
  isAncestor,
} = await import(pathToFileURL(resolve(enginePath)).href);
assert.equal(typeof LocalSyncEngine?.open, "function");
assert.equal(typeof createMembershipHistoryAuthority, "function");

const directory = await mkdtemp(join(tmpdir(), "lapis-engine-native-"));
const database = new MemoryAppDatabase("native-sync-acceptance");
await database.open();
const security = new SyncHostSecurityService(database, () => undefined, {
  argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 },
});
await security.enroll("sync", "acceptance fixture passphrase");
const device = security.crypto("sync", "acceptance");
const identity = security.syncIdentity("sync", "acceptance");
if ((await identity.status()).state === "setup-required")
  await identity.initialize({ cutoffHeads: {} });
const status = await device.status();
const crypto = {
  ...device,
  publicKey: status.devicePublicKey,
  syncPublicKey: (await identity.status()).publicKey,
  signTransportEvent: (event, options = {}) =>
    identity.signEvent({ purpose: "transport", ...options, event }),
};
const options = {
  vaultId: status.vaultId,
  crypto,
  authority: async () => {
    const next = await device.status();
    return {
      active: next.deviceState === "active",
      enrolled: next.state !== "unenrolled",
      unlocked: next.state === "unlocked",
      vaultId: next.vaultId,
      devicePublicKey: next.devicePublicKey,
      syncPublicKey: next.syncIdentity.publicKey,
      epoch: next.currentEpoch,
      membershipGeneration: next.membershipGeneration,
    };
  },
  vault: {
    async flushOpenEditor() {},
    async list() {
      return [
        {
          path: "private-native-note.md",
          fileId: "stable-native-file",
          contentGeneration: 1,
          async openRead() {
            return new Blob(["private-native-content"]).stream();
          },
        },
      ];
    },
  },
};
let repository = await NativeSyncRepository.open(
  join(directory, "sync.sqlite"),
  "vault:device",
);
try {
  let engine = await LocalSyncEngine.open({ ...options, repository });
  const event = await engine.checkpoint({ message: "private-native-message" });
  const before = engine.snapshot();
  assert.equal(before.outbox.length, 1);
  const membership = security.membership("sync", "acceptance");
  const enrolled = await membership.getSnapshot();
  const policy = createMembershipHistoryAuthority({
    vaultId: enrolled.vaultId,
    ownerPublicKey: enrolled.ownerPublicKey,
    membership: () => membership.getSnapshot(),
    keyEpochs: async () => {
      const value = await crypto.status();
      assert.ok(
        Array.isArray(value.installedEpochs),
        "Unlocked host must enumerate installed key epochs",
      );
      return value.installedEpochs;
    },
  });
  const nodes = new Map(
    Object.entries(before.revisions).map(([eventId, revision]) => [
      eventId,
      { eventId, parents: revision.payload.parents },
    ]),
  );
  const context = {
    isAncestorOrEqual: (candidate, descendant) =>
      isAncestor(candidate, descendant, nodes),
  };
  const revision = before.revisions[event.id];
  const unwrapped = unwrapDeviceTransportEvent(revision.event, 78);
  const record = {
    event: revision.event,
    payload: revision.payload,
    devicePublicKey: unwrapped.deviceEvent.pubkey,
    legacy: unwrapped.legacy,
  };
  assert.equal(await policy.authorize(record, context), true);
  assert.equal(
    await policy.authorize(
      { ...record, devicePublicKey: "0".repeat(64) },
      context,
    ),
    false,
  );
  const rotation = await identity.beginRotation();
  await identity.commitRotation({
    pendingPublicKey: rotation.pendingPublicKey,
    cutoffHeads: { [crypto.publicKey]: event.id },
  });
  crypto.syncPublicKey = (await identity.status()).publicKey;
  assert.notEqual(crypto.syncPublicKey, revision.event.pubkey);
  assert.equal(await policy.authorize(record, context), true);
  assert.equal(
    await policy.authorize(record, { isAncestorOrEqual: () => false }),
    false,
  );
  await engine.dispose();
  await repository.close();
  security.lock("sync");
  await assert.rejects(policy.keyEpochs(), /locked/i);
  await security.unlock("sync", "acceptance fixture passphrase");
  repository = await NativeSyncRepository.open(
    join(directory, "sync.sqlite"),
    "vault:device",
  );
  engine = await LocalSyncEngine.open({ ...options, repository });
  assert.deepEqual(engine.snapshot(), before);
  assert.equal(engine.snapshot().localRevisionId, event.id);
  await engine.dispose();
  await repository.close();
  for (const name of await readdir(directory)) {
    const bytes = await readFile(join(directory, name));
    for (const secret of [
      "private-native-note.md",
      "private-native-content",
      "private-native-message",
    ])
      assert.equal(bytes.includes(Buffer.from(secret)), false);
  }
  console.log(
    "PASS: bundled engine + opaque host crypto + native repository; enrolled/retired identity authority, restart, lock/unlock, stable outbox and no plaintext on disk",
  );
} finally {
  await repository.close();
  security.lock("sync");
  await database.close();
  await rm(directory, { recursive: true, force: true });
}
