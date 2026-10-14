import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { connect } from "@tursodatabase/database";
import { afterEach, expect, it } from "vitest";
import { NativeSyncSecurityStore } from "./sync-security-store";

const directories: string[] = [];
const key = "sync-host:v1:security:crypto:sync";
afterEach(async () => {
  for (const path of directories.splice(0))
    await rm(path, { recursive: true, force: true });
});
async function location() {
  const directory = await mkdtemp(join(tmpdir(), "lapis-sync-security-"));
  directories.push(directory);
  return join(directory, "security.sqlite");
}

it("reopens copied records and isolates host namespaces", async () => {
  const path = await location();
  const store = await NativeSyncSecurityStore.open(path, "profile-a");
  const value = { nonce: "public", ciphertext: [1, 2] };
  await store.setMeta(key, value);
  value.ciphertext.push(3);
  await store.close();
  const next = await NativeSyncSecurityStore.open(path, "profile-a");
  const other = await NativeSyncSecurityStore.open(path, "profile-b");
  try {
    const copy = await next.getMeta<typeof value>(key);
    copy!.ciphertext.push(9);
    expect(await next.getMeta(key)).toEqual({
      nonce: "public",
      ciphertext: [1, 2],
    });
    expect(await other.getMeta(key)).toBeUndefined();
    await next.setMeta(key, undefined);
    expect(await next.getMeta(key)).toBeUndefined();
  } finally {
    await next.close();
    await other.close();
  }
  await expect(next.getMeta(key)).rejects.toThrow(/closed/i);
  await next.close();
});

it("atomically arbitrates competing enrollment transactions across connections", async () => {
  const path = await location();
  const a = await NativeSyncSecurityStore.open(path, "profile");
  const b = await NativeSyncSecurityStore.open(path, "profile");
  try {
    const results = await Promise.all(
      [a, b].map((store, id) =>
        store.transactMeta({
          checks: [{ key, exists: false }],
          mutations: [{ key, value: { id } }],
        }),
      ),
    );
    expect(results.filter((r) => r.applied)).toHaveLength(1);
    expect(await a.getMeta(key)).toEqual({ id: results[0].applied ? 0 : 1 });
    expect(
      await a.transactMeta({
        checks: [{ key, value: { id: 99 } }],
        mutations: [{ key, delete: true }],
      }),
    ).toEqual({ applied: false });
    expect(await a.getMeta(key)).toEqual({ id: results[0].applied ? 0 : 1 });
  } finally {
    await a.close();
    await b.close();
  }
});

it("validates all values before changing any records", async () => {
  const store = await NativeSyncSecurityStore.open(await location(), "profile");
  try {
    await store.setMeta(key, "retained");
    await expect(
      store.transactMeta({
        mutations: [
          { key, value: "changed" },
          { key: key + "-other", value: "x".repeat(4 * 1024 * 1024) },
        ],
      }),
    ).rejects.toThrow(/size|limit/i);
    expect(await store.getMeta(key)).toBe("retained");
    await expect(store.setMeta("index:path", "unsafe")).rejects.toThrow(
      /security.*key/i,
    );
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    await expect(store.setMeta(key, cyclic)).rejects.toThrow();
    expect(await store.getMeta(key)).toBe("retained");
  } finally {
    await store.close();
  }
});

it.each(["foreign", "lookalike", "future", "shape"])(
  "rejects a %s database without changing its contents",
  async (kind) => {
    const path = await location();
    const connection = await connect(path);
    if (kind === "lookalike")
      await connection.exec(
        "CREATE TABLE sqlitex_application_index(value TEXT)",
      );
    else if (kind === "foreign")
      await connection.exec("CREATE TABLE application_index(value TEXT)");
    else if (kind === "future")
      await connection.exec("PRAGMA user_version = 99");
    else
      await connection.exec(
        "CREATE TABLE sync_security_meta(namespace TEXT NOT NULL,key TEXT NOT NULL,value_json TEXT NOT NULL,PRIMARY KEY(namespace)); PRAGMA user_version = 1",
      );
    await connection.close();
    const opening = NativeSyncSecurityStore.open(path, "profile");
    try {
      await expect(opening).rejects.toThrow(/schema|dedicated/i);
    } finally {
      await (await opening.catch(() => null))?.close();
    }
    const check = await connect(path);
    try {
      expect(
        (await check.get<{ user_version: number }>("PRAGMA user_version"))!
          .user_version,
      ).toBe(kind === "future" ? 99 : kind === "shape" ? 1 : 0);
      const table = await check.get(
        "SELECT name FROM sqlite_master WHERE name = 'sync_security_meta'",
      );
      if (kind === "shape") expect(table).toBeDefined();
      else expect(table).toBeUndefined();
    } finally {
      await check.close();
    }
  },
);

it.each([
  { label: "empty", namespace: "" },
  { label: "overlong", namespace: "x".repeat(513) },
  { label: "NUL", namespace: "profile\u0000alias" },
])("rejects an invalid host namespace: $label", async ({ namespace }) => {
  const opening = NativeSyncSecurityStore.open(await location(), namespace);
  try {
    await expect(opening).rejects.toThrow(/namespace/i);
  } finally {
    await (await opening.catch(() => null))?.close();
  }
});

it("rolls back earlier mutations after an actual SQLite write failure", async () => {
  const path = await location();
  const store = await NativeSyncSecurityStore.open(path, "profile");
  const connection = await connect(path);
  try {
    await store.setMeta(key, "retained");
    await connection.exec(
      "CREATE TRIGGER injected_write_failure BEFORE INSERT ON sync_security_meta WHEN NEW.key LIKE '%-fail' BEGIN SELECT RAISE(ABORT, 'injected write failure'); END",
    );
    await expect(
      store.transactMeta({
        mutations: [
          { key, value: "changed" },
          { key: key + "-fail", value: "reject" },
        ],
      }),
    ).rejects.toThrow(/injected write failure/);
    expect(await store.getMeta(key)).toBe("retained");
    expect(await store.getMeta(key + "-fail")).toBeUndefined();
  } finally {
    await connection.close();
    await store.close();
  }
});

it("drains accepted writes before close and rejects new work", async () => {
  const path = await location();
  const store = await NativeSyncSecurityStore.open(path, "profile");
  const write = store.setMeta(key, "retained");
  const closed = store.close();
  await expect(store.setMeta(key, "rejected")).rejects.toThrow(/closed/i);
  await write;
  await closed;
  const next = await NativeSyncSecurityStore.open(path, "profile");
  try {
    expect(await next.getMeta(key)).toBe("retained");
  } finally {
    await next.close();
  }
});

it("rejects corrupt JSON without clearing other security records", async () => {
  const path = await location();
  const store = await NativeSyncSecurityStore.open(path, "profile");
  await store.setMeta(key, "retained");
  const connection = await connect(path);
  try {
    await connection.run(
      "INSERT INTO sync_security_meta(namespace,key,value_json) VALUES(?,?,?)",
      "profile",
      key + "-corrupt",
      "{invalid",
    );
    await expect(store.getMeta(key + "-corrupt")).rejects.toThrow(
      /corrupt|JSON/i,
    );
    expect(await store.getMeta(key)).toBe("retained");
  } finally {
    await connection.close();
    await store.close();
  }
});
