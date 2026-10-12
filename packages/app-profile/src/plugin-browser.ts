import type { App } from "@lapis-notes/api";
import { openPluginBrowser, PluginsView } from "@lapis-notes/workspace";

/** Register the default app browser before restoring persisted workspace leaves. */
export function registerNotesPluginBrowser(app: App): () => void {
  app.workspace.registerView("plugins", (leaf) => new PluginsView(leaf));
  let pending: Promise<void> | null = null;
  let disposed = false;
  const open = () => {
    if (disposed) return Promise.resolve();
    if (pending) return pending;
    pending = openPluginBrowser(app, undefined, () => !disposed).finally(() => {
      pending = null;
    });
    return pending;
  };
  const removeRibbon = app.workspace.leftRibbon.addItem({
    id: "app:plugins",
    title: "Plugins",
    icon: "package",
    hidden: false,
    callback: () => void open(),
  });
  app.commands.registerCommand({
    id: "app:open-plugins",
    name: "Open Plugins",
    icon: "package",
    callback: () => void open(),
  });
  return () => {
    if (disposed) return;
    disposed = true;
    for (const leaf of app.workspace.getLeavesOfType("plugins")) {
      if (leaf.view instanceof PluginsView) leaf.view.unload();
    }
    removeRibbon();
    app.commands.unregisterCommand("app:open-plugins");
    app.workspace.unregisterView("plugins");
  };
}
