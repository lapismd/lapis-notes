import type { App } from "@lapis-notes/api";
import { PluginsView } from "./plugins-view.svelte";

const pending = new WeakMap<App, Promise<void>>();

/** Reveal the registered singleton browser, preserving its workspace placement. */
export function openPluginBrowser(
  app: App,
  pluginId?: string,
  isActive = () => true,
): Promise<void> {
  const previous = pending.get(app) ?? Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(async () => {
      if (!isActive()) return;
      const leaf =
        app.workspace.getLeavesOfType("plugins")[0] ??
        app.workspace.getLeaf(true);
      if (leaf.view.getViewType() !== "plugins")
        await leaf.setViewState({
          type: "plugins",
          state: { route: { page: "landing" } },
        });
      if (!isActive()) return;
      if (!(leaf.view instanceof PluginsView))
        throw new Error(
          "The Plugins view is not registered in this workspace.",
        );
      if (pluginId) leaf.view.showPlugin(pluginId);
      else leaf.view.home();
      await app.workspace.revealLeaf(leaf);
      if (isActive()) app.workspace.activateLeaf(leaf);
    })
    .finally(() => {
      if (pending.get(app) === next) pending.delete(app);
    });
  pending.set(app, next);
  return next;
}
