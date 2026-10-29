import type { App } from "@lapis-notes/api";

/** Host-supplied native repository services. */
export type RepositoryFactory = (app: App) => object;

const bindings = new WeakMap<App, RepositoryFactory>();

/** Optional native profile; the ordinary four-plugin profile stays unchanged. */
export function registerNativeRepository(
  app: App,
  factory: RepositoryFactory,
): () => void {
  if (bindings.has(app)) throw new Error("Repository history is already bound");
  bindings.set(app, factory);
  return () => {
    if (bindings.get(app) === factory) bindings.delete(app);
  };
}
