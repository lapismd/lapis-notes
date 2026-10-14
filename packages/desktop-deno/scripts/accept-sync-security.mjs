// Real Deno, native database worker, JSON bridge, and an isolated OS-keychain account.
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DenoAppDatabaseHost } from "../src-deno/app-database.ts";
import { DenoSyncSecurityHost } from "../src-deno/sync-security.ts";
import { createDesktopSyncHostProviders } from "../src/deno-sync-security.ts";
import { handleDesktopInvoke } from "../src-deno/bindings.ts";
import { NATIVE_SYNC_CREDENTIAL_SERVICE } from "../src-deno/sync-secure-store.ts";

const [mode, directory, enginePath] = Deno.args;
if (!["write", "read"].includes(mode) || !directory)
  throw new Error("Expected write|read and an existing isolated directory");
if (Deno.build.os !== "darwin")
  throw new Error(
    "This live OS credential acceptance currently requires macOS",
  );
const fixturePath = join(directory, "sync-native-public.json");
const rootPath = join(directory, "vault");
if (mode === "write") {
  await Deno.mkdir(rootPath, { recursive: true });
  await Deno.writeTextFile(
    join(rootPath, "native-data-note.md"),
    "native initial working bytes",
  );
}
const fixture =
  mode === "read"
    ? JSON.parse(await Deno.readTextFile(fixturePath))
    : { profile: `sync-acceptance-${crypto.randomUUID()}:native` };
if (!/^sync-acceptance-[a-f0-9-]{36}:native$/u.test(fixture.profile))
  throw new Error("Invalid isolated acceptance profile");
let security;
const database = new DenoAppDatabaseHost(directory, async () => {}, {
  onProfilesInvalidated: () => {
    void security?.closeInactiveProfiles();
  },
});
security = new DenoSyncSecurityHost({
  userDataPath: directory,
  getProfileLease: (profile) => database.getProfileLease(profile),
  getProfileRoot: (profile) => database.getProfileRoot(profile),
});
const invoke = async (command, payload) => {
  const result = await handleDesktopInvoke(
    command,
    JSON.parse(JSON.stringify(payload)),
    { appDatabase: database, syncSecurity: security },
  );
  return result === undefined ? undefined : JSON.parse(JSON.stringify(result));
};
const providers = createDesktopSyncHostProviders({
  vaultId: fixture.profile,
  invoke,
  requestRecoveryPassphrase: async () => null,
});
let succeeded = false;
let engine;
async function openEngine(scoped, local) {
  const { LocalSyncEngine } = await import(
    pathToFileURL(resolve(enginePath)).href
  );
  const status = await scoped.crypto.status();
  if (status.syncIdentity?.state === "setup-required")
    await scoped.syncIdentity.initialize({ cutoffHeads: {} });
  const current = await scoped.crypto.status();
  return LocalSyncEngine.open({
    vaultId: current.vaultId,
    repository: local.repository,
    crypto: {
      ...scoped.crypto,
      publicKey: current.devicePublicKey,
      syncPublicKey: current.syncIdentity.publicKey,
      signTransportEvent: (event, options = {}) =>
        scoped.syncIdentity.signEvent({
          purpose: "transport",
          ...options,
          event,
        }),
    },
    vault: {
      flushOpenEditor: async () => {},
      list: () => local.list(),
      apply: local.apply,
    },
    authority: async () => {
      const value = await scoped.crypto.status();
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
}
try {
  await invoke("desktop_app_database_open", {
    databaseId: "sync-acceptance",
    vaultId: fixture.profile,
    rootPath,
  });
  const scoped = providers.security.forRuntime(`acceptance-${mode}`);
  const local = providers.local.forRuntime(`acceptance-${mode}`);
  const authority = async () => {
    const value = await scoped.crypto.status();
    return {
      vaultId: value.vaultId,
      devicePublicKey: value.devicePublicKey,
      epoch: value.currentEpoch,
      membershipGeneration: value.membershipGeneration,
    };
  };
  const initial = await scoped.crypto.status();
  if (initial.state !== (mode === "write" ? "unenrolled" : "locked"))
    throw new Error("Unexpected native initial key state");
  if (mode === "write") {
    const status = await scoped.crypto.enrollNewVault({
      deviceAlias: "Native acceptance",
    });
    const encrypted = await scoped.crypto.encryptObject({
      epoch: 1,
      type: "local-state",
      plaintext: new TextEncoder().encode("native Sync restart acceptance"),
    });
    fixture.devicePublicKey = status.devicePublicKey;
    fixture.envelope = Array.from(encrypted.bytes);
    fixture.objectHash = (
      await local.repository.blobs.put(encrypted.bytes)
    ).hash;
    if (
      !enginePath &&
      !(await local.repository.compareAndSwap(
        0,
        { version: 1, epoch: 1, ciphertext: encrypted.bytes },
        await authority(),
      ))
    )
      throw new Error("Native Sync state was not committed");
    const file = (await local.list()).find(
      (file) => file.path === "native-data-note.md",
    );
    if (!file) throw new Error("Native Sync capture did not find working file");
    await local.apply.mutate(
      {
        id: "native-write",
        kind: "write",
        path: file.path,
        fileId: file.fileId,
        expected: file,
      },
      new Blob(["native applied working bytes"]).stream(),
      await authority(),
    );
    if (enginePath) {
      engine = await openEngine(scoped, local);
      const revision = await engine.checkpoint({
        message: "native packed engine acceptance",
      });
      if (!revision)
        throw new Error(
          "Packed engine did not checkpoint through the native data RPC",
        );
      fixture.revisionId = revision.id;
      fixture.headId = engine.snapshot().outbox[0].head.id;
      fixture.objectHashes = engine.snapshot().outbox[0].objectHashes;
      fixture.stateVersion = (await local.repository.readState()).version;
    }
    await Deno.writeTextFile(fixturePath, JSON.stringify(fixture), {
      mode: 0o600,
    });
  } else {
    const status = await scoped.crypto.requestUnlock();
    if (status.devicePublicKey !== fixture.devicePublicKey)
      throw new Error("Native identity changed across processes");
    const bytes = await scoped.crypto.decryptObject({
      epoch: 1,
      type: "local-state",
      envelope: new Uint8Array(fixture.envelope),
    });
    if (new TextDecoder().decode(bytes) !== "native Sync restart acceptance")
      throw new Error("Native restart could not decrypt previous ciphertext");
    const state = await local.repository.readState();
    if (
      state?.version !== (fixture.stateVersion ?? 1) ||
      state.epoch !== 1 ||
      (!enginePath &&
        Array.from(state.ciphertext).join(",") !== fixture.envelope.join(","))
    )
      throw new Error("Native Sync state did not survive process restart");
    const object = await local.repository.blobs.get(fixture.objectHash);
    if (Array.from(object).join(",") !== fixture.envelope.join(","))
      throw new Error("Native ciphertext object changed");
    const file = (await local.list()).find(
      (file) => file.path === "native-data-note.md",
    );
    if (
      !file ||
      (await new Response(await file.openRead()).text()) !==
        "native applied working bytes"
    )
      throw new Error(
        "Native guarded working-file apply did not survive restart",
      );
    if (
      (await local.apply.receipt("native-write", await authority()))?.operation
        .id !== "native-write"
    )
      throw new Error("Native mutation receipt did not survive restart");
    if (enginePath) {
      engine = await openEngine(scoped, local);
      const snapshot = engine.snapshot();
      if (
        snapshot.localRevisionId !== fixture.revisionId ||
        snapshot.outbox[0]?.head.id !== fixture.headId ||
        snapshot.outbox[0].objectHashes.join(",") !==
          fixture.objectHashes.join(",")
      )
        throw new Error(
          "Packed engine lost signed offline history across the JSON/native restart",
        );
      if ((await engine.checkpoint()) !== null)
        throw new Error(
          "Packed engine invented another revision after reopening unchanged files",
        );
    }
  }
  let rejected = false;
  try {
    await invoke("desktop_sync_wrapping_key_get", {
      vaultId: fixture.profile,
      pluginId: "sync",
      create: false,
    });
  } catch {
    rejected = true;
  }
  if (!rejected)
    throw new Error("Raw new-Sync wrapping-key RPC remained accessible");
  let aliasRejected = false;
  try {
    await invoke("desktop_sync_wrapping_key_get", {
      vaultId: fixture.profile.slice(0, -":native".length),
      pluginId: "native:sync",
      create: false,
    });
  } catch {
    aliasRejected = true;
  }
  if (!aliasRejected)
    throw new Error("Legacy account alias exposed native wrapping material");
  if (mode === "read") {
    await invoke("desktop_app_database_close", {
      databaseId: "sync-acceptance",
    });
    let revoked = false;
    try {
      await scoped.crypto.status();
    } catch {
      revoked = true;
    }
    if (!revoked)
      throw new Error("Closing the native database retained Sync authority");
  }
  await engine?.dispose();
  await providers.local.revokeRuntime(`acceptance-${mode}`);
  await providers.security.revokeRuntime(`acceptance-${mode}`);
  succeeded = true;
  console.log(
    JSON.stringify({
      mode,
      nativeWorker: true,
      jsonBridge: true,
      osCredentials: true,
      rawKeyRpcRejected: true,
      identityPreserved: true,
      physicalRootAdmission: true,
      guardedFiles: true,
      sealedDataRestart: true,
      packedEngineRestart: Boolean(enginePath),
    }),
  );
} finally {
  await engine?.dispose();
  try {
    await security.closeAll();
  } finally {
    await database.closeAll();
  }
  if (mode === "read" || !succeeded) {
    const cleanup = await new Deno.Command("security", {
      args: [
        "delete-generic-password",
        "-s",
        NATIVE_SYNC_CREDENTIAL_SERVICE,
        "-a",
        `${fixture.profile}:sync`,
      ],
      stdout: "null",
      stderr: "null",
    }).output();
    if (!cleanup.success && cleanup.code !== 44)
      throw new Error("Isolated acceptance credential cleanup failed");
  }
}
