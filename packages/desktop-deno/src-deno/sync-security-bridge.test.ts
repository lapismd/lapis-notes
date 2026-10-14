import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { DenoSyncSecurityHost } from "./sync-security";
import { createDesktopSyncSecurityProvider } from "../src/deno-sync-security";

const fixtures: { host: DenoSyncSecurityHost; directory: string }[] = [];
afterEach(async () => {
  for (const { host, directory } of fixtures.splice(0)) {
    await host.closeAll();
    await rm(directory, { recursive: true, force: true });
  }
});
async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "lapis-sync-bridge-"));
  const lease = {};
  const host = new DenoSyncSecurityHost({
    userDataPath: directory,
    getProfileLease: () => lease,
    getWrappingKey: async () => ({
      provider: "os-credential-store",
      keyId: "fixture",
      wrappingKeyBase64: btoa("x".repeat(32)),
    }),
    securityOptions: { argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 } },
  });
  fixtures.push({ host, directory });
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
  const requestRecoveryPassphrase = vi.fn(async () => "owner recovery phrase");
  const provider = createDesktopSyncSecurityProvider({
    vaultId: "profile",
    invoke,
    requestRecoveryPassphrase,
  });
  return { host, invoke, provider, requestRecoveryPassphrase };
}

it("encrypts through actual native custody over a JSON-only renderer bridge", async () => {
  const { invoke, provider } = await fixture();
  const capabilities = provider.forRuntime("runtime-1");
  expect((await capabilities.crypto.status()).state).toBe("unenrolled");
  const enrolled = await capabilities.crypto.enrollNewVault({
    deviceAlias: "Desktop",
  });
  const encrypted = await capabilities.crypto.encryptObject({
    epoch: 1,
    type: "file-content",
    plaintext: new TextEncoder().encode("private note"),
  });
  const plaintext = await capabilities.crypto.decryptObject({
    epoch: 1,
    type: "file-content",
    envelope: encrypted.bytes,
  });
  expect(new TextDecoder().decode(plaintext)).toBe("private note");
  expect(
    (await capabilities.membership.getSnapshot()).devices[0]?.publicKey,
  ).toBe(enrolled.devicePublicKey);
  expect((await capabilities.syncIdentity.status()).state).toBe("active");
  expect(
    invoke.mock.calls.filter(
      ([command]) => command === "desktop_sync_security_open",
    ),
  ).toHaveLength(1);
  expect(JSON.stringify(invoke.mock.calls)).not.toMatch(
    /wrappingKeyBase64|deviceSecretHex/,
  );
  await provider.revokeRuntime("runtime-1");
  await expect(capabilities.crypto.status()).rejects.toThrow(/revoked/i);
});

it("keeps recovery interaction host-owned and serializes only the encrypted bundle back", async () => {
  const { provider, requestRecoveryPassphrase } = await fixture();
  const capabilities = provider.forRuntime("runtime-1");
  await capabilities.crypto.enrollNewVault({ deviceAlias: "Desktop" });
  const bundle = await capabilities.recovery.exportBundle({
    metadata: { note: "private note" },
  });
  expect(requestRecoveryPassphrase).toHaveBeenCalledExactlyOnceWith("export");
  expect(new TextDecoder().decode(bundle)).not.toMatch(
    /owner recovery phrase|private note|deviceSecretHex/,
  );
  await provider.revokeRuntime("runtime-1");
});

it("awaits a delayed session open before revocation and never invokes the queued operation", async () => {
  const { invoke, provider } = await fixture();
  const original = invoke.getMockImplementation()!;
  let release!: () => void;
  const hold = new Promise<void>((done) => {
    release = done;
  });
  invoke.mockImplementationOnce(async (...args) => {
    const result = await original(...args);
    await hold;
    return result;
  });
  const capabilities = provider.forRuntime("runtime-1");
  const pending = capabilities.crypto.status().then(
    () => null,
    (error: unknown) => error,
  );
  await vi.waitFor(() => expect(invoke).toHaveBeenCalledOnce());
  const closing = provider.revokeRuntime("runtime-1");
  release();
  expect(await pending).toMatchObject({
    message: "Desktop Sync runtime is revoked",
  });
  await closing;
  expect(
    invoke.mock.calls.filter(
      ([command]) => command === "desktop_sync_security_call",
    ),
  ).toHaveLength(0);
  const next = provider.forRuntime("runtime-2");
  expect((await next.crypto.status()).state).toBe("unenrolled");
  await provider.revokeRuntime("runtime-2");
});

it("recovers a lost open response for cleanup without leaving an exclusive native session", async () => {
  const { invoke, provider } = await fixture();
  const original = invoke.getMockImplementation()!;
  invoke.mockImplementationOnce(async (...args) => {
    await original(...args);
    throw new Error("lost open response");
  });
  await expect(
    provider.forRuntime("runtime-1").crypto.status(),
  ).rejects.toThrow("lost open response");
  await provider.revokeRuntime("runtime-1");
  expect((await provider.forRuntime("runtime-2").crypto.status()).state).toBe(
    "unenrolled",
  );
  await provider.revokeRuntime("runtime-2");
});

it("retries a lost open response in the same runtime without replacing the native session", async () => {
  const { invoke, provider } = await fixture();
  const original = invoke.getMockImplementation()!;
  invoke.mockImplementationOnce(async (...args) => {
    await original(...args);
    throw new Error("lost open response");
  });
  const scoped = provider.forRuntime("runtime-1");
  await expect(scoped.crypto.status()).rejects.toThrow("lost open response");
  expect((await scoped.crypto.status()).state).toBe("unenrolled");
  await scoped.crypto.enrollNewVault({ deviceAlias: "Desktop" });
  expect(
    invoke.mock.calls.filter(
      ([command]) => command === "desktop_sync_security_open",
    ),
  ).toHaveLength(2);
  await provider.revokeRuntime("runtime-1");
});

it("pairs independent native device keys over host-delivered Nostr messages", async () => {
  const a = await fixture(),
    b = await fixture();
  const owner = a.provider.forRuntime("owner-runtime"),
    member = b.provider.forRuntime("member-runtime");
  await owner.crypto.enrollNewVault({ deviceAlias: "Owner" });
  const begun = await owner.pairing.beginOwner({ delivery: "host" });
  const accepted = await member.pairing.acceptInvite({
    invitationUri: begun.invitationUri!,
    deviceAlias: "Member",
    delivery: "host",
  });
  const sessionId = begun.session.sessionId;
  const hello = await owner.pairing.ingest({
    sessionId,
    event: accepted.outboundEvents[0]!,
  });
  const ack = await member.pairing.ingest({
    sessionId,
    event: hello.outboundEvents[0]!,
  });
  expect(ack.session.sas).toBe(hello.session.sas);
  const confirmed = await member.pairing.confirm(sessionId, ack.session.sas);
  await owner.pairing.ingest({
    sessionId,
    event: confirmed.outboundEvents[0]!,
  });
  const transfer = await owner.pairing.confirm(sessionId, hello.session.sas);
  for (const event of transfer.outboundEvents)
    await member.pairing.ingest({ sessionId, event });
  const complete = await member.pairing.confirm(sessionId);
  await owner.pairing.ingest({ sessionId, event: complete.outboundEvents[0]! });
  const [ownerStatus, memberStatus] = await Promise.all([
    owner.crypto.status(),
    member.crypto.status(),
  ]);
  expect(ownerStatus.vaultId).toBe(memberStatus.vaultId);
  expect(ownerStatus.devicePublicKey).not.toBe(memberStatus.devicePublicKey);
  expect(ownerStatus.syncIdentity?.publicKey).toBe(
    memberStatus.syncIdentity?.publicKey,
  );
  const encrypted = await owner.crypto.encryptObject({
    epoch: 1,
    type: "file-content",
    plaintext: new TextEncoder().encode("paired native secret"),
  });
  expect(
    new TextDecoder().decode(
      await member.crypto.decryptObject({
        epoch: 1,
        type: "file-content",
        envelope: encrypted.bytes,
      }),
    ),
  ).toBe("paired native secret");
  for (const result of [
    begun,
    accepted,
    hello,
    ack,
    confirmed,
    transfer,
    complete,
  ]) {
    expect(result.delivery).toBe("host");
    expect(result.relayUrls).toEqual([]);
  }
  await Promise.all([
    a.provider.revokeRuntime("owner-runtime"),
    b.provider.revokeRuntime("member-runtime"),
  ]);
});
