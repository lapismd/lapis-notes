import type { AppDatabaseWorkerRequestInput } from "./app-database-worker-protocol.ts";

import { DenoAppDatabaseHost } from "./app-database.ts";

const directory = await Deno.makeTempDir({ prefix: "lapis-database-worker-" });
const host = new DenoAppDatabaseHost(directory, async () => undefined, {
  resolveDatabasePath: async () => `${directory}/smoke.turso`,
});
function invoke(request: AppDatabaseWorkerRequestInput): Promise<unknown> {
  if (request.type === "open") return host.open(request);
  if (request.type === "close") return host.close(request);
  if (request.type === "close-all") return host.closeAll();
  return host.invoke(request);
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
  await host.closeAll();
  await Deno.remove(directory, { recursive: true }).catch(() => undefined);
}
