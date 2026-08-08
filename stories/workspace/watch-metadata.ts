import type { App } from "@lapis-notes/api";

/**
 * Keep MetadataTypeManager property index fresh for Storybook/host boots.
 * Call after plugins load; dispose on teardown.
 */
export function watchMetadata(app: App): () => void {
  return app.metadataTypeManager.trackChanges();
}
