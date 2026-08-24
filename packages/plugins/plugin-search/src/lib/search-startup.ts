import type { App } from "@lapis-notes/api";
import type { SearchManager, SearchRuntimeStatus } from "./search-manager";

export async function reconcileSearchAfterMetadata(
  app: Pick<App, "metadataCache">,
  manager: Pick<SearchManager, "reconcileStartup">,
): Promise<SearchRuntimeStatus> {
  await app.metadataCache.load();
  return manager.reconcileStartup();
}
