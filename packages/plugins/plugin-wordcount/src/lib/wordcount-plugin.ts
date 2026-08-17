import {
  debounce,
  Menu,
  Plugin,
  TextFileView,
  type App,
  type PluginManifest,
} from "@lapis-notes/api";
import { readingMinutes, textForWordCount } from "./counts";
import { pluginField, statusBarEditorPlugin } from "./extensions";
import {
  WORDCOUNT_DEFAULT_READING_SPEED,
  WORDCOUNT_PLUGIN_ID,
  WORDCOUNT_READING_TIME_COMMAND_ID,
  WORDCOUNT_STATUS_ID,
} from "./ids";
import { WordCountStatus } from "./status-item";
import manifestSpec from "../../manifest.json";

export {
  WORDCOUNT_DEFAULT_READING_SPEED,
  WORDCOUNT_PLUGIN_ID,
  WORDCOUNT_READING_TIME_COMMAND_ID,
  WORDCOUNT_STATUS_ID,
};

export class WordCountPlugin extends Plugin {
  readonly status = new WordCountStatus(
    this.app.statusBar,
    WORDCOUNT_READING_TIME_COMMAND_ID,
    WORDCOUNT_PLUGIN_ID,
  );
  readonly scheduleStatusUpdate = debounce((text: string) => {
    this.status.show(text);
  }, 20);

  constructor(
    app: App,
    manifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, manifest);
  }

  onload(): void {
    this.addCommand({
      id: "reading-time",
      name: "Reading time",
      callback: () => this.showReadingTime(),
    });
    this.registerEditorExtension([
      pluginField.init(() => this),
      statusBarEditorPlugin,
    ]);
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        this.syncActiveLeaf(leaf ?? null);
      }),
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        const leaf = this.app.workspace.activeLeaf ?? null;
        if (leaf?.view instanceof TextFileView) {
          this.syncActiveLeaf(leaf);
        }
      }),
    );
    this.syncActiveLeaf(this.app.workspace.activeLeaf ?? null);
  }

  onunload(): void {
    this.scheduleStatusUpdate.cancel();
    this.status.hide();
  }

  syncActiveLeaf(leaf: { view?: unknown } | null): void {
    if (!leaf || !(leaf.view instanceof TextFileView)) {
      this.status.hide();
      return;
    }
    try {
      this.scheduleStatusUpdate(textForWordCount(leaf.view.editor));
    } catch {
      this.status.hide();
    }
  }

  showReadingTime(): void {
    const minutes = readingMinutes(
      this.status.content,
      WORDCOUNT_DEFAULT_READING_SPEED,
    );
    const menu = new Menu();
    menu.addItem((item) =>
      item.setTitle(`${minutes} min read`).setIcon("book-open"),
    );
    const host =
      typeof document === "undefined"
        ? null
        : document.querySelector<HTMLElement>(
            `[data-status-bar-item-id="${WORDCOUNT_STATUS_ID}"]`,
          );
    const rect = host?.getBoundingClientRect();
    menu.showAtPosition({
      x: rect?.left ?? 0,
      y: (rect?.bottom ?? 0) + 4,
    });
  }
}
