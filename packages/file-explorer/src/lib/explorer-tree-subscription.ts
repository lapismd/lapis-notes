import type { App } from "@lapis-notes/api";

export function subscribeExplorerVaultTreeChanges(
  app: App,
  onChange: () => void,
): () => void {
  const loaded = app.vault.on("load", onChange);
  const created = app.vault.on("create", onChange);
  const deleted = app.vault.on("delete", onChange);
  const renamed = app.vault.on("rename", onChange);

  return () => {
    app.vault.offref(loaded);
    app.vault.offref(created);
    app.vault.offref(deleted);
    app.vault.offref(renamed);
  };
}
