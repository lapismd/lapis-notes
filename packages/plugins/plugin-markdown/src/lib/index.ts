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
import {
  Backlinks,
  BacklinksLegacyViewTypes,
  BacklinksView,
  BacklinksViewType,
} from "$lib/views/backlinks";
import {
  FileProperties,
  FilePropertiesLegacyViewTypes,
  FilePropertiesView,
  FilePropertiesViewType,
} from "$lib/views/file-properties";
import { MarkdownView, MarkdownViewType } from "$lib/views/markdown";
import { MediaView, MediaViewType } from "$lib/views/media";
import {
  Outline,
  OutlineLegacyViewTypes,
  OutlineView,
  OutlineViewType,
} from "$lib/views/outline";
import {
  OutgoingLinks,
  OutgoingLinksLegacyViewTypes,
  OutgoingLinksView,
  OutgoingLinksViewType,
} from "$lib/views/outgoing-links";
import {
  Tags,
  TagsLegacyViewTypes,
  TagsView,
  TagsViewType,
} from "$lib/views/tags";
import {
  createDemoAiRun,
  createMarkdownEditorExtensions,
} from "$lib/mira/extensions";
import {
  MARKDOWN_PANEL_VIEW_COMMANDS,
  revealOrOpenMarkdownPanel,
  type MarkdownPanelViewType,
} from "$lib/view-commands";
import { writeFrontmatter } from "$lib/metadata/extract-metadata";
import { parseMetadataOffThread } from "$lib/metadata/parse-metadata";
import { widgets } from "$lib/frontmatter/widgets";
import { registerMarkdownSettings } from "$lib/settings/register-markdown-settings";
import "$lib/styles/surfaces.css";
import "@lapismd/mira-editor/styles.css";
import { createMarkdownNoteTools } from "$lib/agent-tools/note-tools";

export { FileEmbed, MarkdownEmbed, NoteLink } from "$lib/components/embed";
export { createLapisMiraFileAdapter } from "$lib/mira/file-adapter";
export {
  createMarkdownNoteTools,
  createNotesListTool,
  createNotesPatchTool,
  createNotesReadTool,
} from "$lib/agent-tools/note-tools";

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
  Backlinks,
  BacklinksLegacyViewTypes,
  BacklinksView,
  BacklinksViewType,
  FileProperties,
  FilePropertiesLegacyViewTypes,
  FilePropertiesView,
  FilePropertiesViewType,
  MediaView,
  MediaViewType,
  Outline,
  OutlineLegacyViewTypes,
  OutlineView,
  OutlineViewType,
  OutgoingLinks,
  OutgoingLinksLegacyViewTypes,
  OutgoingLinksView,
  OutgoingLinksViewType,
  Tags,
  TagsLegacyViewTypes,
  TagsView,
  TagsViewType,
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

export class MarkdownPlugin extends Plugin {
  private readonly aiRun = createDemoAiRun();

  constructor(app: App, manifest: PluginManifest = MANIFEST) {
    super(app, manifest);
  }

  async onload(): Promise<void> {
    registerMarkdownSettings(this);
    for (const tool of createMarkdownNoteTools(this.app.vault)) {
      this.registerAgentTool(tool);
    }

    this.registerView(MarkdownViewType, (leaf) => new MarkdownView(leaf), {
      kind: "file",
    });
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

    this.registerView(MediaViewType, (leaf) => new MediaView(leaf), {
      kind: "file",
    });
    this.registerEditorView({
      id: MediaViewType,
      label: "Media",
      filenamePatterns: [
        "*.jpg",
        "*.jpeg",
        "*.png",
        "*.svg",
        "*.bmp",
        "*.gif",
        "*.webp",
      ],
      priority: "default",
    });
    this.registerExtensions(
      ["jpg", "jpeg", "png", "svg", "bmp", "gif", "webp"],
      MediaViewType,
    );

    const panelViewCreators = {
      [AllPropertiesViewType]: (leaf) => new AllPropertiesView(leaf),
      [OutlineViewType]: (leaf) => new OutlineView(leaf),
      [FilePropertiesViewType]: (leaf) => new FilePropertiesView(leaf),
      [BacklinksViewType]: (leaf) => new BacklinksView(leaf),
      [OutgoingLinksViewType]: (leaf) => new OutgoingLinksView(leaf),
      [TagsViewType]: (leaf) => new TagsView(leaf),
    } satisfies Record<
      MarkdownPanelViewType,
      Parameters<Plugin["registerView"]>[1]
    >;

    for (const registration of MARKDOWN_PANEL_VIEW_COMMANDS) {
      const viewCreator = panelViewCreators[registration.viewType];
      if ("sidebar" in registration) {
        this.registerSidebarView(
          registration.viewType,
          viewCreator,
          registration.sidebar,
          {
            kind: "command",
            command: {
              ...registration.command,
              callback: () =>
                revealOrOpenMarkdownPanel(this.app, registration.viewType),
            },
          },
        );
      } else {
        this.registerView(registration.viewType, viewCreator, {
          kind: "command",
          command: {
            ...registration.command,
            callback: () =>
              revealOrOpenMarkdownPanel(this.app, registration.viewType),
          },
        });
      }

      for (const legacyViewType of registration.legacyViewTypes) {
        this.registerView(legacyViewType, viewCreator, {
          kind: "alias",
          canonicalViewType: registration.viewType,
        });
      }
    }

    // MetadataCache.writeFrontmatter passes the frontmatter object itself.
    const metadataProcessor = {
      read: async (data: string) => parseMetadataOffThread(data),
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
