import { connect } from "@tursodatabase/database";
import { expect, it } from "vitest";
import { REMOTE_APP_DATABASE_METHODS } from "../storage/remote-app-database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";
import input from "./fixtures/native-facade-contract.json";

const normalize = (method: string, value: unknown) => {
  if (method !== "storeFileHistoryRevision") return value;
  const stored = structuredClone(value) as {
    fileId: string;
    revision: { fileId: string; revisionId: string };
  };
  expect(stored.fileId.length).toBeGreaterThan(0);
  expect(stored.revision.fileId).toBe(stored.fileId);
  expect(stored.revision.revisionId.length).toBeGreaterThan(0);
  stored.fileId = stored.revision.fileId = "<generated-file>";
  stored.revision.revisionId = "<generated-revision>";
  return stored;
};

it("retains the complete high-level Turso call reference and JavaScript value shapes", async () => {
  expect(
    [...new Set(input.cases.map((entry) => entry.request.method))].sort(),
  ).toEqual([...REMOTE_APP_DATABASE_METHODS].sort());
  const db = new TursoAppDatabase("native-call-reference", {
    kind: "turso-native",
    transport: "native",
    connectionFactory: async () =>
      (await connect(":memory:", {
        experimental: ["index_method"],
      })) as TursoConnection,
  });
  await db.open();
  try {
    for (const entry of input.cases) {
      const method = entry.request.method as keyof typeof db;
      const invoke = db[method] as (...args: unknown[]) => Promise<unknown>;
      const args = entry.request.args.map((arg) =>
        arg.kind === "undefined" ? undefined : arg.value,
      );
      const result = await invoke.apply(db, args);
      const expected =
        result === undefined
          ? { kind: "undefined" }
          : { kind: "value", value: normalize(entry.request.method, result) };
      expect(expected, entry.name).toEqual(entry.expected);
    }
  } finally {
    await db.close();
  }
});

it("requires the Tasks projection for both omitted and undefined default queries", async () => {
  const db = new TursoAppDatabase("native-call-default-reference", {
    kind: "turso-native",
    transport: "native",
    connectionFactory: async () =>
      (await connect(":memory:", {
        experimental: ["index_method"],
      })) as TursoConnection,
  });
  await db.open();
  try {
    await expect(db.queryTasks()).rejects.toThrow(/not registered/iu);
    await expect(db.queryTasks(undefined)).rejects.toThrow(/not registered/iu);
    expect(await db.getChangeRevision()).toBe(0);
  } finally {
    await db.close();
  }
});
