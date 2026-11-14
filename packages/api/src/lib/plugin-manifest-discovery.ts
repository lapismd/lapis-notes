import type { App } from "./context.svelte";
import type { FileView } from "./view.svelte";
import type {
  LapisContributionIndexEntry,
  LapisMarkdownViewMenuItemContribution,
  LapisRibbonItemContribution,
} from "./lapis-extension";
import type { MarkdownViewMenuItemProvider } from "./markdown";

type Invoke = (command: string, prepare?: () => boolean) => Promise<void>;

/** Install discovery only; the existing plugin runtime still owns its actions. */
export function installManifestDiscovery(
  app: App,
  entry: LapisContributionIndexEntry,
  invoke: Invoke,
): () => void {
  let installed = true;
  const contribution = entry.contribution as LapisRibbonItemContribution;
  if (entry.kind === "ribbonItems") {
    const dispose = app.workspace.leftRibbon.addItem({
      id: `${entry.pluginId}:${contribution.title}`,
      title: contribution.title,
      icon: contribution.icon,
      hidden: false,
      callback: () => (installed ? invoke(contribution.command) : undefined),
    });
    return () => {
      installed = false;
      dispose();
    };
  }
  const menuItem = entry.contribution as LapisMarkdownViewMenuItemContribution;
  const provider: MarkdownViewMenuItemProvider = ({ menu, leaf, file }) => {
    if (!installed) return;
    const path = file.path;
    const current = () =>
      app.workspace.getLeafById(leaf.id) === leaf &&
      (leaf.view as FileView | null)?.file?.path === path;
    menu.addItem((item) => {
      item.setSection(menuItem.section ?? "view").setTitle(menuItem.title);
      if (menuItem.icon) item.setIcon(menuItem.icon);
      item.onClick(() => {
        if (!installed || !current()) return;
        return invoke(menuItem.command, () => {
          if (!current()) return false;
          app.workspace.activateLeaf(leaf, {
            focusRootHost: false,
            source: "api",
            operation: "manifest-markdown-menu",
          });
          return true;
        });
      });
    });
  };
  app.registerMarkdownViewMenuItem(provider);
  return () => {
    installed = false;
    app.unregisterMarkdownViewMenuItem(provider);
  };
}
