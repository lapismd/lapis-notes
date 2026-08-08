import { Plugin, type App, type PluginManifest } from "@lapis-notes/api";
import { TagsView, TagsViewType } from "./tags";

const TAGS_MANIFEST: PluginManifest = {
  id: "tags",
  name: "Tags",
  author: "Lapis Notes",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description: "Tags sidebar intake for the editor demo.",
};

export class TagsDemoPlugin extends Plugin {
  constructor(app: App) {
    super(app, TAGS_MANIFEST);
  }

  onload(): void {
    this.registerView(TagsViewType, (leaf) => new TagsView(leaf));
    this.addCommand({
      id: "show-tags",
      name: "Show tags",
      callback: () => {
        const leaves = this.app.workspace.getLeavesOfType(TagsViewType);
        if (leaves.length) {
          leaves.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
          return;
        }
        const leaf = this.app.workspace.getRightLeaf(false);
        if (!leaf) return;
        void leaf.setViewState({ type: TagsViewType }).then(() => {
          this.app.workspace.revealLeaf(leaf);
        });
      },
    });
  }
}
