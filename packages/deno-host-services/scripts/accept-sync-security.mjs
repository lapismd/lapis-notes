// Acceptance fixtures only: fixed passphrase and deliberately low-cost KDF.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { SyncHostSecurityService } from "@lapis-notes/api/sync-security-host";
import { NativeSyncSecurityStore } from "../src/sync-security-store.ts";

const [mode, input] = process.argv.slice(2).filter((value) => value !== "--");
if (!["write", "read"].includes(mode) || !input)
  throw new Error("Pass write/read and an existing acceptance directory");
const directory = resolve(input);
const path = join(directory, "security.sqlite");
const passphrase = "cross-process security acceptance fixture";
const plaintext = new TextEncoder().encode("private cross-process sync state");
const store = await NativeSyncSecurityStore.open(path, "security-acceptance");
const security = new SyncHostSecurityService(store, () => undefined, {
  argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 },
});
const crypto = security.crypto("sync", "acceptance");
const publicJson = (value) => JSON.parse(JSON.stringify(value));
try {
  if (mode === "write") {
    assert.equal((await crypto.status()).state, "unenrolled");
    await security.enroll("sync", passphrase);
    const ciphertext = await crypto.encryptObject({
      epoch: 1,
      type: "local-state",
      plaintext,
    });
    await writeFile(
      join(directory, "public-readback.json"),
      JSON.stringify({
        status: publicJson(await crypto.status()),
        ciphertext: Buffer.from(ciphertext.bytes).toString("hex"),
      }),
      { flag: "wx" },
    );
  } else {
    const expected = JSON.parse(
      await readFile(join(directory, "public-readback.json"), "utf8"),
    );
    assert.equal((await crypto.status()).state, "locked");
    await assert.rejects(
      security.enroll("sync", passphrase),
      /already enrolled/,
    );
    await assert.rejects(
      security.unlock("sync", "incorrect acceptance fixture"),
      /unlock failed/,
    );
    await security.unlock("sync", passphrase);
    assert.deepEqual(publicJson(await crypto.status()), expected.status);
    assert.deepEqual(
      await crypto.decryptObject({
        epoch: 1,
        type: "local-state",
        envelope: Uint8Array.from(Buffer.from(expected.ciphertext, "hex")),
      }),
      plaintext,
    );
  }
} finally {
  security.revokePlugin("sync");
  await store.close();
}
const bytes = await readFile(path);
for (const secret of [
  passphrase,
  new TextDecoder().decode(plaintext),
  "deviceSecretHex",
])
  assert.equal(bytes.includes(Buffer.from(secret)), false);
console.log(
  `PASS: ${mode} wrapped Sync identity and encrypted local-state in an independent native process`,
);
