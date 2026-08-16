import {
  dirname,
  md5,
  normalizePath,
  Plugin,
  TFile,
  type App,
  type PluginManifest,
} from "@lapis-notes/api";
import {
  consumeSuppressedHash,
  shouldReplaceLatestModify,
} from "./history-capture";
import {
  mergeHistorySettings,
  patchHistorySettings,
  type HistoryPluginSettings,
  type HistoryPluginSettingsPatch,
} from "./history-settings";
import { HistorySettingsTab } from "./history-settings-tab";
import { registerHistorySettings } from "./register-history-settings";
import { isHistoryTrackedFile } from "./history-tracking";
import { HistoryCompareView } from "./history-compare-view";
import { HistoryView } from "./history-view";
import {
  HistoryCompareViewType,
  HistoryViewType,
} from "./history-view-type";

export const HISTORY_PLUGIN_ID = "history";

const HISTORY_MANIFEST: PluginManifest = {
  id: HISTORY_PLUGIN_ID,
  name: "History",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description: "File history",
  author: "Lapis Notes",
};

export type HistoryCaptureEventType =
  | "baseline"
  | "create"
  | "modify"
  | "rename"
  | "delete"
  | "restore";

export type HistoryCompareMode = "current" | "previous" | "selected";

export interface HistoryRevision {
  revisionId: string;
  path: string;
  previousPath?: string;
  eventType: HistoryCaptureEventType;
  createdAt: number;
  sourceMtime?: number;
  sourceSize?: number;
  contentHash: string;
  content: string;
}

export interface HistoryFileHistory {
  file: {
    id: string;
    path: string;
    deleted: boolean;
  };
  revisions: HistoryRevision[];
}

export interface HistoryViewModel {
  filePath: string | null;
  history: HistoryFileHistory | null;
  currentContent: string;
  fileExists: boolean;
}

export interface HistoryCompareViewState {
  filePath: string;
  revisionId: string;
  compareMode: HistoryCompareMode;
  otherRevisionId?: string;
  sourceLeafId?: string;
}

export interface HistoryComparisonModel {
  filePath: string;
  history: HistoryFileHistory;
  currentContent: string;
  fileExists: boolean;
  compareMode: HistoryCompareMode;
  selectedRevision: HistoryRevision;
  previousRevision: HistoryRevision | null;
  otherRevision: HistoryRevision | null;
  compareBaseText: string;
  compareNewText: string;
  beforeLabel: string;
  afterLabel: string;
}

export interface HistoryCompareAnchor {
  filePath: string;
  revisionId: string;
}

function orderNewestFirst(revisions: HistoryRevision[]): HistoryRevision[] {
  return [...revisions].sort((left, right) => right.createdAt - left.createdAt);
}

function toPluginHistory(
  history: {
    file: { fileId: string; currentPath: string; deleted: boolean };
    revisions: Array<{
      revisionId: string;
      currentPath: string;
      capturedPath: string;
      eventType: HistoryCaptureEventType;
      createdAt: number;
      sourceMtime?: number;
      sourceSize?: number;
      contentHash: string;
      content: string;
    }>;
  } | null,
): HistoryFileHistory | null {
  if (!history) return null;
  return {
    file: {
      id: history.file.fileId,
      path: history.file.currentPath,
      deleted: history.file.deleted,
    },
    revisions: orderNewestFirst(
      history.revisions.map((revision) => ({
        revisionId: revision.revisionId,
        path: revision.currentPath,
        previousPath:
          revision.eventType === "rename" ? revision.capturedPath : undefined,
        eventType: revision.eventType,
        createdAt: revision.createdAt,
        sourceMtime: revision.sourceMtime,
        sourceSize: revision.sourceSize,
        contentHash: revision.contentHash,
        content: revision.content,
      })),
    ),
  };
}

export class HistoryPlugin extends Plugin {
  private settings: HistoryPluginSettings = mergeHistorySettings(null);
  private currentFilePath: string | null = null;
  private compareAnchor: HistoryCompareAnchor | null = null;
  private readonly pendingCaptures = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly lastModifyStoredAt = new Map<string, number>();
  private readonly suppressedHashes = new Map<string, string>();
  private readonly listeners = new Set<() => void>();

  constructor(app: App, manifest: PluginManifest = HISTORY_MANIFEST) {
    super(app, manifest);
  }

  async onload(): Promise<void> {
    this.settings = mergeHistorySettings(await this.loadData());
    this.addSettingTab(new HistorySettingsTab(this.app, this));
    registerHistorySettings(this);

    this.registerSidebarView(
      HistoryViewType,
      (leaf) => new HistoryView(leaf),
      { side: "right", title: "History", icon: "history" },
      {
        kind: "command",
        command: {
          id: "open-file-history",
          name: "Open file history",
          callback: () => void this.openHistoryView(),
        },
      },
    );
    this.registerView(
      HistoryCompareViewType,
      (leaf) => new HistoryCompareView(this, leaf),
      { kind: "internal" },
    );

    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (file instanceof TFile) {
          this.setCurrentFilePath(file.path);
          void this.ensureBaselineForFile(file);
        }
      }),
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        const file = this.getFocusedFile();
        if (file) this.setCurrentFilePath(file.path);
      }),
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file instanceof TFile) this.scheduleCapture(file, "create");
      }),
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile) this.scheduleCapture(file, "modify");
      }),
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!(file instanceof TFile)) return;
        if (this.currentFilePath === oldPath) this.setCurrentFilePath(file.path);
        if (this.compareAnchor?.filePath === oldPath) {
          this.compareAnchor = {
            filePath: file.path,
            revisionId: this.compareAnchor.revisionId,
          };
        }
        void this.captureRename(file, oldPath);
      }),
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof TFile) void this.captureDelete(file);
      }),
    );

    const initialFile = this.getFocusedFile();
    if (initialFile) {
      this.setCurrentFilePath(initialFile.path);
      void this.ensureBaselineForFile(initialFile);
    }

    this.register(() => {
      for (const timer of this.pendingCaptures.values()) clearTimeout(timer);
      this.pendingCaptures.clear();
    });
  }

  getSettings(): HistoryPluginSettings {
    return mergeHistorySettings(this.settings);
  }

  async updateSettings(patch: HistoryPluginSettingsPatch): Promise<void> {
    this.settings = patchHistorySettings(this.settings, patch);
    await this.saveData(this.settings);
    this.notify();
  }

  onHistoryChanged(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getCompareAnchor(): HistoryCompareAnchor | null {
    return this.compareAnchor;
  }

  setCompareAnchor(anchor: HistoryCompareAnchor | null): void {
    this.compareAnchor = anchor;
    this.notify();
  }

  toggleCompareAnchor(filePath: string, revisionId: string): void {
    if (
      this.compareAnchor?.filePath === filePath &&
      this.compareAnchor.revisionId === revisionId
    ) {
      this.setCompareAnchor(null);
      return;
    }
    this.setCompareAnchor({ filePath, revisionId });
  }

  async openHistoryView(filePath?: string): Promise<void> {
    const file = filePath
      ? this.app.vault.getFileByPath(normalizePath(filePath))
      : this.getFocusedFile();
    if (file instanceof TFile) {
      this.setCurrentFilePath(file.path);
      await this.ensureBaselineForFile(file);
    } else if (filePath) {
      this.setCurrentFilePath(filePath);
    }

    const existing = this.app.workspace.getLeavesOfType(HistoryViewType)[0];
    const leaf =
      existing ?? this.app.workspace.ensureSideLeaf(HistoryViewType, "right");
    await leaf.setViewState({ type: HistoryViewType });
    this.app.workspace.activateLeaf(leaf, {
      focusRootHost: false,
      source: "api",
      operation: "open-file-history",
    });
    await this.app.workspace.revealLeaf(leaf);
  }

  async openHistoryCompareView(state: HistoryCompareViewState): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(HistoryCompareViewType);
    const leaf = leaves[0] ?? this.app.workspace.getLeaf("tab");
    await leaf.setViewState({
      type: HistoryCompareViewType,
      state: {
        ...state,
        sourceLeafId:
          state.sourceLeafId ?? this.app.workspace.activeLeaf?.id ?? undefined,
      },
    });
    this.app.workspace.activateLeaf(leaf, {
      focusRootHost: false,
      source: "api",
      operation: "open-history-compare",
    });
    await this.app.workspace.revealLeaf(leaf);
  }

  closeHistoryCompareView(sourceLeafId?: string): void {
    const sourceLeaf = sourceLeafId
      ? this.app.workspace.getLeafById(sourceLeafId)
      : null;
    if (sourceLeaf) {
      this.app.workspace.activateLeaf(sourceLeaf, {
        focusRootHost: false,
        source: "api",
        operation: "close-history-compare",
      });
      void this.app.workspace.revealLeaf(sourceLeaf);
    }
    this.app.workspace.getLeavesOfType(HistoryCompareViewType)[0]?.detach();
  }

  async getHistoryViewModel(): Promise<HistoryViewModel> {
    const file = this.getFocusedFile();
    if (file) {
      this.setCurrentFilePath(file.path);
      await this.ensureBaselineForFile(file);
      const [rawHistory, currentContent] = await Promise.all([
        this.app.appDatabase.getFileHistory(file.path),
        this.app.vault.cachedRead(file).catch(() => ""),
      ]);
      return {
        filePath: file.path,
        history: toPluginHistory(rawHistory),
        currentContent,
        fileExists: true,
      };
    }

    if (!this.currentFilePath) {
      return {
        filePath: null,
        history: null,
        currentContent: "",
        fileExists: false,
      };
    }

    return {
      filePath: this.currentFilePath,
      history: toPluginHistory(
        await this.app.appDatabase.getFileHistory(this.currentFilePath),
      ),
      currentContent: "",
      fileExists: false,
    };
  }

  async getHistoryComparisonModel(
    state: HistoryCompareViewState,
  ): Promise<HistoryComparisonModel> {
    const filePath = normalizePath(state.filePath);
    const history = toPluginHistory(
      await this.app.appDatabase.getFileHistory(filePath),
    );
    if (!history) throw new Error("No stored history found for this file");

    const selectedRevision = history.revisions.find(
      (revision) => revision.revisionId === state.revisionId,
    );
    if (!selectedRevision) {
      throw new Error("Selected revision is no longer available");
    }

    const selectedIndex = history.revisions.findIndex(
      (revision) => revision.revisionId === selectedRevision.revisionId,
    );
    const previousRevision =
      selectedIndex >= 0 ? (history.revisions[selectedIndex + 1] ?? null) : null;
    const otherRevision = state.otherRevisionId
      ? (history.revisions.find(
          (revision) => revision.revisionId === state.otherRevisionId,
        ) ?? null)
      : null;

    const file = this.app.vault.getFileByPath(filePath);
    const fileExists = file instanceof TFile;
    const currentContent = fileExists
      ? await this.app.vault.cachedRead(file).catch(() => "")
      : "";

    const compareMode =
      state.compareMode === "selected" && otherRevision
        ? "selected"
        : state.compareMode === "previous" && previousRevision
          ? "previous"
          : "current";

    const pair =
      compareMode === "selected" && otherRevision
        ? [selectedRevision, otherRevision].sort(
            (left, right) => left.createdAt - right.createdAt,
          )
        : compareMode === "previous" && previousRevision
          ? [previousRevision, selectedRevision]
          : [selectedRevision, { content: currentContent, createdAt: Date.now() }];

    return {
      filePath,
      history,
      currentContent,
      fileExists,
      compareMode,
      selectedRevision,
      previousRevision,
      otherRevision,
      compareBaseText: pair[0]?.content ?? "",
      compareNewText: pair[1]?.content ?? "",
      beforeLabel:
        compareMode === "current"
          ? "Selected revision"
          : formatRevisionLabel(pair[0]?.createdAt),
      afterLabel:
        compareMode === "current"
          ? fileExists
            ? "Current file"
            : "Latest"
          : formatRevisionLabel(pair[1]?.createdAt),
    };
  }

  async restoreRevision(
    filePath: string,
    revision: HistoryRevision,
  ): Promise<void> {
    const normalizedPath = normalizePath(filePath);
    this.suppressedHashes.set(normalizedPath, revision.contentHash);

    const existingFile = this.app.vault.getFileByPath(normalizedPath);
    if (existingFile instanceof TFile) {
      await this.app.vault.modify(existingFile, revision.content);
    } else {
      await this.app.vault.mkpath(dirname(normalizedPath));
      await this.app.vault.create(normalizedPath, revision.content);
    }

    const nextFile = this.app.vault.getFileByPath(normalizedPath);
    await this.app.appDatabase.storeFileHistoryRevision({
      path: normalizedPath,
      eventType: "restore",
      createdAt: Date.now(),
      sourceMtime: nextFile instanceof TFile ? nextFile.stat.mtime : undefined,
      sourceSize:
        nextFile instanceof TFile
          ? nextFile.stat.size
          : revision.content.length,
      contentHash: revision.contentHash,
      content: revision.content,
      maxRevisions: this.settings.retentionCount,
    });

    this.setCurrentFilePath(normalizedPath);
    this.notify();
  }

  async saveCurrentFileContent(
    filePath: string,
    content: string,
  ): Promise<void> {
    const normalizedPath = normalizePath(filePath);
    const existingFile = this.app.vault.getFileByPath(normalizedPath);
    if (existingFile instanceof TFile) {
      const current = await this.app.vault.cachedRead(existingFile).catch(() => null);
      if (current === content) return;
      await this.app.vault.modify(existingFile, content);
    } else {
      await this.app.vault.mkpath(dirname(normalizedPath));
      await this.app.vault.create(normalizedPath, content);
    }
    this.setCurrentFilePath(normalizedPath);
    this.notify();
  }

  getFocusedFile(): TFile | null {
    const activeLeafFile = (
      this.app.workspace.activeLeaf?.view as { file?: unknown } | undefined
    )?.file;
    if (activeLeafFile instanceof TFile) return activeLeafFile;
    const activeFile = this.app.workspace.getActiveFile?.();
    return activeFile instanceof TFile ? activeFile : null;
  }

  private setCurrentFilePath(path: string | null): void {
    const normalizedPath = path ? normalizePath(path) : null;
    if (this.currentFilePath === normalizedPath) return;
    this.currentFilePath = normalizedPath;
    if (this.compareAnchor && this.compareAnchor.filePath !== normalizedPath) {
      this.compareAnchor = null;
    }
    this.notify();
  }

  private scheduleCapture(
    file: TFile,
    eventType: "create" | "modify",
  ): void {
    if (!isHistoryTrackedFile(file, this.settings)) return;
    const path = normalizePath(file.path);
    const existing = this.pendingCaptures.get(path);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.pendingCaptures.delete(path);
      void this.captureSnapshot(file, eventType);
    }, this.settings.debounceMs);
    this.pendingCaptures.set(path, timer);
  }

  private async ensureBaselineForFile(file: TFile): Promise<void> {
    if (!isHistoryTrackedFile(file, this.settings)) return;
    const existing = await this.app.appDatabase.getFileHistory(file.path);
    if (existing) return;
    await this.captureSnapshot(file, "baseline");
  }

  private async captureSnapshot(
    file: TFile,
    eventType: Extract<HistoryCaptureEventType, "baseline" | "create" | "modify">,
  ): Promise<void> {
    if (!isHistoryTrackedFile(file, this.settings)) return;
    let content: string;
    try {
      content = await this.app.vault.cachedRead(file);
    } catch {
      return;
    }

    const path = normalizePath(file.path);
    const contentHash = md5(content);
    if (consumeSuppressedHash(this.suppressedHashes, path, contentHash)) {
      return;
    }

    const existing = await this.app.appDatabase.getFileHistory(path);
    const latest = existing?.revisions.at(-1);
    const replaceLatest = shouldReplaceLatestModify(
      eventType,
      latest?.eventType,
      this.lastModifyStoredAt.get(path),
      this.settings.mergeWindowMs,
    );

    const result = await this.app.appDatabase.storeFileHistoryRevision({
      path,
      eventType,
      createdAt: Date.now(),
      sourceMtime: file.stat.mtime,
      sourceSize: file.stat.size,
      contentHash,
      content,
      maxRevisions: this.settings.retentionCount,
      replaceLatest,
    });

    if (result.stored) {
      if (eventType === "modify") this.lastModifyStoredAt.set(path, Date.now());
      this.notify();
    }
  }

  private async captureRename(file: TFile, oldPath: string): Promise<void> {
    const hadHistory = await this.app.appDatabase.getFileHistory(oldPath);
    if (!hadHistory && !isHistoryTrackedFile(file, this.settings)) return;

    let content = hadHistory?.revisions.at(-1)?.content ?? "";
    try {
      if (isHistoryTrackedFile(file, this.settings)) {
        content = await this.app.vault.cachedRead(file);
      }
    } catch {
      return;
    }

    const result = await this.app.appDatabase.storeFileHistoryRevision({
      path: file.path,
      previousPath: oldPath,
      eventType: "rename",
      createdAt: Date.now(),
      sourceMtime: file.stat.mtime,
      sourceSize: file.stat.size,
      contentHash: content ? md5(content) : hadHistory?.revisions.at(-1)?.contentHash,
      content,
      maxRevisions: this.settings.retentionCount,
    });
    if (result.stored) this.notify();
  }

  private async captureDelete(file: TFile): Promise<void> {
    const path = normalizePath(file.path);
    const existing = await this.app.appDatabase.getFileHistory(path);
    if (!existing) return;
    const result = await this.app.appDatabase.storeFileHistoryRevision({
      path,
      eventType: "delete",
      createdAt: Date.now(),
      sourceMtime: file.stat.mtime,
      sourceSize: file.stat.size,
      maxRevisions: this.settings.retentionCount,
    });
    if (result.stored) this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

function formatRevisionLabel(value: number | undefined): string {
  return value ? new Date(value).toLocaleString() : "Revision";
}

export default HistoryPlugin;
