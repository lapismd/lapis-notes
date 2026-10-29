import { connect } from "@tursodatabase/database";
import type {
  AppDatabase,
  AppDatabaseIndexedFile,
} from "../storage/app-database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";
import tasks from "./fixtures/task-projection.json";

export const oldPath = "Notes/Öld.md";
export const newPath = "Archive/新.md";
export const refPath = "Links.md";
export type Step =
  | { kind: "upsert"; record: AppDatabaseIndexedFile }
  | { kind: "rename"; oldPath: string; newPath: string }
  | { kind: "delete"; path: string };

export function record(path: string, task = false): AppDatabaseIndexedFile {
  return {
    file: {
      path,
      normalizedPath: path,
      extension: ".MD",
      mtime: 1,
      size: 12,
      hash: "hash-1",
      indexed: true,
    },
    metadata: {
      path,
      hash: "hash-1",
      parserVersion: "fixture",
      metadata: { title: "Fixture 🪨" },
    },
    links: [
      {
        sourcePath: path,
        targetText: "Old",
        resolvedTargetPath: path === refPath ? oldPath : refPath,
        type: "link",
        count: 1,
        kind: "reference",
      },
    ],
    tags: [
      {
        path,
        tag: "#Work/Notes",
        parts: ["Work", "Notes"],
        hierarchy: ["Work", "Work/Notes"],
      },
    ],
    properties: [{ path, name: "Score", inferredType: "number", value: 1 }],
    ...(task
      ? {
          task: {
            ...tasks.records[0],
            documentPath: path,
          } as AppDatabaseIndexedFile["task"],
        }
      : {}),
  };
}
export function scenarios(): Array<{
  name: string;
  collision?: boolean;
  steps: Step[];
}> {
  const changed = record(oldPath);
  changed.file.hash = changed.metadata.hash = "changed";
  changed.properties[0].value = 2;
  const updated = record(oldPath, true);
  updated.task!.title = "Updated task";
  return [
    {
      name: "omitted task preserves task",
      steps: [{ kind: "upsert", record: changed }],
    },
    {
      name: "task record updates stages",
      steps: [{ kind: "upsert", record: updated }],
    },
    {
      name: "null task removes only task projection",
      steps: [{ kind: "upsert", record: { ...record(oldPath), task: null } }],
    },
    {
      name: "rename all source domains and incoming references",
      steps: [{ kind: "rename", oldPath, newPath }],
    },
    {
      name: "delete all source-owned domains",
      steps: [{ kind: "delete", path: oldPath }],
    },
    {
      name: "missing rename is a no-op",
      steps: [{ kind: "rename", oldPath: "Missing.md", newPath }],
    },
    {
      name: "missing delete still commits domains",
      steps: [{ kind: "delete", path: "Missing.md" }],
    },
    {
      name: "rename then delete",
      steps: [
        { kind: "rename", oldPath, newPath },
        { kind: "delete", path: newPath },
      ],
    },
    {
      name: "rename projection collision rolls back",
      collision: true,
      steps: [{ kind: "rename", oldPath, newPath }],
    },
    {
      name: "same-path rename retains data",
      steps: [{ kind: "rename", oldPath, newPath: oldPath }],
    },
  ];
}
export type Seed = {
  indexed: AppDatabaseIndexedFile[];
  notebook: Parameters<AppDatabase["setNotebookState"]>[1];
  search: Parameters<AppDatabase["upsertSearchDocument"]>[0];
  definition: Parameters<AppDatabase["registerProjectionDefinition"]>[0];
  sources: Parameters<AppDatabase["replaceProjectionSource"]>[0][];
};
export function seedInputs(collision = false): Seed {
  return {
    indexed: [
      record(oldPath, true),
      record(refPath),
      ...(collision ? [record(newPath)] : []),
    ],
    notebook: {
      sourcePath: oldPath,
      mtime: 1,
      updatedAt: 2,
      cells: {
        a: {
          state: "complete",
          outputs: [{ kind: "text", value: "retained" }],
        },
      },
    },
    search: {
      path: oldPath,
      name: "Original",
      extension: "md",
      checksum: "hash-1",
      content: "Retained search 🪨",
      tags: ["work"],
      tagParts: ["work"],
      tagHierarchy: ["work"],
      chunks: [
        {
          id: `${oldPath}#main`,
          text: "Retained search 🪨",
          startOffset: 0,
          endOffset: 18,
          embedding: {
            status: "ready",
            modelId: "fixture",
            vector: [1, 0],
            dimensions: 2,
            updatedAt: 2,
          },
        },
      ],
    },
    definition: {
      projectionId: "fixture/items",
      ownerPluginId: "fixture",
      schemaVersion: 1,
      configHash: "fixture-1",
      visibility: "public",
      fields: { label: { type: "string", sortable: true } },
      active: true,
      updatedAt: 1,
    },
    sources: [
      [oldPath, "main"],
      [refPath, "ref"],
      ...(collision ? [[newPath, "destination"]] : []),
    ].map(([path, id]) => ({
      projectionId: "fixture/items",
      sourcePath: path,
      sourceHash: "hash-1",
      rows: [{ id, kind: "item", data: { label: id } }],
      edges:
        id === "ref"
          ? [
              {
                sourceRowId: id,
                relation: "reference",
                targetPath: oldPath,
                ordinal: 0,
              },
            ]
          : [],
    })),
  };
}
export async function seed(db: AppDatabase, input: Seed): Promise<void> {
  for (const row of input.indexed) await db.upsertIndexedFile(row);
  await db.setNotebookState(input.notebook.sourcePath, input.notebook);
  await db.upsertSearchDocument(input.search);
  await db.registerProjectionDefinition(input.definition);
  for (const row of input.sources) await db.replaceProjectionSource(row);
}
export async function database(collision = false): Promise<AppDatabase> {
  const db = new TursoAppDatabase("indexed-mutations", {
    kind: "turso-native",
    transport: "native",
    connectionFactory: async () =>
      (await connect(":memory:", {
        experimental: ["index_method"],
      })) as TursoConnection,
  });
  await db.open();
  await seed(db, seedInputs(collision));
  return db;
}
export async function snapshot(db: AppDatabase): Promise<unknown> {
  const paths = await Promise.all(
    [oldPath, newPath, refPath].map(async (path) => ({
      path,
      indexed: (await db.getIndexedFile(path)) ?? null,
      notebook: (await db.getNotebookState(path)) ?? null,
      task: (await db.getTaskRow({ path })) ?? null,
      search: (await db.getSearchDocument(path)) ?? null,
      incoming: await db.queryMetadataLinks({ direction: "incoming", path }),
    })),
  );
  return JSON.parse(
    JSON.stringify({
      paths,
      manifest: await db.listIndexedFileManifest(),
      searchManifest: await db.listSearchDocumentManifest(),
      searchStats: await db.getSearchIndexStats(),
      projection: await db.queryProjection("fixture/items", {
        orderBy: [{ field: "id" }],
      }),
      stale: await db.queryProjection("fixture/items", {
        includeStale: true,
        orderBy: [{ field: "id" }],
      }),
      related: await db.queryRelated({
        projectionId: "fixture/items",
        rowId: "ref",
        relation: "reference",
      }),
      revision: await db.getChangeRevision(),
    }),
  );
}
export async function run(db: AppDatabase, steps: Step[]): Promise<unknown> {
  const before = await db.getChangeRevision();
  const events: unknown[] = [];
  const release = db.subscribeToChanges((change) =>
    events.push({
      revision: change.revision - before,
      domains: change.domains,
      paths: change.paths ?? [],
      renamed: change.renamed ?? null,
    }),
  );
  const states: unknown[] = [];
  try {
    for (const step of steps) {
      let failed = false;
      try {
        if (step.kind === "upsert") await db.upsertIndexedFile(step.record);
        else if (step.kind === "rename")
          await db.renameIndexedFile(step.oldPath, step.newPath);
        else await db.deleteIndexedFile(step.path);
      } catch {
        failed = true;
      }
      states.push({ failed, state: await snapshot(db) });
    }
    return { events, states };
  } finally {
    release();
  }
}
