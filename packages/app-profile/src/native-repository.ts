import type { App } from "@lapis-notes/api";
import { RepositoryPlugin } from "@lapis-notes/history/repository";
import {
  bindRepository,
  type RepositoryFactory,
} from "@lapis-notes/history/repository/controllers/services";
export type { RepositoryFactory } from "@lapis-notes/history/repository/controllers/services";

/** Optional native profile; the ordinary four-plugin profile stays unchanged. */
export function registerNativeRepository(
  app: App,
  factory: RepositoryFactory,
): () => void {
  const dispose = bindRepository(app, factory);
  try {
    app.plugins.registerStaticPlugins([
      { plugin: RepositoryPlugin, required: false, enabledByDefault: true },
    ]);
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
