import {
  Plugin,
  type App,
  type MetadataProcessor,
  type PluginManifest,
} from "@lapis-notes/api";
import {
  AllProperties,
  AllPropertiesView,
  AllPropertiesViewType,
} from "$lib/views/all-properties";
import { BacklinksView, BacklinksViewType } from "$lib/views/backlinks";
import {
  FilePropertiesView,
  FilePropertiesViewType,
} from "$lib/views/file-properties";
import { MarkdownView, MarkdownViewType } from "$lib/views/markdown";
import { MediaView, MediaViewType } from "$lib/views/media";
import { OutlineView, OutlineViewType } from "$lib/views/outline";
import {
  OutgoingLinksView,
  OutgoingLinksViewType,
} from "$lib/views/outgoing-links";
import {
  createDemoAiRun,
  createMarkdownEditorExtensions,
} from "$lib/mira/extensions";
import {
  extractMetadata,
  writeFrontmatter,
} from "$lib/metadata/extract-metadata";
import { widgets } from "$lib/frontmatter/widgets";
import { registerMarkdownSettings } from "$lib/settings/register-markdown-settings";
import "$lib/styles/surfaces.css";

export { MarkdownView, MarkdownViewType };
export {
  applyFrontmatterMutation,
  FrontMatter,
  updateFrontmatterProperty,
  widgets,
} from "$lib/frontmatter";
export {
  AllProperties,
  AllPropertiesView,
  AllPropertiesViewType,
  BacklinksView,
  BacklinksViewType,
  FilePropertiesView,
  FilePropertiesViewType,
  MediaView,
  MediaViewType,
  OutlineView,
  OutlineViewType,
  OutgoingLinksView,
  OutgoingLinksViewType,
};
export { default as MarkdownSidebarPanel } from "$lib/views/sidebar-panel/markdown-sidebar-panel.svelte";

const MANIFEST: PluginManifest = {
  id: "markdown",
  name: "Markdown",
  author: "Lapis Notes",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description:
    "Mira-powered Markdown editing with source, live preview, and reading modes.",
};

function revealOrOpen(viewType: string) {
  const leaves = app.workspace.getLeavesOfType(viewType);
  if (leaves.length) {
    leaves.forEach((leaf) => app.workspace.revealLeaf(leaf));
    return;
  }
  const leaf = app.workspace.getRightLeaf(false);
  if (!leaf) return;
  void leaf.setViewState({ type: viewType }).then(() => {
    app.workspace.revealLeaf(leaf);
  });
}

export class MarkdownPlugin extends Plugin {
  private readonly aiRun = createDemoAiRun();

  constructor(app: App, manifest: PluginManifest = MANIFEST) {
    super(app, manifest);
  }

  async onload(): Promise<void> {
    registerMarkdownSettings(this);

    this.registerView(MarkdownViewType, (leaf) => new MarkdownView(leaf));
    this.registerEditorView({
      id: MarkdownViewType,
      viewType: MarkdownViewType,
      label: "Markdown",
      filenamePatterns: ["*.md", "*.markdown"],
      priority: "exclusive",
    });
    this.registerExtensions(["md", "markdown"], MarkdownViewType);

    this.registerEditorExtension((context) => {
      const mode =
        context && typeof context === "object" && "mode" in context
          ? String((context as { mode?: string }).mode)
          : "source";
      if (mode === "preview") {
        return [];
      }
      return createMarkdownEditorExtensions({
        app: this.app,
        mode: mode === "live-preview" ? "live-preview" : "source",
        sourcePath:
          context &&
          typeof context === "object" &&
          "file" in context &&
          typeof (context as { file?: string }).file === "string"
            ? (context as { file: string }).file
            : undefined,
        aiRun: this.aiRun,
      });
    }, MarkdownViewType);

    this.registerView(MediaViewType, (leaf) => new MediaView(leaf));
    this.registerEditorView({
      id: MediaViewType,
      label: "Media",
      filenamePatterns: ["*.jpg", "*.jpeg", "*.png", "*.svg", "*.bmp", "*.gif", "*.webp"],
      priority: "default",
    });
    this.registerExtensions(
      ["jpg", "jpeg", "png", "svg", "bmp", "gif", "webp"],
      MediaViewType,
    );

    this.registerView(
      AllPropertiesViewType,
      (leaf) => new AllPropertiesView(leaf),
    );
    this.addCommand({
      id: "show-all-properties",
      name: "Show all properties",
      callback: () => revealOrOpen(AllPropertiesViewType),
    });

    this.registerView(OutlineViewType, (leaf) => new OutlineView(leaf));
    this.addCommand({
      id: "show-outline",
      name: "Show outline",
      callback: () => revealOrOpen(OutlineViewType),
    });

    this.registerView(
      FilePropertiesViewType,
      (leaf) => new FilePropertiesView(leaf),
    );
    this.addCommand({
      id: "show-file-properties",
      name: "Show file properties",
      callback: () => revealOrOpen(FilePropertiesViewType),
    });

    this.registerSidebarView(
      BacklinksViewType,
      (leaf) => new BacklinksView(leaf),
      { side: "right", group: "Links", groupTitle: "Links" },
    );
    this.addCommand({
      id: "show-backlinks",
      name: "Show backlinks",
      callback: () => revealOrOpen(BacklinksViewType),
    });

    this.registerSidebarView(
      OutgoingLinksViewType,
      (leaf) => new OutgoingLinksView(leaf),
      { side: "right", group: "Links", groupTitle: "Links" },
    );
    this.addCommand({
      id: "show-outgoing-links",
      name: "Show outgoing links",
      callback: () => revealOrOpen(OutgoingLinksViewType),
    });
    this.addCommand({
      id: "show-links-sidebar",
      name: "Show links",
      callback: () => revealOrOpen(BacklinksViewType),
    });

    // MetadataCache.writeFrontmatter passes the frontmatter object itself.
    const metadataProcessor = {
      read: async (data: string) => extractMetadata(data),
      write: (data) =>
        writeFrontmatter((data ?? {}) as Record<string, unknown>),
    } as MetadataProcessor;
    this.registerMetadataProcessor(metadataProcessor, "md");
    this.registerMetadataProcessor(metadataProcessor, "markdown");

    for (const widget of widgets) {
      this.registerTypeWidget(widget);
    }

    // Path B: Mira toggles re-resolve through updateOptions.
    const onUpdated = (event: { key?: string }) => {
      const key = String(event?.key ?? "");
      if (
        key.startsWith("markdown.mira.") ||
        key === "editor.defaultEditingMode" ||
        key === "editor.defaultViewForNewTabs"
      ) {
        this.app.workspace.updateOptions();
      }
    };
    this.registerEvent(this.app.configuration.on("updated", onUpdated));
  }
}

export default MarkdownPlugin;
