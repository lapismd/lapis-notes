import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { SyncHostSecurityService } from "@lapis-notes/api/sync-security-host";
import { NativeSyncRepository } from "../src/sync-repository.ts";
import { NativeSyncVault } from "../src/sync-vault.ts";
import { hash } from "../src/sync-vault-files.ts";

const [legacyPath] = process.argv.slice(2);
assert.ok(legacyPath, "Supply the earlier native kernel module path");
const { NativeSyncVault: LegacyVault } = await import(
  pathToFileURL(resolve(legacyPath)).href
);
assert.equal(typeof LegacyVault?.open, "function");
const directory = await mkdtemp(join(tmpdir(), "lapis-journal-upgrade-"));
const database = new MemoryAppDatabase("native-upgrade-fixture");
const kernels = [];
let security;
try {
  await database.open();
  security = new SyncHostSecurityService(database, () => undefined, {
    argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 },
  });
  await security.enroll("sync", "native upgrade fixture passphrase");
  const crypto = security.crypto("sync", "upgrade-fixture");
  const status = await crypto.status();
  const rootPath = join(directory, "vault"),
    statePath = join(directory, "apply.sqlite");
  await mkdir(rootPath);
  const options = {
    rootPath,
    statePath,
    vaultId: status.vaultId,
    devicePublicKey: status.devicePublicKey,
    crypto,
  };
  const readState = async () => {
    const repository = await NativeSyncRepository.open(
      statePath,
      hash(`native-apply:${status.vaultId}:${status.devicePublicKey}`),
    );
    try {
      return await repository.readState();
    } finally {
      await repository.close();
    }
  };
  // Positive control: the actual earlier kernel creates and opens its own format.
  const legacy = await LegacyVault.open(options);
  kernels.push(legacy);
  assert.deepEqual(await legacy.list(), []);
  await legacy.close();
  const legacyReopened = await LegacyVault.open(options);
  kernels.push(legacyReopened);
  assert.deepEqual(await legacyReopened.list(), []);
  await legacyReopened.close();
  const current = await NativeSyncVault.open(options);
  kernels.push(current);
  const create = {
    id: "original-create",
    kind: "write",
    path: "note.md",
    expected: null,
    fileId: "stable-file",
  };
  const created = await current.mutate(
    create,
    new Blob(["original content"]).stream(),
  );
  const removed = await current.mutate({
    id: "later-remove",
    kind: "remove",
    path: "note.md",
    expected: created.result,
    fileId: "stable-file",
  });
  assert.equal(removed.result, null);
  await current.close();
  const before = await readState();
  await assert.rejects(async () => {
    const opened = await LegacyVault.open(options);
    kernels.push(opened);
  }, /Native apply journal does not belong|Unsupported native apply journal/u);
  assert.deepEqual(await readState(), before);
  const reopened = await NativeSyncVault.open(options);
  kernels.push(reopened);
  assert.deepEqual(await reopened.receipt(create.id), created);
  assert.deepEqual(await reopened.receipt("later-remove"), removed);
  assert.deepEqual(
    await reopened.mutate(create, new Blob(["must never resurrect"]).stream()),
    created,
  );
  await assert.rejects(readFile(join(rootPath, "note.md")), { code: "ENOENT" });
  assert.deepEqual(await reopened.list(), []);
  console.log(
    "PASS: actual earlier kernel positive control, durable upgrade, downgrade rejection, unchanged sealed state and idempotent create/delete retry. No network service used.",
  );
} finally {
  for (const kernel of kernels.reverse()) await kernel.close();
  security?.lock("sync");
  await database.close();
  await rm(directory, { recursive: true, force: true });
}
