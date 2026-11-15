import type { App } from "@lapis-notes/api";
import {
  bindRepository,
  RepositoryPlugin,
  prepareRepositoryLeave,
  type RepositoryFactory,
} from "@lapis-notes/history/repository";

export type { RepositoryFactory } from "@lapis-notes/history/repository";

/** Optional native profile; the ordinary four-plugin profile stays unchanged. */
export function registerNativeRepository(
  app: App,
  factory: RepositoryFactory,
): () => void {
  const release = bindRepository(app, factory);
  try {
    app.plugins.registerStaticPlugins([
      { plugin: RepositoryPlugin, required: false, enabledByDefault: true },
    ]);
    return release;
  } catch (error) {
    release();
    throw error;
  }
}

export async function prepareNativeRepositoryLeave(app: App): Promise<void> {
  prepareRepositoryLeave(app, "reload");
  const plugin = app.plugins.plugins.get("repository-history");
  if (plugin instanceof RepositoryPlugin) await plugin.backup?.prepareLeave();
}

export async function resumeNativeRepositoryLeave(app: App): Promise<void> {
  const plugin = app.plugins.plugins.get("repository-history");
  if (plugin instanceof RepositoryPlugin) await plugin.backup?.resumeLeave();
}
