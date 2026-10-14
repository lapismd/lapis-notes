import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { NativeSyncRepository } from "./sync-repository";

const directories: string[] = [];
afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});

async function openRepository(namespace = "vault:device") {
  const directory = await mkdtemp(join(tmpdir(), "lapis-sync-repository-"));
  directories.push(directory);
  const path = join(directory, "sync.sqlite");
  return { path, repository: await NativeSyncRepository.open(path, namespace) };
}

describe("native durable sync repository", () => {
  it("reopens immutable indexed ciphertext records without sharing namespaces", async () => {
    const { path, repository } = await openRepository();
    const key = "a".repeat(64),
      record = { epoch: 1, ciphertext: new Uint8Array([1, 8, 55]) };
    try {
      expect(await repository.records.get(key)).toBeNull();
      expect(await repository.records.putIfAbsent(key, record)).toBe(true);
      expect(
        await repository.records.putIfAbsent(key, {
          ...record,
          ciphertext: new Uint8Array([1, 8, 99]),
        }),
      ).toBe(false);
    } finally {
      await repository.close();
    }
    const reopened = await NativeSyncRepository.open(path, "vault:device");
    const other = await NativeSyncRepository.open(path, "other-vault");
    try {
      expect(await reopened.records.get(key)).toEqual(record);
      const returned = await reopened.records.get(key);
      returned!.ciphertext.fill(0);
      expect(await reopened.records.get(key)).toEqual(record);
      expect(await other.records.get(key)).toBeNull();
    } finally {
      await other.close();
      await reopened.close();
    }
    await expect(reopened.records.get(key)).rejects.toThrow("closed");
  });

  it("arbitrates indexed inserts across connections and rejects invalid addresses", async () => {
    const { path, repository } = await openRepository();
    const other = await NativeSyncRepository.open(path, "vault:device");
    const key = "b".repeat(64);
    try {
      const results = await Promise.all(
        [repository, other].map((store, index) =>
          store.records.putIfAbsent(key, {
            epoch: index + 1,
            ciphertext: new Uint8Array([1, 8, index]),
          }),
        ),
      );
      expect(results.filter(Boolean)).toHaveLength(1);
      expect(await repository.records.get(key)).toEqual({
        epoch: results[0] ? 1 : 2,
        ciphertext: new Uint8Array([1, 8, results[0] ? 0 : 1]),
      });
      await expect(repository.records.get("../unsafe")).rejects.toThrow(
        "Invalid",
      );
      await expect(
        repository.records.putIfAbsent("c".repeat(64), {
          epoch: 0,
          ciphertext: new Uint8Array([1]),
        }),
      ).rejects.toThrow("Invalid");
      expect(await repository.records.get("c".repeat(64))).toBeNull();
    } finally {
      await other.close();
      await repository.close();
    }
  });
  it("reopens encrypted state and immutable blobs from disk", async () => {
    const { path, repository } = await openRepository();
    const bytes = Uint8Array.from([1, 8, 33, 55, 44]);
    const blob = await repository.blobs.put(bytes);
    expect(
      await repository.compareAndSwap(0, {
        version: 1,
        epoch: 1,
        ciphertext: bytes,
      }),
    ).toBe(true);
    await repository.close();
    const reopened = await NativeSyncRepository.open(path, "vault:device");
    try {
      expect(await reopened.readState()).toEqual({
        version: 1,
        epoch: 1,
        ciphertext: bytes,
      });
      expect(await reopened.blobs.get(blob.hash)).toEqual(bytes);
      expect(await reopened.blobs.put(bytes)).toEqual(blob);
      expect(await reopened.blobs.has(blob.hash)).toBe(true);
    } finally {
      await reopened.close();
    }
    expect((await readFile(path)).byteLength).toBeGreaterThan(0);
  });

  it("rejects stale writes and separates repository namespaces", async () => {
    const { path, repository } = await openRepository();
    const other = await NativeSyncRepository.open(path, "another-vault");
    try {
      const state = {
        version: 1,
        epoch: 1,
        ciphertext: new Uint8Array([1, 8, 7]),
      };
      expect(await repository.compareAndSwap(0, state)).toBe(true);
      expect(await repository.compareAndSwap(0, state)).toBe(false);
      expect(await other.readState()).toBeNull();
      const blob = await repository.blobs.put(new Uint8Array([9, 8, 7]));
      expect(await other.blobs.has(blob.hash)).toBe(false);
      await expect(other.blobs.get(blob.hash)).rejects.toThrow(/missing/i);
    } finally {
      await other.close();
      await repository.close();
    }
  });

  it("arbitrates concurrent version updates without losing a winner", async () => {
    const { repository } = await openRepository();
    try {
      const results = await Promise.all(
        [1, 2].map((value) =>
          repository.compareAndSwap(0, {
            version: 1,
            epoch: 1,
            ciphertext: new Uint8Array([1, 8, value]),
          }),
        ),
      );
      expect(results.filter(Boolean)).toHaveLength(1);
      expect((await repository.readState())!.version).toBe(1);
    } finally {
      await repository.close();
    }
  });
});
