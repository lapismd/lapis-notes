import type {
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerRequestInput,
  AppDatabaseWorkerResponse,
} from "./app-database-worker-protocol.ts";

const directory = await Deno.makeTempDir({ prefix: "lapis-database-worker-" });
const worker = new Worker(
  new URL("./app-database-worker.ts", import.meta.url).href,
  { type: "module", name: "lapis-app-database-smoke" },
);
let id = 0;
const pending = new Map<
  number,
  { resolve(value: unknown): void; reject(error: unknown): void }
>();
worker.onmessage = (event: MessageEvent<AppDatabaseWorkerResponse>) => {
  if (event.data.type !== "result") return;
  const request = pending.get(event.data.id);
  if (!request) return;
  pending.delete(event.data.id);
  if (event.data.ok) request.resolve(event.data.value);
  else request.reject(new Error(event.data.error.message));
};
worker.onerror = (event) => {
  for (const request of pending.values()) request.reject(event.error);
  pending.clear();
};

function invoke(request: AppDatabaseWorkerRequestInput): Promise<unknown> {
  const requestId = ++id;
  return new Promise((resolve, reject) => {
    pending.set(requestId, { resolve, reject });
    worker.postMessage({
      ...request,
      id: requestId,
    } as AppDatabaseWorkerRequest);
  });
}

try {
  const descriptor = await invoke({
    type: "open",
    databaseId: "smoke-database",
    vaultId: "smoke-vault",
    path: `${directory}/smoke.turso`,
  });
  if (
    !descriptor ||
    typeof descriptor !== "object" ||
    (descriptor as { providerId?: unknown }).providerId !==
      "turso-native-desktop"
  ) {
    throw new Error("Native database worker returned the wrong descriptor");
  }
  await invoke({
    type: "invoke",
    databaseId: "smoke-database",
    method: "upsertSearchDocument",
    args: [
      {
        path: "worker-smoke.md",
        name: "Worker smoke",
        extension: "md",
        checksum: "worker-smoke-v1",
        content: "native worker full text",
        tags: [],
        tagParts: [],
        tagHierarchy: [],
      },
    ],
  });
  const value = await invoke({
    type: "invoke",
    databaseId: "smoke-database",
    method: "getSearchDocument",
    args: ["worker-smoke.md"],
  });
  if (
    (value as { checksum?: unknown } | undefined)?.checksum !==
    "worker-smoke-v1"
  ) {
    throw new Error("Native database worker did not persist the indexed row");
  }
  await invoke({ type: "close-all" });
  console.log("desktop database worker smoke passed");
} finally {
  worker.terminate();
  await Deno.remove(directory, { recursive: true }).catch(() => undefined);
}
