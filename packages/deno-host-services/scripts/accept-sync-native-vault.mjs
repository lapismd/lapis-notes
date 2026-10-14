// Development acceptance only. Passphrases and the low-cost KDF are fixtures.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { SyncHostSecurityService } from "@lapis-notes/api/sync-security-host";
import { NativeSyncRepository } from "../src/sync-repository.ts";
import { NativeSyncVault } from "../src/sync-vault.ts";
import { NativeSyncLocalProvider } from "../src/sync-local-provider.ts";
import { NativeSyncSecurityStore } from "../src/sync-security-store.ts";

const enginePath = process.argv
  .slice(2)
  .find((value) => !value.startsWith("--"));
const directKernel = process.argv.includes("--direct-kernel");
if (!enginePath) throw new Error("Pass the packed plugin ./engine file path");
const { LocalSyncEngine, createMembershipHistoryAuthority, isIgnoredPath } =
  await import(pathToFileURL(resolve(enginePath)).href);
const directory = await mkdtemp(join(tmpdir(), "lapis-native-sync-engine-"));
const endpoints = [],
  runtimes = [];

async function endpoint(name) {
  const database = await NativeSyncSecurityStore.open(
    join(directory, `${name}-security.sqlite`),
    "security",
  );
  const security = new SyncHostSecurityService(database, () => undefined, {
    argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 },
  });
  const crypto = security.crypto("sync", "native-acceptance"),
    identity = security.syncIdentity("sync", "native-acceptance");
  const pairing = security.pairing(
    "sync",
    "native-acceptance",
    () => undefined,
    (input) =>
      security.enroll("sync", "native pairing fixture passphrase", input),
  );
  const value = { name, database, security, crypto, identity, pairing };
  endpoints.push(value);
  return value;
}

async function restartEndpoint(previous, passphrase) {
  const before = await previous.crypto.status();
  previous.security.revokePlugin("sync");
  await previous.database.close();
  const next = await endpoint(previous.name);
  assert.equal((await next.crypto.status()).state, "locked");
  await assert.rejects(
    next.security.enroll("sync", passphrase),
    /already enrolled/,
  );
  await assert.rejects(
    next.security.unlock("sync", "wrong fixture passphrase"),
    /unlock failed/,
  );
  await next.security.unlock("sync", passphrase);
  assert.deepEqual(await next.crypto.status(), before);
  const envelope = await next.database.getMeta(
    "sync-host:v1:security:crypto:sync",
  );
  assert.equal(envelope.kdf.name, "argon2id");
  assert.equal(typeof envelope.ciphertextHex, "string");
  assert.equal("deviceSecretHex" in envelope, false);
  return next;
}

async function pair(owner, member) {
  await owner.security.enroll("sync", "native owner fixture passphrase");
  if ((await owner.identity.status()).state === "setup-required")
    await owner.identity.initialize({ cutoffHeads: {} });
  const begun = await owner.pairing.beginOwner({
    delivery: "host",
  });
  const accepted = await member.pairing.acceptInvite({
    invitationUri: begun.invitationUri,
    deviceAlias: "Member fixture",
    delivery: "host",
  });
  const sessionId = begun.session.sessionId;
  const hello = await owner.pairing.ingest({
    sessionId,
    event: accepted.outboundEvents[0],
  });
  const ack = await member.pairing.ingest({
    sessionId,
    event: hello.outboundEvents[0],
  });
  assert.equal(ack.session.sas, hello.session.sas);
  const confirmed = await member.pairing.confirm(sessionId, ack.session.sas);
  await owner.pairing.ingest({ sessionId, event: confirmed.outboundEvents[0] });
  const transfer = await owner.pairing.confirm(sessionId, hello.session.sas);
  for (const event of transfer.outboundEvents)
    await member.pairing.ingest({ sessionId, event });
  const complete = await member.pairing.confirm(sessionId);
  await owner.pairing.ingest({ sessionId, event: complete.outboundEvents[0] });
  for (const result of [
    begun,
    accepted,
    hello,
    ack,
    confirmed,
    transfer,
    complete,
  ]) {
    assert.equal(result.delivery, "host");
    assert.deepEqual(result.relayUrls, []);
  }
  const a = await owner.crypto.status(),
    b = await member.crypto.status();
  assert.equal(a.vaultId, b.vaultId);
  assert.notEqual(a.devicePublicKey, b.devicePublicKey);
  assert.equal(a.syncIdentity.publicKey, b.syncIdentity.publicKey);
}

async function boot(endpoint, failure = { installed: false }) {
  const rootPath = join(directory, endpoint.name),
    storagePath = join(directory, `${endpoint.name}-state`),
    statePath = join(directory, `${endpoint.name}-apply.sqlite`);
  await mkdir(rootPath, { recursive: true });
  const status = await endpoint.crypto.status(),
    snapshot = await endpoint.security
      .membership("sync", "native-acceptance")
      .getSnapshot();
  const nativeCrypto = {
    ...endpoint.crypto,
    async encryptObject(input) {
      const payload = JSON.parse(new TextDecoder().decode(input.plaintext));
      if (
        failure.installed &&
        ["lapis-native-apply-v1", "lapis-native-apply-v2"].includes(
          payload.domain,
        ) &&
        Object.values(payload.state.mutations).some(
          (mutation) => mutation.phase === "installed",
        )
      ) {
        failure.installed = false;
        throw new Error("Injected installed-before-progress failure");
      }
      return endpoint.crypto.encryptObject(input);
    },
  };
  const provider = directKernel
    ? null
    : new NativeSyncLocalProvider({
        rootPath,
        storagePath,
        crypto: nativeCrypto,
        includePath: (path) => !isIgnoredPath(path),
        assertActive: () => {},
      });
  const local = provider?.forRuntime("native-acceptance");
  const vault = local
    ? { list: () => local.list(), ...local.apply }
    : await NativeSyncVault.open({
        rootPath,
        statePath,
        vaultId: status.vaultId,
        devicePublicKey: status.devicePublicKey,
        crypto: nativeCrypto,
        includePath: (path) => !isIgnoredPath(path),
      });
  const repository =
    local?.repository ??
    (await NativeSyncRepository.open(
      join(directory, `${endpoint.name}-engine.sqlite`),
      "engine",
    ));
  const crypto = {
    ...endpoint.crypto,
    publicKey: status.devicePublicKey,
    syncPublicKey: status.syncIdentity.publicKey,
    signTransportEvent: (event, options = {}) =>
      endpoint.identity.signEvent({ purpose: "transport", ...options, event }),
  };
  const engine = await LocalSyncEngine.open({
    vaultId: status.vaultId,
    repository,
    crypto,
    vault: {
      flushOpenEditor: async () => {},
      list: () => vault.list(),
      apply: vault,
    },
    authority: async () => {
      const value = await endpoint.crypto.status();
      return {
        active: value.deviceState === "active",
        enrolled: value.state !== "unenrolled",
        unlocked: value.state === "unlocked",
        vaultId: value.vaultId,
        devicePublicKey: value.devicePublicKey,
        syncPublicKey: value.syncIdentity.publicKey,
        epoch: value.currentEpoch,
        membershipGeneration: value.membershipGeneration,
      };
    },
  });
  const policy = createMembershipHistoryAuthority({
    vaultId: status.vaultId,
    ownerPublicKey: snapshot.ownerPublicKey,
    membership: () =>
      endpoint.security.membership("sync", "native-acceptance").getSnapshot(),
    keyEpochs: async () => {
      const value = await endpoint.crypto.status();
      assert.ok(
        Array.isArray(value.installedEpochs),
        "Unlocked host must enumerate installed key epochs",
      );
      return value.installedEpochs;
    },
  });
  const runtime = {
    rootPath,
    engine,
    vault,
    repository,
    policy,
    failure,
    async close() {
      await engine.dispose();
      if (provider) await provider.close();
      else {
        await vault.close();
        await repository.close();
      }
    },
  };
  runtimes.push(runtime);
  return runtime;
}

async function discover(target, source) {
  const head = source.engine.snapshot().outbox.at(-1).head;
  await target.engine.ingestHeads(
    [head],
    source.repository.blobs,
    target.policy,
  );
  const plan = await target.engine.reconciliation(target.policy);
  assert.equal(plan.kind, "fast-forward");
  return plan.targetRevisionId;
}

try {
  let owner = await endpoint("owner"),
    member = await endpoint("member");
  await pair(owner, member);
  owner = await restartEndpoint(owner, "native owner fixture passphrase");
  member = await restartEndpoint(member, "native pairing fixture passphrase");
  const a = await boot(owner);
  let b = await boot(member);
  const path = "private-native-roundtrip-note.md",
    initial = "private native initial bytes",
    edited = "private native member edit",
    recovered = "private native recovered bytes";
  await writeFile(join(a.rootPath, path), initial);
  await writeFile(
    join(a.rootPath, "attachment.bin"),
    new Uint8Array(20 * 1024 * 1024).fill(7),
  );
  const first = await a.engine.checkpoint({
    message: "private native initial message",
  });
  await b.engine.applyRevision(await discover(b, a), b.policy);
  assert.equal(await readFile(join(b.rootPath, path), "utf8"), initial);
  assert.equal(
    (await readFile(join(b.rootPath, "attachment.bin"))).byteLength,
    20 * 1024 * 1024,
  );
  await writeFile(join(b.rootPath, path), edited);
  const second = await b.engine.checkpoint();
  assert.equal(
    b.engine.snapshot().revisions[second.id].payload.parents[0].eventId,
    first.id,
  );
  await a.engine.applyRevision(await discover(a, b), a.policy);
  assert.equal(await readFile(join(a.rootPath, path), "utf8"), edited);
  assert.equal(await a.engine.checkpoint(), null);
  await writeFile(join(a.rootPath, path), recovered);
  const third = await a.engine.checkpoint();
  const target = await discover(b, a);
  b.failure.installed = true;
  await assert.rejects(
    b.engine.applyRevision(target, b.policy),
    /Injected installed-before-progress/,
  );
  assert.notEqual(b.engine.snapshot().appliedRevisionId, third.id);
  assert.ok(b.engine.snapshot().applyIntent);
  await b.close();
  member = await restartEndpoint(member, "native pairing fixture passphrase");
  b = await boot(member);
  await b.engine.resumeApply(b.policy);
  assert.equal(b.engine.snapshot().appliedRevisionId, third.id);
  assert.equal(b.engine.snapshot().applyIntent, null);
  assert.equal(await readFile(join(b.rootPath, path), "utf8"), recovered);
  assert.equal(await b.engine.checkpoint(), null);
  for (const runtime of runtimes) await runtime.close();
  for (const name of ["owner", "member"])
    for (const suffix of ["engine", "apply", "security"]) {
      const bytes = await readFile(
        suffix === "security" || directKernel
          ? join(directory, `${name}-${suffix}.sqlite`)
          : join(directory, `${name}-state`, `${suffix}.sqlite`),
      );
      for (const secret of [
        path,
        initial,
        edited,
        recovered,
        "private native initial message",
        "native owner fixture passphrase",
        "native pairing fixture passphrase",
        "deviceSecretHex",
      ])
        assert.equal(bytes.includes(Buffer.from(secret)), false);
    }
  console.log(
    `PASS: independent paired identities + packed engine + ${directKernel ? "direct native kernel" : "native local provider"}; durable wrapped identities, bidirectional ancestry, 20 MiB attachment, interrupted apply, cold security reopen/lock/unlock and encrypted journals. No external sync service used.`,
  );
} finally {
  for (const runtime of runtimes.reverse()) await runtime.close();
  for (const endpoint of endpoints) {
    endpoint.security.lock("sync");
    await endpoint.database.close();
  }
  await rm(directory, { recursive: true, force: true });
}
