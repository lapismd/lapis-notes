/* eslint-disable @typescript-eslint/no-explicit-any */

import { EventDispatcher, type DefaultEventMap, type EventMap } from "./events";
import {
  EmptyView,
  FileView,
  TextFileView,
  View,
  type ViewState,
  type ViewStateResult,
} from "./view.svelte";
import type { Menu } from "./menu.svelte";
import { TFile, type TAbstractFile } from "./storage/fs";
import type { Editor, MarkdownFileInfo } from "./editor.svelte";
import { tick, untrack } from "svelte";
import { toast } from "svelte-sonner";
import {
  SidebarState,
  type SidebarStateProps,
} from "@lapis-notes/ui/sidebar-custom";
import { uniqueId } from "./utils";
import { normalizeWorkspaceJson } from "./workspace-layout-normalizer";
import { debounce, isEqual } from "lodash-es";
import { dirname, joinPath } from "./storage";
import { HistoryManager } from "./history.svelte";
import type { TransactionSpec } from "@codemirror/state";
import type { App } from "./context.svelte";
import type { PluginCatalogEntry } from "./plugin-distribution";
import {
  EditorViewRegistry,
  type EditorViewContribution,
  type RegisteredEditorViewContribution,
} from "./editor-view-registry";
import {
  compareEditorAssociationPatternSpecificity,
  matchesEditorAssociationGlob,
} from "./glob";
import {
  captureLeafViewState,
  cloneViewState,
  historyFilePathForViewState,
  resolveViewForOpenFile,
} from "./open-file";
import { promptConfirm } from "./prompt-confirm";
import {
  isAbortError,
  withPluginInstallProgress,
} from "./plugin-install-progress";
import {
  AppShellController,
  type EditorViewContribution as DesignEditorViewContribution,
  type WorkspaceBreadcrumb as DesignWorkspaceBreadcrumb,
  type WorkspaceDragEvent as DesignWorkspaceDragEvent,
  type WorkspaceLayoutChangeEvent as DesignWorkspaceLayoutChangeEvent,
  type WorkspaceLayoutDropEvent as DesignWorkspaceLayoutDropEvent,
  type WorkspaceViewChrome as DesignWorkspaceViewChrome,
  type WorkspaceViewContext as DesignWorkspaceViewContext,
} from "@lapismd/design-core/workspace/core";
import { notificationsPlugin } from "@lapismd/design-core/workspace/plugins/notifications";
import { setWorkspaceHostBinding } from "./workspace-host-internal";

const DEFAULT_LAPIS_LOGO_URL = new URL(
  "./assets/lapis-logo.svg",
  import.meta.url,
).href;

/** @public */
export type Constructor<T> = abstract new (...args: any[]) => T;

/**
 * Declarative target used by workspace hint and focus overlays.
 *
 * @public
 */
export interface WorkspaceHintTarget {
  id: string;
  type: string;
  label: string;
  action: string;
  element: HTMLElement;
  leafId?: string;
  commandId?: string;
  description?: string;
  group?: string;
}

const WORKSPACE_HINT_TARGET_SELECTOR = "[data-hint-target]";
const FILE_EXPLORER_REVEAL_PATH_COMMAND = "lapis-file-explorer:reveal-path";

function normalizeHintText(value: string | null | undefined): string {
  return value?.replace(/\s+/gu, " ").trim() ?? "";
}

function filePathBreadcrumbs(
  app: App,
  filePath: string | undefined | null,
): DesignWorkspaceBreadcrumb[] {
  if (!filePath) return [];
  const parts = dirname(filePath)
    .split("/")
    .filter((segment) => segment.length > 0);
  return parts.map((label, index) => {
    const path = parts.slice(0, index + 1).join("/");
    return {
      id: path,
      label,
      onSelect: () => {
        void app.commands.executeCommand(
          FILE_EXPLORER_REVEAL_PATH_COMMAND,
          path,
        );
      },
    };
  });
}

function toDesignEditorViewContribution(
  contribution: RegisteredEditorViewContribution,
): DesignEditorViewContribution {
  return {
    id: contribution.id,
    viewType: contribution.viewType,
    label: contribution.label,
    description: contribution.description,
    filenamePatterns: [...contribution.filenamePatterns],
    priority: contribution.priority,
    pluginId: contribution.pluginId,
    source:
      contribution.source === "manifest"
        ? "plugin"
        : (contribution.source ?? "compat"),
  };
}

function isHintTargetDisabled(element: HTMLElement): boolean {
  if (element.getAttribute("aria-disabled") === "true") {
    return true;
  }

  return "disabled" in element && Boolean(element.disabled);
}

function isHintTargetVisible(element: HTMLElement): boolean {
  if (element.getAttribute("aria-hidden") === "true") {
    return false;
  }

  const rect = element.getBoundingClientRect?.();
  if (rect && rect.width === 0 && rect.height === 0) {
    return false;
  }

  return true;
}

export abstract class WorkspaceItem<
  T extends EventMap<T> = EventMap<any>,
> extends EventDispatcher<T> {
  public parent!: WorkspaceParent;

  id: string = uniqueId();

  constructor() {
    super();
  }

  _root: WorkspaceItem | undefined = undefined;
  getRoot(): WorkspaceItem {
    if (this._root) {
      return this._root;
    }
    let parent: WorkspaceItem | null = this.parent;
    while (parent.parent) {
      parent = parent.parent;
    }
    this._root = parent;
    return parent;
  }
}

export abstract class WorkspaceParent<
  T extends EventMap<T> = EventMap<any>,
> extends WorkspaceItem<T> {
  constructor() {
    super();
  }
}

type WorkspaceProjectionItems = Map<string, WorkspaceItem>;

function collectWorkspaceProjectionItem(
  item: WorkspaceItem,
  items: Map<string, WorkspaceItem>,
): void {
  items.set(item.id, item);
  if (item instanceof WorkspaceSplit) {
    item.children.forEach((child) =>
      collectWorkspaceProjectionItem(child, items),
    );
  } else if (item instanceof WorkspaceTabs) {
    item.children.forEach((child) =>
      collectWorkspaceProjectionItem(child, items),
    );
  } else if (item instanceof WorkspaceSidebarGroup) {
    item.children.forEach((child) =>
      collectWorkspaceProjectionItem(child, items),
    );
  } else if (item instanceof WorkspaceFloating) {
    item.children.forEach((child) =>
      collectWorkspaceProjectionItem(child, items),
    );
  }
}

function beginWorkspaceProjection(
  workspace: Workspace,
): WorkspaceProjectionItems {
  const items = new Map<string, WorkspaceItem>();
  workspace.rootSplit.children.forEach((child) =>
    collectWorkspaceProjectionItem(child, items),
  );
  workspace.leftSplit.children.forEach((child) =>
    collectWorkspaceProjectionItem(child, items),
  );
  workspace.rightSplit.children.forEach((child) =>
    collectWorkspaceProjectionItem(child, items),
  );
  workspace.bottomPanel.children.forEach((child) =>
    collectWorkspaceProjectionItem(child, items),
  );
  workspace.floating.children.forEach((child) =>
    collectWorkspaceProjectionItem(child, items),
  );
  return items;
}

function claimWorkspaceProjectionItem<T extends WorkspaceItem>(
  projectionItems: WorkspaceProjectionItems | undefined,
  id: string,
  matches: (item: WorkspaceItem) => item is T,
  create: () => T,
): T {
  const item = projectionItems?.get(id);
  if (item && matches(item)) {
    projectionItems?.delete(id);
    item._root = undefined;
    return item;
  }
  return create();
}

function finishWorkspaceProjection(
  projectionItems: WorkspaceProjectionItems,
): void {
  for (const item of projectionItems.values()) {
    if (item instanceof WorkspaceLeaf) {
      item.view.unload();
      if (hasDestroyableEditor(item.view)) item.view.editor.destroy();
    } else if (item instanceof WorkspaceWindow) {
      item.closePopoutWindow();
    }
  }
}

type WorkspaceSplitJson = {
  id: string;
  type: "split";
  direction: "horizontal" | "vertical";
  sizes: number[];
  children: Array<WorkspaceSplitJson | WorkspaceTabsJson>;
};

type WorkspaceWindowJson = {
  id: string;
  type: "floating";
  mode?: WorkspaceWindowMode;
  displayState?: WorkspaceWindowPersistedDisplayState;
  direction: "horizontal" | "vertical";
  sizes: number[];
  x: number;
  y: number;
  width: number;
  height: number;
  children: Array<WorkspaceSplitJson | WorkspaceTabsJson>;
};

export type WorkspaceWindowMode = "floating" | "popout";
export type WorkspaceWindowDisplayState =
  | "normal"
  | "collapsed"
  | "minimized"
  | "maximized";

export const WORKSPACE_ROOT_HOST_ID = "root";
type WorkspaceWindowPersistedDisplayState = Extract<
  WorkspaceWindowDisplayState,
  "collapsed" | "minimized"
>;

export interface WorkspacePopoutHostHandle {
  readonly win: Window;
  readonly doc: Document;
  focus(): void;
  close(): void;
  onClose(listener: () => void): () => void;
}

export interface WorkspacePopoutHost {
  supportsPopouts(): boolean;
  openWindow(data?: WorkspaceWindowInitData): WorkspacePopoutHostHandle | null;
}

export const WORKSPACE_POPOUT_UNSUPPORTED_ERROR_MESSAGE =
  "Workspace popout windows are not supported in the current renderer host.";

let workspacePopoutHost: WorkspacePopoutHost | null = null;

export function setWorkspacePopoutHost(host: WorkspacePopoutHost | null): void {
  workspacePopoutHost = host;
}

export function getWorkspacePopoutHost(): WorkspacePopoutHost | null {
  return workspacePopoutHost;
}

export function supportsWorkspacePopouts(): boolean {
  return workspacePopoutHost?.supportsPopouts() === true;
}

function openWorkspacePopoutHandle(
  data?: WorkspaceWindowInitData,
): WorkspacePopoutHostHandle | null {
  if (!supportsWorkspacePopouts()) {
    return null;
  }

  return workspacePopoutHost?.openWindow(data) ?? null;
}

export abstract class WorkspaceSplit<
  T extends EventMap<T> = EventMap<any>,
> extends WorkspaceParent<T> {
  type: "horizontal" | "vertical" = $state("vertical");
  children: Array<WorkspaceTabs | WorkspaceView> = $state([]);
  sizes: number[] = $state([]);

  constructor(type: "horizontal" | "vertical" = "vertical") {
    super();
    this.type = type;
  }

  loadJson(
    layout: WorkspaceSplitJson,
    projectionItems?: WorkspaceProjectionItems,
  ) {
    const promises: Array<Promise<any>> = [];
    this.children.slice().forEach((it) => this.removeChild(it, true));
    const sizes = layout.sizes || [];
    layout.children.forEach((child, i) => {
      if (child.type === "tabs") {
        const tabs = claimWorkspaceProjectionItem(
          projectionItems,
          child.id,
          (item): item is WorkspaceTabs => item instanceof WorkspaceTabs,
          () => new WorkspaceTabs({ leaves: [] }),
        );
        this.addChild(tabs);
        promises.push(tabs.loadJson(child, projectionItems));
      } else if (child.type === "split") {
        const split = claimWorkspaceProjectionItem(
          projectionItems,
          child.id,
          (item): item is WorkspaceView => item instanceof WorkspaceView,
          () => new WorkspaceView(child.direction),
        );
        this.addChild(split);
        promises.push(split.loadJson(child, projectionItems));
      }
      this.sizes[i] = sizes[i] ?? 50;
    });

    return Promise.all(promises).then(() => {
      this.id = layout.id;
      this.type = layout.direction;
    });
  }

  toJson(): WorkspaceSplitJson {
    return {
      id: this.id,
      direction: this.type,
      sizes: this.sizes.slice(),
      type: "split",
      children: this.children.map((it) => it.toJson()),
    };
  }

  addChild(child: WorkspaceTabs | WorkspaceView, index?: number) {
    if (
      typeof index === "number" &&
      index >= 0 &&
      index <= this.children.length
    ) {
      this.children.splice(index, 0, child);
      this.sizes.splice(index, 0, 50);
    } else {
      this.children.push(child);
      this.sizes.push(50);
    }
    child.parent = this;
  }

  iterateAllSplits<T = any>(
    callback: (split: WorkspaceSplit<any>) => T,
  ): T | void {
    const response = callback(this);
    if (response !== undefined && response !== null) {
      return response;
    }
    for (const child of this.children) {
      if (child instanceof WorkspaceSplit) {
        const response = child.iterateAllSplits(callback);
        if (response !== undefined && response !== null) {
          return response;
        }
      }
    }
  }

  iterateAllTabs<T = any>(callback: (tab: WorkspaceTabs) => T): T | void {
    for (const child of this.children) {
      if (child instanceof WorkspaceTabs) {
        const response = callback(child);
        if (response !== undefined && response !== null) {
          return response;
        }
      } else {
        const response = child.iterateAllTabs(callback);
        if (response !== undefined && response !== null) {
          return response;
        }
      }
    }
  }

  iterateAllLeaves<T = any>(callback: (leaf: WorkspaceLeaf) => T): T | void {
    for (const child of this.children) {
      const response = child.iterateAllLeaves(callback);
      if (response !== undefined && response !== null) {
        return response;
      }
    }
  }

  onEmpty() {
    tick().then(() => this.addChild(new WorkspaceTabs()));
  }

  removeChild(
    index: number | WorkspaceTabs | WorkspaceSplit,
    softDelete: boolean = false,
  ): WorkspaceTabs | WorkspaceView | undefined {
    if (typeof index === "number") {
      const child = this.children[index];
      if (child) {
        this.children.splice(index, 1);
        this.sizes.splice(index, 1);
        if (
          !softDelete &&
          !this.children.length &&
          this.parent instanceof WorkspaceView
        ) {
          this.parent.removeChild(this);
        }
      }
      if (!softDelete && !this.children.length && !this.parent) {
        this.onEmpty();
      }
      return child;
    } else {
      return this.removeChild(
        this.children.findIndex((it) => it === index),
        softDelete,
      );
    }
  }

  get topLeft() {
    return this.iterateAllTabs((tab) => tab);
  }

  get topRight() {
    return topRightView(this);
  }
}

function topRightView(view: WorkspaceSplit | WorkspaceTabs) {
  if (view instanceof WorkspaceSplit) {
    if (view.type === "vertical") {
      return topRightView(view.children[view.children.length - 1]);
    } else {
      return topRightView(view.children[0]);
    }
  }
  return view;
}

export class WorkspaceView extends WorkspaceSplit {}

type WorkspaceSidedockJson = WorkspaceSplitJson & { width: string };
/**
 * Collapsible split container used for the left and right workspace sidebars.
 *
 * @public
 */
export class WorkspaceSidedock extends WorkspaceSplit<{
  "sidebar-changed": [id: string, open: boolean, width: string];
}> {
  protected open: boolean = $state(true);
  sidebar!: SidebarState;

  constructor(options: Partial<SidebarStateProps> = {}) {
    super();
    let initialized = false;
    this.sidebar = new SidebarState({
      id: this.id,
      ...options,
      open: () => this.open,
      setOpen: (value) => {
        this.open = value;
      },
    });
    $effect(() => {
      this.trigger(
        "sidebar-changed",
        this.sidebar.props.id,
        this.sidebar.open,
        this.sidebar.width,
      );
      if (initialized) app.workspace.requestSaveLayout();
      initialized = true;
    });
  }

  loadJson(
    layout: WorkspaceSidedockJson,
    projectionItems?: WorkspaceProjectionItems,
  ) {
    return super.loadJson(layout, projectionItems).then(() => {
      if (/^0(?:px|rem|em|%)?$/.test(layout.width.trim())) {
        this.open = false;
      } else {
        this.open = true;
        this.sidebar.width = layout.width;
      }
    });
  }

  toJson(): WorkspaceSidedockJson {
    return {
      ...super.toJson(),
      width: this.collapsed ? "0" : this.sidebar.width,
    };
  }

  onEmpty() {}

  get size() {
    return this.sidebar.size;
  }

  get collapsed() {
    return !this.open;
  }

  toggle() {
    this.open = !this.open;
  }

  collapse() {
    this.open = false;
  }

  expand() {
    this.open = true;
  }
}

export abstract class WorkspaceContainer<
  T extends EventMap<T> = EventMap<any>,
> extends WorkspaceSplit<T> {
  /** @public */
  abstract win: Window;
  /** @public */
  abstract doc: Document;
}

export class WorkspaceRoot extends WorkspaceContainer {
  constructor(
    readonly win: Window = window,
    readonly doc: Document = document,
  ) {
    super();
  }
}

export class WorkspaceWindow extends WorkspaceContainer {
  mode: WorkspaceWindowMode = $state("floating");
  displayState: WorkspaceWindowDisplayState = $state("normal");
  x: number = $state(96);
  y: number = $state(96);
  width: number = $state(480);
  height: number = $state(320);
  win: Window;
  doc: Document;
  private focusHost: (() => void) | null = null;
  private closeHost: (() => void) | null = null;
  private detachHostClose: (() => void) | null = null;

  constructor(
    data: WorkspaceWindowInitData = {},
    win: Window = window,
    doc: Document = document,
  ) {
    super();
    this.win = win;
    this.doc = doc;
    this.applyInitData(data);
  }

  private applyInitData(data: WorkspaceWindowInitData = {}) {
    this.mode = data.mode ?? "floating";
    this.displayState =
      data.displayState === "collapsed" || data.displayState === "minimized"
        ? data.displayState
        : "normal";
    this.x = data.x ?? 96;
    this.y = data.y ?? 96;
    this.width = data.size?.width ?? 480;
    this.height = data.size?.height ?? 320;
  }

  attachPopoutHandle(
    handle: WorkspacePopoutHostHandle,
    onClose: () => void,
  ): void {
    this.mode = "popout";
    this.win = handle.win;
    this.doc = handle.doc;
    this.focusHost = () => handle.focus();
    this.closeHost = () => handle.close();
    this.detachHostClose?.();
    this.detachHostClose = handle.onClose(onClose);
  }

  focusPopoutWindow(): void {
    this.focusHost?.();
  }

  closePopoutWindow(): void {
    const detach = this.detachHostClose;
    this.detachHostClose = null;
    detach?.();

    const close = this.closeHost;
    this.closeHost = null;
    this.focusHost = null;
    close?.();
  }

  loadWindowJson(
    layout: WorkspaceWindowJson,
    projectionItems?: WorkspaceProjectionItems,
  ) {
    return super
      .loadJson(
        {
          id: layout.id,
          type: "split",
          direction: layout.direction,
          sizes: layout.sizes,
          children: layout.children,
        },
        projectionItems,
      )
      .then(() => {
        this.id = layout.id;
        this.applyInitData({
          mode: layout.mode,
          displayState: layout.displayState,
          x: layout.x,
          y: layout.y,
          size: { width: layout.width, height: layout.height },
        });
      });
  }

  toWindowJson(): WorkspaceWindowJson {
    const layout = super.toJson();
    const displayState =
      this.displayState === "collapsed" || this.displayState === "minimized"
        ? this.displayState
        : undefined;
    return {
      ...layout,
      type: "floating",
      mode: this.mode,
      ...(displayState ? { displayState } : {}),
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  setBounds(bounds: Partial<Record<"x" | "y" | "width" | "height", number>>) {
    if (typeof bounds.x === "number") this.x = bounds.x;
    if (typeof bounds.y === "number") this.y = bounds.y;
    if (typeof bounds.width === "number") this.width = bounds.width;
    if (typeof bounds.height === "number") this.height = bounds.height;
  }

  setDisplayState(displayState: WorkspaceWindowDisplayState): void {
    this.displayState = displayState;
  }

  override removeChild(
    index: number | WorkspaceTabs | WorkspaceSplit,
    softDelete: boolean = false,
  ): WorkspaceTabs | WorkspaceView | undefined {
    const child = super.removeChild(index, softDelete);
    if (!softDelete && !this.children.length) {
      this.closePopoutWindow();
      (this.parent as WorkspaceFloating).removeChild(this);
    }
    return child;
  }
}

function hasDestroyableEditor(
  view: View,
): view is View & { editor: { destroy: () => void } } {
  const candidate = view as View & { editor?: { destroy?: unknown } };
  return typeof candidate.editor?.destroy === "function";
}

export interface WorkspaceWindowInitData {
  mode?: WorkspaceWindowMode;
  displayState?: WorkspaceWindowDisplayState;
  x?: number;
  y?: number;
  size?: {
    width: number;
    height: number;
  };
}

export class WorkspaceFloating extends WorkspaceParent {
  children: WorkspaceWindow[] = $state([]);

  loadJson(
    layouts: WorkspaceWindowJson[] = [],
    projectionItems?: WorkspaceProjectionItems,
  ) {
    const promises: Array<Promise<any>> = [];
    this.children.slice().forEach((child) => this.removeChild(child, true));
    layouts.forEach((layout) => {
      const child = claimWorkspaceProjectionItem(
        projectionItems,
        layout.id,
        (item): item is WorkspaceWindow => item instanceof WorkspaceWindow,
        () => new WorkspaceWindow(),
      );
      this.addChild(child);
      promises.push(
        child.loadWindowJson(layout, projectionItems).then(() => {
          if (child.mode !== "popout") {
            return;
          }

          const handle = openWorkspacePopoutHandle({
            x: child.x,
            y: child.y,
            size: { width: child.width, height: child.height },
            mode: "popout",
          });
          if (!handle) {
            child.mode = "floating";
            return;
          }

          child.attachPopoutHandle(handle, () => {
            if (app.workspace.floating.children.includes(child)) {
              app.workspace.closeFloatingWindow(child, {
                closeHost: false,
                operation: "close-popout-window",
              });
            }
          });
        }),
      );
    });
    return Promise.all(promises);
  }

  toJson(): WorkspaceWindowJson[] {
    return this.children.map((child) => child.toWindowJson());
  }

  addChild(child: WorkspaceWindow, index?: number) {
    if (
      typeof index === "number" &&
      index >= 0 &&
      index <= this.children.length
    ) {
      this.children.splice(index, 0, child);
    } else {
      this.children.push(child);
    }
    child.parent = this;
  }

  bringToFront(child: WorkspaceWindow) {
    const index = this.children.findIndex((candidate) => candidate === child);
    if (index === -1 || index === this.children.length - 1) {
      return;
    }
    this.children.splice(index, 1);
    this.children.push(child);
  }

  removeChild(
    index: number | WorkspaceWindow,
    softDelete: boolean = false,
  ): WorkspaceWindow | undefined {
    if (index instanceof WorkspaceWindow) {
      return this.removeChild(
        this.children.findIndex((child) => child === index),
        softDelete,
      );
    }

    const child = this.children[index];
    if (child) {
      this.children.splice(index, 1);
      if (!softDelete && app.workspace.activeLeaf) {
        const activeLeaf = app.workspace.activeLeaf;
        const stillContained = child.iterateAllLeaves(
          (leaf) => leaf === activeLeaf || undefined,
        );
        if (stillContained) {
          app.workspace.activeLeaf = app.workspace.activeRootLeaf;
        }
      }
    }
    return child;
  }

  iterateAllLeaves<T = any>(callback: (leaf: WorkspaceLeaf) => T): T | void {
    for (const child of this.children) {
      const response = child.iterateAllLeaves(callback);
      if (response !== undefined && response !== null) {
        return response;
      }
    }
  }
}

export class WorkspaceMobileDrawer extends WorkspaceParent {
  collapsed: boolean = false;

  expand(): void {
    this.collapsed = false;
  }

  collapse(): void {
    this.collapsed = true;
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
  }
}

type WorkspaceTabsJson = {
  id: string;
  type: "tabs";
  stacked: boolean;
  children: WorkspaceTabsChildJson[];
  currentTab: number;
};

type WorkspaceBottomPanelJson = WorkspaceTabsJson & { height: string };

type WorkspaceTabsChildJson = WorkspaceLeafJson | WorkspaceSidebarGroupJson;

type WorkspaceSidebarGroupJson = {
  id: string;
  type: "sidebar-group";
  name: string;
  icon?: string;
  hiddenLeafIds?: string[];
  collapsed?: Record<string, boolean>;
  panelSizes?: Record<string, number>;
  children: WorkspaceLeafJson[];
};

export type SidebarSide = "left" | "right";

export interface SidebarViewPlacementOptions {
  side?: SidebarSide;
  group?: string;
  groupTitle?: string;
  groupIcon?: string;
  title?: string;
  icon?: string;
  hidden?: boolean;
}

export interface EnsureSideLeafOptions extends SidebarViewPlacementOptions {}

export interface SidebarGroupOptions {
  id?: string;
  name?: string;
  icon?: string;
  hiddenLeafIds?: string[];
  collapsed?: Record<string, boolean>;
  panelSizes?: Record<string, number>;
}

export type WorkspaceTabsChild = WorkspaceLeaf | WorkspaceSidebarGroup;

function isSidebarGroupJson(
  value: WorkspaceTabsChildJson,
): value is WorkspaceSidebarGroupJson {
  return value.type === "sidebar-group";
}

function normalizeSidebarGroupId(group: string): string {
  return group.trim();
}

/**
 * Sidebar-only container that groups leaves into a named view container.
 *
 * @public
 */
export class WorkspaceSidebarGroup extends WorkspaceParent {
  declare parent: WorkspaceTabs;

  name: string = $state("");
  icon: string | undefined = $state(undefined);
  hiddenLeafIds: string[] = $state([]);
  collapsed: Record<string, boolean> = $state({});
  panelSizes: Record<string, number> = $state({});
  children: WorkspaceLeaf[] = $state([]);

  constructor(options: SidebarGroupOptions = {}) {
    super();
    if (options.id) {
      this.id = options.id;
    }
    this.name = options.name ?? options.id ?? "";
    this.icon = options.icon;
    this.hiddenLeafIds = [...(options.hiddenLeafIds ?? [])];
    this.collapsed = { ...(options.collapsed ?? {}) };
    this.panelSizes = { ...(options.panelSizes ?? {}) };
  }

  detach(softDelete: boolean = false) {
    return this.parent.removeChild(this, softDelete);
  }

  addChild(child: WorkspaceLeaf, index?: number) {
    const oldIndex = this.children.findIndex((it) => it === child);
    if (child.parent && child.parent !== this) {
      child.detach();
    }
    if (oldIndex !== -1) {
      this.children.splice(oldIndex, 1);
    }
    if (typeof index === "number") {
      const boundedIndex = Math.max(0, Math.min(index, this.children.length));
      this.children.splice(boundedIndex, 0, child);
    } else {
      this.children.push(child);
    }
    child.parent = this;
  }

  removeChild(
    index: number | WorkspaceLeaf,
    softDelete: boolean = false,
  ): WorkspaceLeaf | undefined {
    void softDelete;
    if (index instanceof WorkspaceLeaf) {
      return this.removeChild(this.children.findIndex((it) => it === index));
    }
    const child = this.children[index];
    if (!child) {
      return undefined;
    }
    this.children.splice(index, 1);
    this.hiddenLeafIds = this.hiddenLeafIds.filter((id) => id !== child.id);
    this.collapsed = Object.fromEntries(
      Object.entries(this.collapsed).filter(([id]) => id !== child.id),
    );
    this.panelSizes = Object.fromEntries(
      Object.entries(this.panelSizes).filter(([id]) => id !== child.id),
    );
    if (!this.children.length && !softDelete) {
      this.parent.removeChild(this);
    }
    if (app.workspace.activeLeaf === child) {
      app.workspace.activeLeaf = this.getSelectedLeaf();
    }
    return child;
  }

  getSelectedLeaf(): WorkspaceLeaf | null {
    return this.children.find((leaf) => !this.isLeafHidden(leaf)) ?? null;
  }

  iterateAllLeaves<T = any>(callback: (leaf: WorkspaceLeaf) => T): T | void {
    for (const child of this.children) {
      const response = callback(child);
      if (response !== undefined && response !== null) {
        return response;
      }
    }
  }

  isLeafHidden(leaf: WorkspaceLeaf | string): boolean {
    const id = typeof leaf === "string" ? leaf : leaf.id;
    return this.hiddenLeafIds.includes(id);
  }

  setLeafHidden(leaf: WorkspaceLeaf | string, hidden: boolean): void {
    const id = typeof leaf === "string" ? leaf : leaf.id;
    const ids = new Set(this.hiddenLeafIds);
    if (hidden) {
      ids.add(id);
    } else {
      ids.delete(id);
    }
    this.hiddenLeafIds = [...ids];
    app.workspace.requestSaveLayout();
  }

  isLeafCollapsed(leaf: WorkspaceLeaf | string): boolean {
    const id = typeof leaf === "string" ? leaf : leaf.id;
    return this.collapsed[id] ?? false;
  }

  setLeafCollapsed(leaf: WorkspaceLeaf | string, collapsed: boolean): void {
    const id = typeof leaf === "string" ? leaf : leaf.id;
    this.collapsed = { ...this.collapsed, [id]: collapsed };
    app.workspace.requestSaveLayout();
  }

  getLeafPanelSize(leaf: WorkspaceLeaf | string): number | undefined {
    const id = typeof leaf === "string" ? leaf : leaf.id;
    return this.panelSizes[id];
  }

  setPanelSizes(leaves: WorkspaceLeaf[], sizes: number[]): void {
    const next = { ...this.panelSizes };
    leaves.forEach((leaf, index) => {
      const size = sizes[index];
      if (Number.isFinite(size) && size > 0) {
        next[leaf.id] = Number(size.toFixed(4));
      }
    });
    this.panelSizes = next;
    app.workspace.requestSaveLayout();
  }

  private serializedPanelSizes(): Record<string, number> {
    const childIds = new Set(this.children.map((leaf) => leaf.id));
    return Object.fromEntries(
      Object.entries(this.panelSizes).filter(
        ([id, size]) => childIds.has(id) && Number.isFinite(size) && size > 0,
      ),
    );
  }

  loadJson(
    layout: WorkspaceSidebarGroupJson,
    projectionItems?: WorkspaceProjectionItems,
  ) {
    const promises: Array<Promise<any>> = [];
    this.children.slice().forEach((it) => this.removeChild(it, true));
    layout.children.forEach((config) => {
      const leaf = claimWorkspaceProjectionItem(
        projectionItems,
        config.id,
        (item): item is WorkspaceLeaf => item instanceof WorkspaceLeaf,
        () => new WorkspaceLeaf(),
      );
      this.addChild(leaf);
      promises.push(leaf.loadJson(config));
    });

    return Promise.all(promises).then(() => {
      this.id = layout.id;
      this.name = layout.name;
      this.icon = layout.icon;
      this.hiddenLeafIds = [...(layout.hiddenLeafIds ?? [])];
      this.collapsed = { ...(layout.collapsed ?? {}) };
      this.panelSizes = { ...(layout.panelSizes ?? {}) };
    });
  }

  toJson(): WorkspaceSidebarGroupJson {
    const panelSizes = this.serializedPanelSizes();
    return {
      id: this.id,
      type: "sidebar-group",
      name: this.name,
      ...(this.icon ? { icon: this.icon } : {}),
      ...(this.hiddenLeafIds.length
        ? { hiddenLeafIds: [...this.hiddenLeafIds] }
        : {}),
      ...(Object.keys(this.collapsed).length
        ? { collapsed: { ...this.collapsed } }
        : {}),
      ...(Object.keys(panelSizes).length ? { panelSizes } : {}),
      children: this.children.map((it) => it.toJson()),
    };
  }
}

/**
 * Tab strip container for root and sidebar workspace leaves.
 *
 * @public
 */
export class WorkspaceTabs extends WorkspaceParent {
  containerEl: HTMLElement | null = $state(null);
  stacked: boolean = $state(false);
  _selected: string = $state("0");

  declare parent: WorkspaceSplit<Record<string, any>>;
  children: WorkspaceTabsChild[] = $state([]);

  constructor(
    props: Partial<{
      leaves: WorkspaceLeaf[];
      stacked: boolean;
    }> = {},
  ) {
    super();
    const { leaves = [new WorkspaceLeaf()], stacked = false } = props;
    this.stacked = stacked;
    leaves.forEach((it) => this.addChild(it));
  }

  loadJson(
    layout: WorkspaceTabsJson,
    projectionItems?: WorkspaceProjectionItems,
  ) {
    const promises: Array<Promise<any>> = [];
    this.children.slice().forEach((it) => this.removeChild(it, true));
    layout.children.forEach((config) => {
      if (isSidebarGroupJson(config)) {
        const group = claimWorkspaceProjectionItem(
          projectionItems,
          config.id,
          (item): item is WorkspaceSidebarGroup =>
            item instanceof WorkspaceSidebarGroup,
          () => new WorkspaceSidebarGroup(),
        );
        this.addChild(group);
        promises.push(group.loadJson(config, projectionItems));
      } else {
        const leaf = claimWorkspaceProjectionItem(
          projectionItems,
          config.id,
          (item): item is WorkspaceLeaf => item instanceof WorkspaceLeaf,
          () => new WorkspaceLeaf(),
        );
        this.addChild(leaf);
        promises.push(leaf.loadJson(config));
      }
    });

    return Promise.all(promises).then(() => {
      this.id = layout.id;
      this.stacked = layout.stacked;
      this.selected = layout.currentTab;
    });
  }

  toJson(): WorkspaceTabsJson {
    return {
      id: this.id,
      stacked: this.stacked,
      type: "tabs",
      children: this.children.map((it) => it.toJson()),
      currentTab: this.selectedIndex,
    };
  }

  get selected(): string {
    return this._selected;
  }

  get sideBar(): WorkspaceSidedock | undefined {
    let parent: any = this.parent;
    while (parent) {
      if (parent instanceof WorkspaceSidedock) {
        return parent;
      }
      parent = parent.parent;
    }
  }

  inSideBar() {
    return this.sideBar !== undefined;
  }

  get selectedIndex() {
    return +this._selected;
  }

  get selectedChild(): WorkspaceTabsChild | undefined {
    return this.children[this.selectedIndex];
  }

  get selectedLeaf(): WorkspaceLeaf | null {
    const child = this.selectedChild;
    if (child instanceof WorkspaceLeaf) {
      return child;
    }
    return child?.getSelectedLeaf() ?? null;
  }

  set selected(value: string | number | WorkspaceTabsChild) {
    if (
      value instanceof WorkspaceLeaf ||
      value instanceof WorkspaceSidebarGroup
    ) {
      value = this.children.findIndex((it) => it === value);
    }
    this._selected = value?.toString() || "";
  }

  detach(softDelete: boolean = false) {
    return this.parent.removeChild(this, softDelete);
  }

  addChild(child: WorkspaceTabsChild, index?: number) {
    const oldIndex = this.children.findIndex((it) => it === child);
    if (child.parent && child.parent !== this) {
      child.detach();
    }
    if (typeof index === "number") {
      if (index < 0) index = 0;
      if (index >= this.children.length) index = this.children.length - 1;
    }
    if (
      typeof index === "number" &&
      index >= 0 &&
      index < this.children.length
    ) {
      if (oldIndex !== -1) {
        this.children.splice(oldIndex, 1);
      }
      this.children.splice(index, 0, child);
    } else if (oldIndex === -1) {
      this.children.push(child);
    }
    child.parent = this;
    if (this.selectedIndex === oldIndex) {
      this.selected = child;
    }
  }

  iterateAllLeaves<T = any>(callback: (leaf: WorkspaceLeaf) => T): T | void {
    for (const child of this.children) {
      const response =
        child instanceof WorkspaceLeaf
          ? callback(child)
          : child.iterateAllLeaves(callback);
      if (response !== undefined && response !== null) {
        return response;
      }
    }
  }

  removeChild(
    index: number | WorkspaceTabsChild,
    softDelete: boolean = false,
  ): WorkspaceTabsChild | undefined {
    if (
      index instanceof WorkspaceLeaf ||
      index instanceof WorkspaceSidebarGroup
    ) {
      return this.removeChild(
        this.children.findIndex((it) => it === index),
        softDelete,
      );
    }
    const child = this.children[index];
    if (child) {
      if (child instanceof WorkspaceLeaf) {
        app.workspace.clearFocusModeForLeaf(child);
      } else {
        child.iterateAllLeaves((leaf) => {
          app.workspace.clearFocusModeForLeaf(leaf);
        });
      }
      this.children.splice(index, 1);
      const selectedIndex = +this.selected;
      if (selectedIndex === index && index > 0) {
        this.selected = (index - 1).toString();
      } else if (index < selectedIndex) {
        this.selected = (selectedIndex - 1).toString();
      }
      if (
        child instanceof WorkspaceLeaf &&
        app.workspace.activeLeaf === child
      ) {
        app.workspace.activeLeaf = this.selectedLeaf;
      } else if (
        child instanceof WorkspaceSidebarGroup &&
        child.children.includes(app.workspace.activeLeaf!)
      ) {
        app.workspace.activeLeaf = this.selectedLeaf;
      }
    }

    if (!this.children.length) {
      if (
        child instanceof WorkspaceLeaf &&
        app.workspace.activeLeaf === child
      ) {
        app.workspace.activeLeaf = null;
      }
      if (!softDelete) {
        this.parent.removeChild(this);
      }
    }
    return child;
  }

  closeAll() {
    this.children.slice().forEach((it) => this.removeChild(it, true));
    this.parent.removeChild(this);
  }
}

/**
 * Stable compatibility wrapper for design-core's bottom workspace dock.
 *
 * The panel remains a single tabs surface. Its height encodes both the last
 * expanded size and its persisted open state, matching the workspace JSON
 * contract used by design-core.
 *
 * @public
 */
export class WorkspaceBottomPanel extends WorkspaceTabs {
  declare parent: never;
  protected open: boolean = $state(false);
  protected height: string = $state("240px");

  constructor(readonly workspace: Workspace) {
    super({ leaves: [] });
    this.id = "bottom-panel";
  }

  loadJson(
    layout: WorkspaceBottomPanelJson,
    projectionItems?: WorkspaceProjectionItems,
  ) {
    return super.loadJson(layout, projectionItems).then(() => {
      const collapsed = /^0(?:px|rem|em|%)?$/.test(layout.height.trim());
      this.open = !collapsed;
      if (!collapsed) this.height = layout.height;
    });
  }

  toJson(): WorkspaceBottomPanelJson {
    return {
      ...super.toJson(),
      height: this.open ? this.height : "0px",
    };
  }

  get size(): number {
    const pixels = workspaceCssLengthToPixels(this.height);
    const size = Number.parseFloat(pixels);
    return Number.isFinite(size) ? size : 240;
  }

  get collapsed(): boolean {
    return !this.open;
  }

  expand(): void {
    this.workspace.setBottomPanelOpen(true);
  }

  collapse(): void {
    this.workspace.setBottomPanelOpen(false);
  }

  toggle(): void {
    this.workspace.toggleBottomPanel();
  }

  detach(): undefined {
    return undefined;
  }

  removeChild(
    index: number | WorkspaceTabsChild,
    _softDelete: boolean = false,
  ): WorkspaceTabsChild | undefined {
    return super.removeChild(index, true);
  }

  closeAll(): void {
    this.children.slice().forEach((child) => this.removeChild(child, true));
  }

  getRoot(): WorkspaceItem {
    return this;
  }

  /** @internal */
  _applyOpen(open: boolean): void {
    this.open = open;
  }

  /** @internal */
  _applySize(size: number): void {
    this.height = `${size}px`;
  }
}

export type ViewCreator = (leaf: WorkspaceLeaf) => View;

export const ON_DEMAND_PLUGIN_INSTALL_VIEW_TYPE = "plugin-install-prompt";

function registryContributionMatchesPath(
  entry: PluginCatalogEntry,
  path: string,
): boolean {
  const normalizedExtension = extensionFromPath(path);

  return (
    entry.contributes?.editorViews?.some((view) => {
      if (
        view.extensions?.some(
          (extension) =>
            normalizeRegistryExtension(extension) === normalizedExtension,
        )
      ) {
        return true;
      }

      return view.filenamePatterns?.some((pattern) =>
        matchesEditorAssociationGlob(pattern, path),
      );
    }) ?? false
  );
}

function extensionFromPath(path: string): string {
  const basename = path.split("/").pop() ?? path;
  const dotIndex = basename.lastIndexOf(".");
  return dotIndex === -1 ? "" : basename.slice(dotIndex + 1).toLowerCase();
}

function normalizeRegistryExtension(extension: string): string {
  return extension.trim().replace(/^\./u, "").toLowerCase();
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export type PaneType = "tab" | "split" | "window";
export type SplitDirection = "vertical" | "horizontal";

type WorkspaceRibbonItem = {
  id: string;
  icon: string;
  title: string;
  hidden: boolean;
  callback: (event: MouseEvent) => void;
};

export class WorkspaceRibbon {
  open: boolean = $state(true);
  containerEl: HTMLElement = $state(null)!;
  ribbonSettingsEl: HTMLElement = $state(null)!;
  ribbonItemsEl: HTMLUListElement = $state(null)!;
  private _items: Record<string, WorkspaceRibbonItem> = $state({});

  constructor(readonly workspace: Workspace) {}

  get items() {
    return Object.values(this._items);
  }

  addItem(item: WorkspaceRibbonItem): () => void {
    if (!this._items[item.id]) {
      this._items[item.id] = item;
    } else {
      new Notice(`Ribbon item: ${item.id} already exists`);
    }
    return () => {
      this.removeItem(item.id);
    };
  }

  removeItem(id: string) {
    if (this._items[id]) {
      delete this._items[id];
    }
  }
}

type WorkspaceJson = {
  main: WorkspaceSplitJson;
  left: WorkspaceSidedockJson;
  right: WorkspaceSidedockJson;
  bottom: WorkspaceBottomPanelJson;
  floating?: WorkspaceWindowJson[];
  active?: string;
};

function workspaceCssLengthToPixels(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (/^0(?:px|rem|em|%)?$/.test(normalized)) return "0px";
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return value;
  if (normalized.endsWith("rem") || normalized.endsWith("em")) {
    return `${amount * 16}px`;
  }
  return normalized.endsWith("px") ? normalized : `${amount}px`;
}

function workspaceJsonForDesignCore(layout: WorkspaceJson): WorkspaceJson {
  return {
    ...layout,
    left: {
      ...layout.left,
      width: workspaceCssLengthToPixels(layout.left.width),
    },
    right: {
      ...layout.right,
      width: workspaceCssLengthToPixels(layout.right.width),
    },
    bottom: {
      ...layout.bottom,
      height: workspaceCssLengthToPixels(layout.bottom.height),
    },
  };
}

function designLayoutEventFromCompatibility(
  event: WorkspaceLayoutChangeEvent,
): DesignWorkspaceLayoutChangeEvent {
  const source =
    event.source === "drag-drop"
      ? "drag-drop"
      : event.source === "resize"
        ? "resize"
        : event.source === "layout-load"
          ? "layout-restore"
          : event.source === "bottom-panel"
            ? "bottom-panel"
            : event.source === "popout"
              ? "window-open"
              : "layout-replace";
  return { source, operation: event.operation };
}

function compatibilityLayoutEventFromDesign(
  event: DesignWorkspaceLayoutChangeEvent,
): WorkspaceLayoutChangeEvent {
  const source =
    event.source === "drag-drop"
      ? "drag-drop"
      : event.source === "resize"
        ? "resize"
        : event.source === "layout-restore"
          ? "layout-load"
          : event.source === "bottom-panel"
            ? "bottom-panel"
            : event.source.startsWith("window-")
              ? "popout"
              : "api";
  return { source, operation: event.operation ?? event.source };
}

export type WorkspaceLayoutChangeSource =
  | "api"
  | "drag-drop"
  | "layout-load"
  | "resize"
  | "bottom-panel"
  | "popout";

export interface WorkspaceLayoutChangeEvent {
  source: WorkspaceLayoutChangeSource;
  operation?: string;
}

/** @public */
export type WorkspaceDisplayMode = "desktop" | "mobile";

/** @public */
export type WorkspaceDisplayModeReason =
  | "configuration"
  | "viewport"
  | "manual"
  | "test";

/** @public */
export interface WorkspaceDisplayModeChangeEvent {
  mode: WorkspaceDisplayMode;
  previousMode: WorkspaceDisplayMode;
  reason: WorkspaceDisplayModeReason;
}

/** @public */
export type WorkspaceOpenLeafRegion =
  | "main"
  | "left"
  | "right"
  | "bottom"
  | "floating"
  | "popout";

/** @public */
export interface WorkspaceOpenLeafEntry {
  id: string;
  leaf: WorkspaceLeaf;
  title: string;
  icon: string;
  viewType: string;
  filePath?: string;
  region: WorkspaceOpenLeafRegion;
  active: boolean;
  selectedInParent: boolean;
  parentTabsId?: string;
  parentGroupId?: string;
  parentGroupName?: string;
  parentWindowId?: string;
  parentWindowMode?: WorkspaceWindowMode;
}

/** @public */
export interface WorkspaceOpenLeafEntryOptions {
  includeMain?: boolean;
  includeLeftSidebar?: boolean;
  includeRightSidebar?: boolean;
  includeBottomPanel?: boolean;
  includeFloating?: boolean;
  includePopout?: boolean;
}

/** @public */
export type WorkspaceBottomPanelAlignment =
  | "left"
  | "right"
  | "center"
  | "justify";

/** @public */
export interface WorkspaceActivateLeafOptions {
  focusRootHost?: boolean;
  saveLayout?: boolean;
  source?: WorkspaceLayoutChangeSource;
  operation?: string;
}

/** @public */
export interface WorkspaceCloseLeafAndSelectFallbackOptions {
  preferRoot?: boolean;
  saveLayout?: boolean;
}

export type WorkspaceLayoutDropPosition =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "center";

export type WorkspaceLayoutDropSource = "html5" | "pointer" | "api";

export interface WorkspaceFocusModeState {
  leaf: WorkspaceLeaf;
  tabs: WorkspaceTabs;
}

export interface WorkspaceLayoutDropEvent {
  source: WorkspaceLayoutDropSource;
  operation: string;
  position: WorkspaceLayoutDropPosition;
  target: WorkspaceItem;
  item?: WorkspaceLeaf | WorkspaceSidebarGroup;
  file?: TFile;
  defaultPrevented: boolean;
  preventDefault(): void;
}

function createWorkspaceLayoutDropEvent(
  options: Omit<
    WorkspaceLayoutDropEvent,
    "defaultPrevented" | "preventDefault"
  >,
): WorkspaceLayoutDropEvent {
  return {
    ...options,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
}

export interface HoverLinkSource {
  /**
   * Text displayed in the 'Page preview' plugin settings. It should match the
   * plugin's display name.
   *
   * @public
   */
  display: string;
  /**
   * Whether the `hover-link` event requires the 'Mod' key to be pressed to
   * trigger.
   *
   * @public
   */
  defaultMod: boolean;
}

/**
 * Owns the workspace layout tree, leaf registry, and view-type routing.
 *
 * `Workspace` coordinates default file navigation, sidebar placement, layout
 * persistence, and the active editor/leaf state that plugins interact with.
 *
 * @public
 */
export class Workspace extends EventDispatcher<{
  resize: [any];
  "active-leaf-change": [leaf?: WorkspaceLeaf | null];
  "display-mode-change": [event: WorkspaceDisplayModeChangeEvent];
  "focus-mode-change": [state: WorkspaceFocusModeState | null];
  "layout-ready": [];
  "layout-change": [event: WorkspaceLayoutChangeEvent];
  "layout-drag-start": [event: WorkspaceLayoutDropEvent];
  "layout-drag-end": [event: WorkspaceLayoutDropEvent];
  "layout-will-show-overlay": [event: WorkspaceLayoutDropEvent];
  "layout-will-drop": [event: WorkspaceLayoutDropEvent];
  "layout-did-drop": [event: WorkspaceLayoutDropEvent];
  "quick-preview": [file: TFile, string];
  "file-open": [file: TFile | null];
  "file-change": [file: TFile, event: string];
  "file-menu": [
    menu: Menu,
    file: TAbstractFile,
    source: string,
    leaf?: WorkspaceLeaf,
  ];
  "files-menu": [
    menu: Menu,
    files: TAbstractFile[],
    source: string,
    leaf?: WorkspaceLeaf,
  ];
  "editor-menu": [menu: Menu, editor: Editor];
  "editor-updated": [editor: Editor, transactions: readonly TransactionSpec[]];
}> {
  private viewTypes: Map<string, ViewCreator> = new Map([
    ["empty", (leaf) => new EmptyView(leaf)],
  ]);
  private viewExtensions: Map<string, string> = new Map();
  readonly editorViews: EditorViewRegistry = new EditorViewRegistry();
  private sidebarViewPlacements: Map<string, SidebarViewPlacementOptions> =
    new Map();
  private hoverLinkSources: Map<string, HoverLinkSource> = new Map();
  public rootContainer: WorkspaceRoot = new WorkspaceRoot();
  public rootSplit: WorkspaceView = new WorkspaceView();
  public displayMode: WorkspaceDisplayMode = $state("desktop");
  public _activeLeaf: WorkspaceLeaf | null = $state(null);
  public focusMode: WorkspaceFocusModeState | null = $state(null);
  public focusedHostId: string = $state(WORKSPACE_ROOT_HOST_ID);
  public leftSplit: WorkspaceSidedock = new WorkspaceSidedock({
    id: "left",
    initialWidth: "22rem",
  });
  public rightSplit: WorkspaceSidedock = new WorkspaceSidedock({
    id: "right",
    collapsedSize: "0px",
  });
  public bottomPanel: WorkspaceBottomPanel = new WorkspaceBottomPanel(this);
  public floating: WorkspaceFloating = new WorkspaceFloating();
  layoutReady: boolean = $state(false);
  private layoutHandlers: Array<() => void> = [];
  private suspendedLayoutPersistence = 0;
  #workspaceHostController: AppShellController | null = null;
  #syncingWorkspaceHost = 0;
  #workspaceHostProjection: Promise<void> = Promise.resolve();
  readonly #workspaceHostViewDisposers = new Map<string, () => void>();
  #configurationBridgeDisposer: (() => void) | null = null;
  #editorViewBridgeDisposer: (() => void) | null = null;
  private workspaceLayoutFile = "workspace.json";

  public statusEl: HTMLElement = $state()!;
  public statusCompatEl: HTMLElement = $state()!;
  public leftRibbon: WorkspaceRibbon = new WorkspaceRibbon(this);
  public rightRibbon: WorkspaceRibbon = new WorkspaceRibbon(this);
  public containerEl: HTMLElement = $state(createDiv("workspace"));

  private saveLayoutDebounced = debounce(() => {
    tick().then(() => {
      if (!this.layoutReady) {
        return;
      }
      return this.app.vault.create(
        joinPath("/.obsidian", this.workspaceLayoutFile),
        JSON.stringify(this.toJson(), null, 2),
      );
    });
  }, 1000);

  public requestSaveLayout(
    event: WorkspaceLayoutChangeEvent = { source: "api" },
  ): void {
    if (this.suspendedLayoutPersistence > 0) {
      return;
    }
    untrack(() => this.commitCompatibilityLayoutToHost(event));
    this.emitLayoutChangeAndScheduleSave(event);
  }

  private emitLayoutChangeAndScheduleSave(
    event: WorkspaceLayoutChangeEvent,
  ): void {
    this.trigger("layout-change", event);
    this.saveLayoutDebounced();
  }

  private commitCompatibilityLayoutToHost(
    event: WorkspaceLayoutChangeEvent,
  ): void {
    if (!this.#workspaceHostController) return;
    this.#syncingWorkspaceHost += 1;
    try {
      this.#workspaceHostController.workspace.changeLayout(
        workspaceJsonForDesignCore(this.toJson()),
        designLayoutEventFromCompatibility(event),
      );
    } finally {
      this.#syncingWorkspaceHost -= 1;
    }
  }

  private async withoutLayoutPersistence<T>(
    callback: () => Promise<T> | T,
  ): Promise<T> {
    this.suspendedLayoutPersistence += 1;
    try {
      return await callback();
    } finally {
      this.suspendedLayoutPersistence -= 1;
    }
  }

  private dispatchLayoutDropEvent(
    eventName:
      | "layout-drag-start"
      | "layout-drag-end"
      | "layout-will-show-overlay"
      | "layout-will-drop"
      | "layout-did-drop",
    options: Omit<
      WorkspaceLayoutDropEvent,
      "defaultPrevented" | "preventDefault"
    >,
  ): WorkspaceLayoutDropEvent {
    const event = createWorkspaceLayoutDropEvent(options);
    this.trigger(eventName, event);
    return event;
  }

  willShowLayoutDropOverlay(
    options: Omit<
      WorkspaceLayoutDropEvent,
      "defaultPrevented" | "preventDefault"
    >,
  ): WorkspaceLayoutDropEvent {
    return this.dispatchLayoutDropEvent("layout-will-show-overlay", options);
  }

  startLayoutDrag(
    options: Omit<
      WorkspaceLayoutDropEvent,
      "defaultPrevented" | "preventDefault"
    >,
  ): WorkspaceLayoutDropEvent {
    return this.dispatchLayoutDropEvent("layout-drag-start", options);
  }

  endLayoutDrag(
    options: Omit<
      WorkspaceLayoutDropEvent,
      "defaultPrevented" | "preventDefault"
    >,
  ): WorkspaceLayoutDropEvent {
    return this.dispatchLayoutDropEvent("layout-drag-end", options);
  }

  moveWorkspaceChildToTabIndex(
    item: WorkspaceLeaf | WorkspaceSidebarGroup,
    target: WorkspaceTabs,
    index: number,
    options: {
      position: Extract<WorkspaceLayoutDropPosition, "left" | "right">;
      source?: WorkspaceLayoutDropSource;
      operation?: string;
    },
  ): boolean {
    if (item === target.children[index]) {
      return false;
    }

    const operation = options.operation ?? "tab-reorder";
    const eventOptions = {
      source: options.source ?? "api",
      operation,
      position: options.position,
      target,
      item,
    } satisfies Omit<
      WorkspaceLayoutDropEvent,
      "defaultPrevented" | "preventDefault"
    >;
    const willDrop = this.dispatchLayoutDropEvent(
      "layout-will-drop",
      eventOptions,
    );
    if (willDrop.defaultPrevented) {
      return false;
    }

    const boundedIndex = Math.max(0, Math.min(index, target.children.length));
    const existingIndex = target.children.findIndex((child) => child === item);
    if (existingIndex !== -1) {
      target.removeChild(item, true);
    } else if (item.parent) {
      item.detach(true);
    }

    const insertionIndex =
      existingIndex !== -1 && existingIndex < boundedIndex
        ? boundedIndex - 1
        : boundedIndex;
    if (insertionIndex >= target.children.length) {
      target.children.push(item);
      item.parent = target;
    } else {
      target.addChild(item, insertionIndex);
    }
    if (item instanceof WorkspaceLeaf) {
      target.selected = item;
      this.activeLeaf = item;
    } else {
      target.selected = item;
      this.activeLeaf = item.getSelectedLeaf();
    }
    if (target instanceof WorkspaceBottomPanel) {
      target._applyOpen(true);
    }

    this.requestSaveLayout({ source: "drag-drop", operation });
    this.dispatchLayoutDropEvent("layout-did-drop", eventOptions);
    return true;
  }

  async dropWorkspaceItemOnTabs(
    parent: WorkspaceTabs | WorkspaceSplit,
    options: {
      position: WorkspaceLayoutDropPosition;
      item?: WorkspaceLeaf;
      file?: TFile;
      source?: WorkspaceLayoutDropSource;
      operation?: string;
    },
  ): Promise<boolean> {
    const item = options.item;
    const file = options.file;
    if (!item && !file) {
      return false;
    }

    if (
      parent instanceof WorkspaceBottomPanel &&
      options.position !== "center"
    ) {
      return false;
    }

    const targetTabs =
      parent instanceof WorkspaceTabs
        ? parent
        : new WorkspaceTabs({ leaves: [] });
    const operation =
      options.operation ??
      (options.position === "center" ? "tab-drop" : "split-drop");
    const eventOptions = {
      source: options.source ?? "api",
      operation,
      position: options.position,
      target: targetTabs,
      ...(item ? { item } : {}),
      ...(file ? { file } : {}),
    } satisfies Omit<
      WorkspaceLayoutDropEvent,
      "defaultPrevented" | "preventDefault"
    >;
    const willDrop = this.dispatchLayoutDropEvent(
      "layout-will-drop",
      eventOptions,
    );
    if (willDrop.defaultPrevented) {
      return false;
    }

    if (options.position === "center") {
      if (parent instanceof WorkspaceSplit) {
        parent.addChild(targetTabs);
      }

      if (file) {
        const leaf = new WorkspaceLeaf();
        targetTabs.addChild(leaf);
        targetTabs.selected = leaf;
        await this.withoutLayoutPersistence(() => leaf.openFile(file));
        this.activeLeaf = leaf;
      } else if (item) {
        const movedLeaf = item.detach();
        if (!(movedLeaf instanceof WorkspaceLeaf)) {
          return false;
        }
        targetTabs.addChild(movedLeaf);
        targetTabs.selected = movedLeaf;
        this.activeLeaf = movedLeaf;
      }
      if (targetTabs instanceof WorkspaceBottomPanel) {
        targetTabs._applyOpen(true);
      }

      this.requestSaveLayout({ source: "drag-drop", operation });
      this.dispatchLayoutDropEvent("layout-did-drop", eventOptions);
      return true;
    }

    if (!(parent instanceof WorkspaceTabs)) {
      return false;
    }

    const leaf = new WorkspaceLeaf();
    if (file) {
      await this.withoutLayoutPersistence(() => leaf.openFile(file));
    } else if (item) {
      await this.withoutLayoutPersistence(() =>
        leaf.setViewState({ ...item.state }),
      );
    }

    const newTabs = new WorkspaceTabs({ leaves: [leaf] });
    const activeSplit = parent.parent;
    if (options.position === "top" || options.position === "bottom") {
      if (parent.parent.type === "horizontal") {
        parent.parent.addChild(
          newTabs,
          options.position === "top" ? 0 : undefined,
        );
      } else {
        const tab = activeSplit.removeChild(parent, true);
        if (!tab) {
          return false;
        }
        const split = new WorkspaceView("horizontal");
        if (options.position === "top") {
          split.addChild(newTabs);
          split.addChild(tab);
        } else {
          split.addChild(tab);
          split.addChild(newTabs);
        }
        activeSplit.addChild(split);
      }
    } else {
      if (parent.parent.type === "vertical") {
        parent.parent.addChild(
          newTabs,
          options.position === "left" ? 0 : undefined,
        );
      } else {
        const tab = activeSplit.removeChild(parent, true);
        if (!tab) {
          return false;
        }
        const split = new WorkspaceView("vertical");
        if (options.position === "left") {
          split.addChild(newTabs);
          split.addChild(tab);
        } else {
          split.addChild(tab);
          split.addChild(newTabs);
        }
        activeSplit.addChild(split);
      }
    }

    if (item) {
      item.detach();
    }
    this.activeLeaf = leaf;
    this.requestSaveLayout({ source: "drag-drop", operation });
    this.dispatchLayoutDropEvent("layout-did-drop", {
      ...eventOptions,
      target: newTabs,
    });
    return true;
  }

  moveLeafToSidebarGroupIndex(
    leaf: WorkspaceLeaf,
    group: WorkspaceSidebarGroup,
    index: number,
    options: {
      position: Extract<WorkspaceLayoutDropPosition, "top" | "bottom">;
      source?: WorkspaceLayoutDropSource;
      operation?: string;
    },
  ): boolean {
    const operation = options.operation ?? "sidebar-group-reorder";
    const eventOptions = {
      source: options.source ?? "api",
      operation,
      position: options.position,
      target: group,
      item: leaf,
    } satisfies Omit<
      WorkspaceLayoutDropEvent,
      "defaultPrevented" | "preventDefault"
    >;
    const willDrop = this.dispatchLayoutDropEvent(
      "layout-will-drop",
      eventOptions,
    );
    if (willDrop.defaultPrevented) {
      return false;
    }

    const boundedIndex = Math.max(0, Math.min(index, group.children.length));
    const existingIndex = group.children.findIndex((child) => child === leaf);
    if (existingIndex !== -1) {
      group.removeChild(leaf, true);
    } else if (leaf.parent) {
      leaf.detach(true);
    }

    const insertionIndex =
      existingIndex !== -1 && existingIndex < boundedIndex
        ? boundedIndex - 1
        : boundedIndex;
    group.addChild(leaf, insertionIndex);
    group.hiddenLeafIds = group.hiddenLeafIds.filter((id) => id !== leaf.id);
    group.parent.selected = group;
    this.activeLeaf = leaf;

    this.requestSaveLayout({ source: "drag-drop", operation });
    this.dispatchLayoutDropEvent("layout-did-drop", eventOptions);
    return true;
  }

  moveLeafToSidebarGroup(
    leaf: WorkspaceLeaf,
    group: WorkspaceSidebarGroup,
    options: {
      source?: WorkspaceLayoutDropSource;
      operation?: string;
    } = {},
  ): boolean {
    const operation = options.operation ?? "sidebar-group-drop";
    const eventOptions = {
      source: options.source ?? "api",
      operation,
      position: "center" as const,
      target: group,
      item: leaf,
    } satisfies Omit<
      WorkspaceLayoutDropEvent,
      "defaultPrevented" | "preventDefault"
    >;
    const willDrop = this.dispatchLayoutDropEvent(
      "layout-will-drop",
      eventOptions,
    );
    if (willDrop.defaultPrevented) {
      return false;
    }

    if (leaf.parent) {
      leaf.detach(true);
    }
    group.addChild(leaf);
    group.hiddenLeafIds = group.hiddenLeafIds.filter((id) => id !== leaf.id);
    group.parent.selected = group;
    this.activeLeaf = leaf;

    this.requestSaveLayout({ source: "drag-drop", operation });
    this.dispatchLayoutDropEvent("layout-did-drop", eventOptions);
    return true;
  }

  private containsLeaf(target: WorkspaceLeaf | null): target is WorkspaceLeaf {
    if (!target) {
      return false;
    }

    return Boolean(
      this.iterateAllLeaves((leaf) => leaf === target || undefined),
    );
  }

  private containsRootLeaf(
    target: WorkspaceLeaf | null,
  ): target is WorkspaceLeaf {
    if (!target) {
      return false;
    }

    return Boolean(
      this.rootSplit.iterateAllLeaves((leaf) => leaf === target || undefined),
    );
  }

  private floatingWindowForLeaf(
    target: WorkspaceLeaf | null,
  ): WorkspaceWindow | null {
    if (!target) {
      return null;
    }

    for (const floatingWindow of this.floating.children) {
      const containsTarget = floatingWindow.iterateAllLeaves(
        (leaf) => leaf === target || undefined,
      );
      if (containsTarget) {
        return floatingWindow;
      }
    }

    return null;
  }

  getCommandHostIdForLeaf(target: WorkspaceLeaf | null): string {
    return this.floatingWindowForLeaf(target)?.id ?? WORKSPACE_ROOT_HOST_ID;
  }

  getCommandHostLeaf(hostId: string): WorkspaceLeaf | null {
    if (hostId === WORKSPACE_ROOT_HOST_ID) {
      return this.activeRootLeaf;
    }

    const window = this.floating.children.find((entry) => entry.id === hostId);
    return window ? this.selectedLeafForWindow(window) : null;
  }

  getCommandHostDocument(
    hostId: string = this.getFocusedCommandHostId(),
  ): Document {
    if (hostId === WORKSPACE_ROOT_HOST_ID) {
      return document;
    }

    return (
      this.floating.children.find((entry) => entry.id === hostId)?.doc ??
      document
    );
  }

  getFocusedCommandHostId(): string {
    if (this.focusedHostId === WORKSPACE_ROOT_HOST_ID) {
      return WORKSPACE_ROOT_HOST_ID;
    }

    return this.floating.children.some(
      (entry) => entry.id === this.focusedHostId,
    )
      ? this.focusedHostId
      : WORKSPACE_ROOT_HOST_ID;
  }

  focusRootHost(): void {
    this.focusedHostId = WORKSPACE_ROOT_HOST_ID;
  }

  get activeLeaf() {
    if (this.containsLeaf(this._activeLeaf)) {
      return this._activeLeaf;
    }

    return (
      this.rootSplit.iterateAllTabs((tabs) => tabs.selectedLeaf || undefined) ||
      null
    );
  }

  get activeRootLeaf(): WorkspaceLeaf | null {
    if (this.containsRootLeaf(this._activeLeaf)) {
      return this._activeLeaf;
    }

    return (
      this.rootSplit.iterateAllTabs((tabs) => tabs.selectedLeaf || undefined) ||
      null
    );
  }

  set activeLeaf(leaf: WorkspaceLeaf | null) {
    this._activeLeaf = leaf;
  }

  get activeEditor(): MarkdownFileInfo | null {
    const view = this.activeLeaf?.view;
    if (view instanceof TextFileView) {
      return {
        app: this.app,
        get file() {
          return view.file;
        },
        editor: view.editor,
      };
    }
    return null;
  }

  /** @public */
  get isMobileMode(): boolean {
    return this.displayMode === "mobile";
  }

  /** @public */
  setDisplayMode(
    mode: WorkspaceDisplayMode,
    reason: WorkspaceDisplayModeReason = "manual",
  ): void {
    if (this.displayMode === mode) {
      return;
    }

    const previousMode = this.displayMode;
    this.displayMode = mode;
    if (this.#workspaceHostController) {
      this.#syncingWorkspaceHost += 1;
      try {
        this.#workspaceHostController.renderer.setDisplayMode(mode);
      } finally {
        this.#syncingWorkspaceHost -= 1;
      }
    }
    this.trigger("display-mode-change", {
      mode,
      previousMode,
      reason,
    });
  }

  enterFocusMode(leaf: WorkspaceLeaf | null = this.activeRootLeaf): boolean {
    if (!leaf || !this.containsRootLeaf(leaf)) {
      return false;
    }

    const tabs = this.tabsForLeaf(leaf);
    if (tabs.inSideBar()) {
      return false;
    }

    tabs.selected = leaf;
    this.activeLeaf = leaf;
    this.focusRootHost();
    return this.setFocusMode({ leaf, tabs });
  }

  exitFocusMode(): boolean {
    return this.setFocusMode(null);
  }

  clearFocusModeForLeaf(leaf: WorkspaceLeaf): boolean {
    if (this.focusMode?.leaf !== leaf) {
      return false;
    }

    return this.exitFocusMode();
  }

  isFocusModeForTabs(tabs: WorkspaceTabs): boolean {
    return this.focusMode?.tabs === tabs;
  }

  toJson(): WorkspaceJson {
    return {
      main: this.rootSplit.toJson(),
      left: this.leftSplit.toJson(),
      right: this.rightSplit.toJson(),
      bottom: this.bottomPanel.toJson(),
      floating: this.floating.toJson(),
      active: this.activeLeaf?.id,
    };
  }

  private async restoreLayoutJson(
    config: WorkspaceJson | unknown,
  ): Promise<void> {
    this.exitFocusMode();
    const normalized = normalizeWorkspaceJson(config);
    await this.activateLayoutPlugins(normalized);
    const projectionItems = beginWorkspaceProjection(this);
    try {
      await Promise.all([
        this.rootSplit.loadJson(normalized.main, projectionItems),
        this.leftSplit.loadJson(normalized.left, projectionItems),
        this.rightSplit.loadJson(normalized.right, projectionItems),
        this.bottomPanel.loadJson(normalized.bottom, projectionItems),
        this.floating.loadJson(normalized.floating, projectionItems),
      ]);
    } finally {
      finishWorkspaceProjection(projectionItems);
    }

    if (!normalized.active) {
      if (!this.containsLeaf(this.activeLeaf)) this.activeLeaf = null;
      return;
    }

    this.iterateAllLeaves((leaf) => {
      if (leaf.id === normalized.active) {
        app.workspace.activeLeaf = leaf;
        return false;
      }
    });
  }

  loadLayout(file: string = "workspace.json") {
    this.workspaceLayoutFile = file;
    return this.app.telemetry.measureAsync(
      "workspace.load_layout",
      async (span) => {
        span.setAttribute("workspace.layout_file", file);
        const workspaceFile = app.vault.getFileByPath(
          joinPath("/.obsidian", file),
        );
        this.layoutReady = false;
        let promise!: Promise<void>;
        if (workspaceFile) {
          promise = app.vault.read(workspaceFile).then((contents) => {
            return this.restoreLayoutJson(JSON.parse(contents));
          });
        } else {
          promise = Promise.resolve();
        }
        return promise.then(() => {
          this.commitCompatibilityLayoutToHost({ source: "layout-load" });
          this.layoutReady = true;
          this.layoutHandlers.forEach((it) => it());
          this.trigger("layout-ready");
        });
      },
      {
        attributes: { "workspace.layout_file": file },
        slowThresholdMs: 250,
      },
    );
  }

  /**
   * Runs the callback function right away if layout is already ready, or push
   * it to a queue to be called later when layout is ready.
   *
   * @public
   */
  onLayoutReady(callback: () => any): void {
    if (this.layoutReady) {
      callback();
      return;
    }
    this.layoutHandlers.push(callback);
  }

  constructor(readonly app: App) {
    super();
    this.rootSplit.addChild(new WorkspaceTabs());
    const shellOptions = this.app.props?.workspaceShell;
    const application = shellOptions?.application;
    this.#workspaceHostController = new AppShellController({
      layout: workspaceJsonForDesignCore(this.toJson()),
      application: {
        name: application?.name ?? "Lapis Notes",
        version: this.app.version,
        logoUrl:
          application?.logoUrl === null
            ? undefined
            : (application?.logoUrl ?? DEFAULT_LAPIS_LOGO_URL),
        buildTime: application?.buildTime,
        commitHash: application?.commitHash,
        copyright: application?.copyright,
      },
      plugins:
        shellOptions?.notifications === false ? [] : [notificationsPlugin()],
      persistence: {
        configuration: {
          load: async () => ({
            version: 1,
            values: Object.fromEntries(
              this.app.configuration.getConfiguration().entries<unknown>(),
            ),
          }),
          save: async (snapshot) => {
            await this.app.configuration.updateConfigurationOptions(
              snapshot.values,
            );
          },
        },
      },
    });
    setWorkspaceHostBinding(this, {
      controller: this.#workspaceHostController,
    });
    this.installWorkspaceHostEventBridge(this.#workspaceHostController);
    const editorViewBridgeRef = this.editorViews.on("changed", ({ id }) => {
      this.syncWorkspaceHostEditorView(id);
    });
    this.#editorViewBridgeDisposer = () =>
      this.editorViews.offref(editorViewBridgeRef);
    $effect(() => {
      this.trigger("active-leaf-change", this.activeLeaf);
    });
    $effect(() => {
      this.trigger("resize", {
        id: "left",
        props: { width: this.leftSplit.sidebar.width },
      });
    });
    $effect(() => {
      this.trigger("resize", {
        id: "right",
        props: { width: this.rightSplit.sidebar.width },
      });
    });
  }

  /** @internal Complete the configuration bridge after App construction. */
  bindConfiguration(): void {
    this.#configurationBridgeDisposer?.();
    const controller = this.#workspaceHostController;
    if (!controller) return;

    const syncAll = () => {
      const snapshot = controller.settings.getSnapshot();
      const apiValues = Object.fromEntries(
        this.app.configuration.getConfiguration().entries<unknown>(),
      );
      const next = { ...snapshot.values };
      for (const key of Object.keys(next)) {
        if (Object.hasOwn(apiValues, key)) next[key] = apiValues[key];
      }
      if (!isEqual(next, snapshot.values)) {
        controller.settings.changeSnapshot({ version: 1, values: next });
      }
    };

    const configurationRef = this.app.configuration.on(
      "updated",
      ({ key, value }) => {
        const snapshot = controller.settings.getSnapshot();
        if (!Object.hasOwn(snapshot.values, key)) return;
        const next = { ...snapshot.values };
        if (value === undefined) delete next[key];
        else next[key] = value;
        if (!isEqual(next, snapshot.values)) {
          controller.settings.changeSnapshot({ version: 1, values: next });
        }
      },
    );
    const schemaRef = controller.settings.on("schema-change", syncAll);
    this.#configurationBridgeDisposer = () => {
      this.app.configuration.offref(configurationRef);
      controller.settings.offref(schemaRef);
    };
  }

  /** Dispose the API-owned shell controller and its compatibility bridges. */
  async disposeWorkspaceHost(): Promise<void> {
    this.#configurationBridgeDisposer?.();
    this.#configurationBridgeDisposer = null;
    this.#editorViewBridgeDisposer?.();
    this.#editorViewBridgeDisposer = null;
    this.#workspaceHostViewDisposers.forEach((dispose) => dispose());
    this.#workspaceHostViewDisposers.clear();
    await this.#workspaceHostController?.dispose();
  }

  private syncWorkspaceHostEditorView(id: string): void {
    const registry = this.#workspaceHostController?.editorViews;
    if (!registry) return;
    const contribution = this.editorViews.get(id);
    if (!contribution) {
      registry.unregister(id);
      return;
    }
    registry.unregister(id);
    registry.register(toDesignEditorViewContribution(contribution));
  }

  private installWorkspaceHostEventBridge(
    controller: AppShellController,
  ): void {
    controller.on("layout-change", (event) => {
      if (this.#syncingWorkspaceHost > 0 || event.source === "display-mode") {
        return;
      }
      this.enqueueWorkspaceHostProjection(controller.getLayout(), event);
    });
    controller.on("display-mode-change", (mode) => {
      if (this.#syncingWorkspaceHost > 0 || this.displayMode === mode) return;
      const previousMode = this.displayMode;
      this.displayMode = mode;
      this.trigger("display-mode-change", {
        mode,
        previousMode,
        reason: "viewport",
      });
    });
    controller.on("layout-will-show-overlay", (event) => {
      this.forwardWorkspaceHostDropEvent("layout-will-show-overlay", event);
    });
    controller.on("layout-will-drop", (event) => {
      this.forwardWorkspaceHostDropEvent("layout-will-drop", event);
    });
    controller.on("layout-did-drop", (event) => {
      this.forwardWorkspaceHostDropEvent("layout-did-drop", event);
    });
    controller.on("layout-drag-start", (event) => {
      this.forwardWorkspaceHostDragEvent("layout-drag-start", event);
    });
    controller.on("layout-drag-end", (event) => {
      this.forwardWorkspaceHostDragEvent("layout-drag-end", event);
    });
  }

  private enqueueWorkspaceHostProjection(
    layout: unknown,
    event: DesignWorkspaceLayoutChangeEvent,
  ): void {
    const projected = normalizeWorkspaceJson(layout);
    const preserveSidebarWidth = (
      side: SidebarSide,
      current: WorkspaceSidedock,
    ) => {
      const value = projected[side].width.trim();
      if (/^0(?:px|rem|em|%)?$/.test(value)) {
        projected[side].width = "0";
      } else if (!(event.source === "resize" && event.id === side)) {
        projected[side].width = current.sidebar.width;
      }
    };
    preserveSidebarWidth("left", this.leftSplit);
    preserveSidebarWidth("right", this.rightSplit);

    const run = this.#workspaceHostProjection.then(async () => {
      await this.withoutLayoutPersistence(async () => {
        await this.restoreLayoutJson(projected);
        // Sidedock compatibility effects flush after loadJson resolves. Keep
        // persistence suppressed through that flush so an older queued
        // projection cannot be committed back over a newer controller layout.
        await tick();
      });
      this.emitLayoutChangeAndScheduleSave(
        compatibilityLayoutEventFromDesign(event),
      );
    });
    this.#workspaceHostProjection = run.catch((error) => {
      console.error("Unable to project design-core workspace layout", error);
    });
  }

  private forwardWorkspaceHostDropEvent(
    eventName:
      | "layout-will-show-overlay"
      | "layout-will-drop"
      | "layout-did-drop",
    event: DesignWorkspaceLayoutDropEvent,
  ): void {
    const item = this.getLeafById(event.tabId) ?? undefined;
    const target =
      this.getWorkspaceTabsById(event.targetPaneId) ??
      item?.parent ??
      this.rootSplit;
    const compatibilityEvent = createWorkspaceLayoutDropEvent({
      source: event.source,
      operation: event.operation,
      position: event.position,
      target,
      item,
    });
    this.trigger(eventName, compatibilityEvent);
    if (compatibilityEvent.defaultPrevented) event.preventDefault();
  }

  private forwardWorkspaceHostDragEvent(
    eventName: "layout-drag-start" | "layout-drag-end",
    event: DesignWorkspaceDragEvent,
  ): void {
    const item = this.getLeafById(event.tabId) ?? undefined;
    this.trigger(
      eventName,
      createWorkspaceLayoutDropEvent({
        source: event.source,
        operation: "tab-drag",
        position: "center",
        target: item?.parent ?? this.rootSplit,
        item,
      }),
    );
  }

  private getWorkspaceTabsById(id: string): WorkspaceTabs | null {
    if (this.bottomPanel.id === id) return this.bottomPanel;
    const roots: WorkspaceSplit[] = [
      this.rootSplit,
      this.leftSplit,
      this.rightSplit,
      ...this.floating.children,
    ];
    for (const root of roots) {
      const match = root.iterateAllTabs((tabs) =>
        tabs.id === id ? tabs : undefined,
      );
      if (match) return match;
    }
    return null;
  }

  private registerWorkspaceHostView(type: string): void {
    this.#workspaceHostViewDisposers.get(type)?.();
    this.#workspaceHostViewDisposers.delete(type);
    if (type === "empty" || !this.#workspaceHostController) return;

    const dispose = this.#workspaceHostController.renderer.registry.register({
      kind: "imperative",
      type,
      showHeader: true,
      getChrome: (context: DesignWorkspaceViewContext): DesignWorkspaceViewChrome => {
        const leaf = this.getLeafById(context.tab.id);
        const view = leaf?.view;
        const file = view instanceof FileView ? view.file : null;
        return {
          title: leaf?.getDisplayText() ?? context.tab.title,
          breadcrumbs: filePathBreadcrumbs(this.app, file?.path),
          canGoBack: leaf?.history.hasBackward ?? false,
          canGoForward: leaf?.history.hasForward ?? false,
          onGoBack: () => {
            void leaf?.history.back();
          },
          onGoForward: () => {
            void leaf?.history.forward();
          },
        };
      },
      mount: (target, context) => {
        const leaf = this.getLeafById(context.tab.id);
        if (!leaf) return;
        target.replaceChildren(leaf.containerEl);
        return () => {
          if (leaf.containerEl.parentElement === target) {
            leaf.containerEl.remove();
          }
        };
      },
    });
    this.#workspaceHostViewDisposers.set(type, dispose);
  }

  getMostRecentLeaf(): WorkspaceLeaf | null {
    return this.activeLeaf;
  }

  getVisibleHintTargets(): WorkspaceHintTarget[] {
    const root = this.containerEl;
    if (!root) {
      return [];
    }

    const elements = Array.from(
      root.querySelectorAll<HTMLElement>(WORKSPACE_HINT_TARGET_SELECTOR),
    );
    const seenIds = new Map<string, number>();

    return elements.flatMap((element, index) => {
      const type = normalizeHintText(element.dataset.hintTarget);
      if (
        !type ||
        isHintTargetDisabled(element) ||
        !isHintTargetVisible(element)
      ) {
        return [];
      }

      const label =
        normalizeHintText(element.dataset.hintLabel) ||
        normalizeHintText(element.getAttribute("aria-label")) ||
        normalizeHintText(element.textContent) ||
        type;
      const baseId =
        normalizeHintText(element.dataset.hintTargetId) ||
        `workspace-hint-target:${type}:${index}`;
      const duplicateCount = seenIds.get(baseId) ?? 0;
      seenIds.set(baseId, duplicateCount + 1);

      return [
        {
          id: duplicateCount === 0 ? baseId : `${baseId}:${duplicateCount}`,
          type,
          label,
          action: normalizeHintText(element.dataset.hintAction) || "click",
          element,
          leafId: normalizeHintText(element.dataset.hintLeafId) || undefined,
          commandId:
            normalizeHintText(element.dataset.hintCommandId) || undefined,
          description:
            normalizeHintText(element.dataset.hintDescription) || undefined,
          group: normalizeHintText(element.dataset.hintGroup) || undefined,
        },
      ];
    });
  }

  async changeLayout(workspace: WorkspaceJson | any): Promise<void> {
    this.layoutReady = false;
    try {
      await this.restoreLayoutJson(workspace);
      this.layoutReady = true;
      this.layoutHandlers.forEach((it) => it());
      this.trigger("layout-ready");
      this.requestSaveLayout();
    } catch (error) {
      this.layoutReady = true;
      throw error;
    }
  }

  getLayout(): Record<string, unknown> {
    return this.toJson() as unknown as Record<string, unknown>;
  }

  /**
   * Bring a given leaf to the foreground. If the leaf is in a sidebar, the
   * sidebar will be uncollapsed. `await` this function to ensure your view has
   * been fully loaded and is not deferred.
   *
   * @public
   */
  async revealLeaf(leaf: WorkspaceLeaf): Promise<void> {
    let child: WorkspaceItem = leaf;
    let parent: WorkspaceItem = leaf.parent;
    while (parent) {
      if (parent instanceof WorkspaceTabs) {
        if (
          child instanceof WorkspaceLeaf ||
          child instanceof WorkspaceSidebarGroup
        ) {
          parent.selected = child;
        }
        if (parent instanceof WorkspaceBottomPanel) {
          parent._applyOpen(true);
        }
      } else if (parent instanceof WorkspaceSidedock) {
        parent.sidebar.setOpen(true);
      }
      child = parent;
      parent = parent.parent;
    }

    const floatingWindow = this.floatingWindowForLeaf(leaf);
    if (floatingWindow) {
      this.focusFloatingWindow(floatingWindow);
    }
  }

  registerView(type: string, viewCreator: ViewCreator): void {
    this.viewTypes.set(type, viewCreator);
    this.registerWorkspaceHostView(type);
  }

  registerEditorView(contribution: EditorViewContribution): () => void {
    return this.editorViews.register(contribution);
  }

  registerSidebarView(
    type: string,
    options: SidebarViewPlacementOptions = {},
  ): void {
    this.sidebarViewPlacements.set(type, { ...options });
  }

  unregisterSidebarView(type: string): void {
    this.sidebarViewPlacements.delete(type);
  }

  /**
   * Registers a view with the 'Page preview' core plugin as an emitter of the
   * 'hover-link' event.
   *
   * @public
   */
  registerHoverLinkSource(id: string, info: HoverLinkSource): void {
    this.hoverLinkSources.set(id, { ...info });
  }

  unregisterHoverLinkSource(id: string): void {
    this.hoverLinkSources.delete(id);
  }

  updateOptions() {
    this.app.telemetry.measure(
      "workspace.update_options",
      (span) => {
        let editorCount = 0;
        this.iterateAllLeaves((leaf) => {
          if (leaf.view instanceof TextFileView) {
            editorCount += 1;
            const editor = leaf.view.editor;
            editor.updateExtensions([], leaf.view.getState());
          }
        });
        span.setAttribute("workspace.updated_editor_count", editorCount);
      },
      { slowThresholdMs: 100 },
    );
  }

  unregisterView(type: string) {
    this.#workspaceHostViewDisposers.get(type)?.();
    this.#workspaceHostViewDisposers.delete(type);
    return this.viewTypes.delete(type);
  }

  private normalizeExtensionKey(extension: string): string {
    const normalized = extension.trim().toLowerCase();
    if (!normalized) {
      return "";
    }

    return normalized.startsWith(".") ? normalized : `.${normalized}`;
  }

  private resolveViewTypeForExtensionKey(
    extensionKey: string,
  ): string | undefined {
    if (!extensionKey) {
      return undefined;
    }

    return this.viewExtensions.get(extensionKey);
  }

  private resolveViewTypeForPath(path: string): string | undefined {
    const normalizedPath = path.trim().toLowerCase();
    if (!normalizedPath) {
      return undefined;
    }

    let matchedViewType: string | undefined;
    let matchedExtensionLength = -1;

    for (const [extension, viewType] of this.viewExtensions.entries()) {
      if (
        !normalizedPath.endsWith(extension) ||
        extension.length <= matchedExtensionLength
      ) {
        continue;
      }

      matchedViewType = viewType;
      matchedExtensionLength = extension.length;
    }

    return matchedViewType;
  }

  private extensionKeyToFilenamePattern(extensionKey: string): string {
    return `*${extensionKey}`;
  }

  private humanizeViewType(viewType: string): string {
    return viewType
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/gu, (char) => char.toUpperCase());
  }

  private registeredEditorViewForPath(
    path: string,
  ): RegisteredEditorViewContribution | undefined {
    return this.editorViews
      .getAll()
      .flatMap((view, viewIndex) =>
        view.filenamePatterns
          .filter((pattern) => matchesEditorAssociationGlob(pattern, path))
          .map((pattern) => ({ view, viewIndex, pattern })),
      )
      .filter(({ view }) => this.viewTypes.has(view.viewType))
      .sort((left, right) => {
        const priority = { option: 0, default: 1, exclusive: 2 };
        const priorityDelta =
          priority[right.view.priority] - priority[left.view.priority];
        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        const specificity = compareEditorAssociationPatternSpecificity(
          right.pattern,
          left.pattern,
        );
        if (specificity !== 0) {
          return specificity;
        }

        return left.viewIndex - right.viewIndex;
      })[0]?.view;
  }

  getEditorAssociationForPath(path: string):
    | {
        pattern: string;
        editorViewId: string;
        view?: RegisteredEditorViewContribution;
      }
    | undefined {
    const config = this.app.configuration
      ?.getConfiguration?.()
      ?.get<Record<string, string>>("workspace.editorAssociations", {});
    const associations =
      config && typeof config === "object" && !Array.isArray(config)
        ? config
        : {};

    return Object.entries(associations)
      .map(([pattern, editorViewId], index) => ({
        pattern,
        editorViewId,
        index,
      }))
      .filter(
        ({ pattern, editorViewId }) =>
          typeof editorViewId === "string" &&
          editorViewId.trim().length > 0 &&
          matchesEditorAssociationGlob(pattern, path),
      )
      .sort((left, right) => {
        const specificity = compareEditorAssociationPatternSpecificity(
          right.pattern,
          left.pattern,
        );
        return specificity || right.index - left.index;
      })
      .map(({ pattern, editorViewId }) => ({
        pattern,
        editorViewId,
        view: this.editorViews.get(editorViewId),
      }))[0];
  }

  private resolveEditorAssociationViewType(path: string): string | undefined {
    const association = this.getEditorAssociationForPath(path);
    if (association?.view && this.viewTypes.has(association.view.viewType)) {
      return association.view.viewType;
    }

    return this.registeredEditorViewForPath(path)?.viewType;
  }

  registerExtensions(extensions: string[], viewType: string): void {
    const filenamePatterns: string[] = [];
    extensions.forEach((ext) => {
      const extensionKey = this.normalizeExtensionKey(ext);
      if (!extensionKey) {
        return;
      }

      this.viewExtensions.set(extensionKey, viewType);
      filenamePatterns.push(this.extensionKeyToFilenamePattern(extensionKey));
    });

    if (filenamePatterns.length === 0) {
      return;
    }

    const existing = this.editorViews.getByViewType(viewType)[0];
    if (existing) {
      this.editorViews.update(existing.id, { filenamePatterns });
      return;
    }

    this.editorViews.upsert({
      id: viewType,
      viewType,
      label: this.humanizeViewType(viewType),
      filenamePatterns,
      priority: "default",
      source: "compat",
    });
  }

  unregisterExtensions(extensions: string[], viewType: string) {
    const filenamePatterns: string[] = [];
    extensions.forEach((ext) => {
      const extensionKey = this.normalizeExtensionKey(ext);
      if (this.viewExtensions.get(extensionKey) === viewType) {
        this.viewExtensions.delete(extensionKey);
      }
      if (extensionKey) {
        filenamePatterns.push(this.extensionKeyToFilenamePattern(extensionKey));
      }
    });

    for (const view of this.editorViews.getByViewType(viewType)) {
      this.editorViews.removeFilenamePatterns(view.id, filenamePatterns);
    }
  }

  determineViewType(type: string) {
    if (this.viewTypes.has(type)) {
      return type;
    }

    return this.resolveViewTypeForExtensionKey(
      this.normalizeExtensionKey(type),
    );
  }

  determineViewTypeForPath(path: string) {
    return (
      this.resolveEditorAssociationViewType(path) ??
      this.resolveViewTypeForPath(path)
    );
  }

  async createOnDemandPluginInstallView(
    leaf: WorkspaceLeaf,
    file: TFile,
    options: { confirm?: boolean } = {},
  ): Promise<OnDemandPluginInstallView | null> {
    const confirm = options.confirm ?? true;
    if (confirm && !(await this.confirmOnDemandRegistryLookup(file.path))) {
      return null;
    }

    const entry = await this.findOnDemandPluginForPath(file.path);
    if (!entry) {
      return null;
    }

    return new OnDemandPluginInstallView(leaf, entry, this.app);
  }

  private onDemandRegistryLookupConfirmed = new Set<string>();

  private async findOnDemandPluginForPath(
    path: string,
  ): Promise<PluginCatalogEntry | null> {
    const distribution = this.app.pluginDistribution;
    if (!distribution) {
      return null;
    }

    try {
      await distribution.refreshCatalog();
    } catch (error) {
      new Notice(
        `Unable to check the official plugin registry: ${formatUnknownError(error)}`,
        6000,
      );
      return null;
    }

    return (
      distribution
        .search({
          channel: "official",
          compatibleOnly: true,
        })
        .find(
          (entry) =>
            entry.channel === "official" &&
            registryContributionMatchesPath(entry, path),
        ) ?? null
    );
  }

  private confirmOnDemandRegistryLookup(path: string): Promise<boolean> {
    if (this.onDemandRegistryLookupConfirmed.has(path)) {
      return Promise.resolve(true);
    }

    return promptConfirm(this.getCommandHostDocument(), {
      title: "No editor available",
      description: `No installed editor can open ${path}. Check the official plugin registry for a verified plugin?`,
      confirmLabel: "Check registry",
      cancelLabel: "Cancel",
    }).then((confirmed) => {
      if (confirmed) {
        this.onDemandRegistryLookupConfirmed.add(path);
      }
      return confirmed;
    });
  }

  private async activateLayoutPlugins(layout: WorkspaceJson): Promise<void> {
    const viewTypes = new Set<string>();
    collectLayoutViewTypes(layout.main, viewTypes);
    collectLayoutViewTypes(layout.left, viewTypes);
    collectLayoutViewTypes(layout.right, viewTypes);
    collectLayoutViewTypes(layout.bottom, viewTypes);
    for (const window of layout.floating ?? []) {
      collectLayoutViewTypes(window, viewTypes);
    }
    for (const viewType of viewTypes) {
      await this.app.plugins.activateForViewType(viewType);
    }
  }

  viewCreator(type: string | TFile) {
    if (typeof type === "string") {
      const viewType = this.determineViewType(type);
      if (viewType) {
        return this.viewTypes.get(viewType);
      }
    } else if (type instanceof TFile) {
      const viewType =
        this.determineViewTypeForPath(type.path) ??
        this.determineViewType(type.extension);
      if (viewType) {
        return this.viewTypes.get(viewType);
      }
    }
  }

  setActiveLeaf(
    leaf: WorkspaceLeaf,
    params?: {
      /** @public */
      focus?: boolean;
    },
  ): void {
    this.activeLeaf = leaf;
    this.revealLeaf(leaf);
  }

  /**
   * Retrieve a leaf by its id.
   *
   * @param id Id of the leaf to retrieve.
   * @public
   */
  getLeafById(id: string): WorkspaceLeaf | null {
    return (
      this.iterateAllLeaves((leaf) => {
        return leaf.id === id ? leaf : undefined;
      }) || null
    );
  }

  /**
   * Get the currently active view of a given type.
   *
   * @public
   */
  getActiveViewOfType<T extends View>(type: Constructor<T>): T | null {
    const leaf = this.activeLeaf;
    if (leaf && leaf.view instanceof type) {
      return leaf.view;
    }
    return null;
  }

  /**
   * Iterate through all leaves in the main area of the workspace.
   *
   * @public
   */
  iterateRootLeaves(callback: (leaf: WorkspaceLeaf) => any): void {
    this.rootSplit.iterateAllLeaves(callback);
  }

  /**
   * Returns the file for the current view if it's a `FileView`. Otherwise, it
   * will return the most recently active file.
   *
   * @public
   */
  getActiveFile(): TFile | null {
    const leaf = this.activeLeaf;
    if (leaf && leaf.view instanceof FileView) {
      return leaf.view.file;
    }
    return null;
  }

  /**
   * Iterate through all leaves, including main area leaves, floating leaves,
   * and sidebar leaves.
   *
   * @public
   */
  iterateAllLeaves<T = any>(callback: (leaf: WorkspaceLeaf) => T): T | void {
    for (const child of [
      this.rootSplit,
      this.leftSplit,
      this.rightSplit,
      this.bottomPanel,
      this.floating,
    ]) {
      const response = child.iterateAllLeaves(callback);
      if (response !== undefined && response !== null) {
        return response;
      }
    }
  }

  /** @public */
  getOpenLeafEntries(
    options: WorkspaceOpenLeafEntryOptions = {},
  ): WorkspaceOpenLeafEntry[] {
    const includeMain = options.includeMain ?? true;
    const includeLeftSidebar = options.includeLeftSidebar ?? true;
    const includeRightSidebar = options.includeRightSidebar ?? true;
    const includeBottomPanel = options.includeBottomPanel ?? true;
    const includeFloating = options.includeFloating ?? true;
    const includePopout = options.includePopout ?? true;
    const entries: WorkspaceOpenLeafEntry[] = [];

    const pushLeaf = (
      leaf: WorkspaceLeaf,
      region: WorkspaceOpenLeafRegion,
      parentWindow?: WorkspaceWindow,
    ) => {
      const tabs = this.tabsForLeaf(leaf);
      const group =
        leaf.parent instanceof WorkspaceSidebarGroup ? leaf.parent : undefined;
      const view = leaf.view;
      const isSelectedInParent = group
        ? tabs.selectedChild === group && !group.isLeafHidden(leaf)
        : tabs.selectedLeaf === leaf;

      entries.push({
        id: leaf.id,
        leaf,
        title: view.getDisplayText(),
        icon: view.getIcon(),
        viewType: view.getViewType(),
        ...(view instanceof FileView && view.file?.path
          ? { filePath: view.file.path }
          : {}),
        region,
        active: this.activeLeaf === leaf,
        selectedInParent: isSelectedInParent,
        parentTabsId: tabs.id,
        ...(group
          ? {
              parentGroupId: group.id,
              parentGroupName: group.name,
            }
          : {}),
        ...(parentWindow
          ? {
              parentWindowId: parentWindow.id,
              parentWindowMode: parentWindow.mode,
            }
          : {}),
      });
    };

    if (includeMain) {
      this.rootSplit.iterateAllLeaves((leaf) => {
        pushLeaf(leaf, "main");
      });
    }

    if (includeLeftSidebar) {
      this.leftSplit.iterateAllLeaves((leaf) => {
        pushLeaf(leaf, "left");
      });
    }

    if (includeRightSidebar) {
      this.rightSplit.iterateAllLeaves((leaf) => {
        pushLeaf(leaf, "right");
      });
    }

    if (includeBottomPanel) {
      this.bottomPanel.iterateAllLeaves((leaf) => {
        pushLeaf(leaf, "bottom");
      });
    }

    if (includeFloating || includePopout) {
      this.floating.children.forEach((window) => {
        const region =
          window.mode === "popout"
            ? ("popout" as const)
            : ("floating" as const);
        if (
          (region === "floating" && !includeFloating) ||
          (region === "popout" && !includePopout)
        ) {
          return;
        }

        window.iterateAllLeaves((leaf) => {
          pushLeaf(leaf, region, window);
        });
      });
    }

    return entries;
  }

  /**
   * Remove all leaves of the given type.
   *
   * @public
   */
  detachLeavesOfType(viewType: string): void {
    this.getLeavesOfType(viewType).forEach((leaf) => {
      leaf.close();
    });
  }

  getLeavesOfType(viewType: string): WorkspaceLeaf[] {
    const leaves: WorkspaceLeaf[] = [];
    this.iterateAllLeaves((leaf) => {
      if (leaf.view.getViewType() === viewType) {
        leaves.push(leaf);
      }
    });
    return leaves;
  }

  /** @public */
  activateLeaf(
    leaf: WorkspaceLeaf | null,
    options: WorkspaceActivateLeafOptions = {},
  ): boolean {
    if (!this.containsLeaf(leaf)) {
      return false;
    }

    const tabs = this.tabsForLeaf(leaf);
    if (leaf.parent instanceof WorkspaceSidebarGroup) {
      tabs.selected = leaf.parent;
      if (leaf.parent.isLeafHidden(leaf)) {
        leaf.parent.setLeafHidden(leaf, false);
      }
    } else {
      tabs.selected = leaf;
    }
    if (tabs instanceof WorkspaceBottomPanel) {
      tabs._applyOpen(true);
    }

    const floatingWindow = this.floatingWindowForLeaf(leaf);
    if (floatingWindow) {
      this.floating.bringToFront(floatingWindow);
      if (this.isMobileMode) {
        if (options.focusRootHost ?? true) {
          this.focusRootHost();
        }
      } else {
        this.focusedHostId = floatingWindow.id;
        if (floatingWindow.mode === "popout") {
          floatingWindow.focusPopoutWindow();
        }
      }
    } else if (options.focusRootHost ?? true) {
      this.focusRootHost();
    }

    this.activeLeaf = leaf;

    if (options.saveLayout ?? true) {
      this.requestSaveLayout({
        source: options.source ?? "api",
        operation: options.operation ?? "activate-leaf",
      });
    }

    return true;
  }

  /** @public */
  closeLeafAndSelectFallback(
    leaf: WorkspaceLeaf,
    options: WorkspaceCloseLeafAndSelectFallbackOptions = {},
  ): WorkspaceLeaf | null {
    if (!this.containsLeaf(leaf)) {
      return this.activeLeaf;
    }

    const wasActive = this.activeLeaf === leaf;
    leaf.close();

    let next = this.activeLeaf;
    if (!this.containsLeaf(next) || next === leaf) {
      next = null;
    }

    if (!next && (options.preferRoot ?? true)) {
      next = this.activeRootLeaf;
    }

    if (!next) {
      next = this.getOpenLeafEntries()[0]?.leaf ?? null;
    }

    if (wasActive && next) {
      this.activateLeaf(next, {
        saveLayout: false,
        source: "api",
        operation: "close-leaf-select-fallback",
      });
    }

    if (options.saveLayout ?? true) {
      this.requestSaveLayout({
        source: "api",
        operation: "close-leaf-mobile",
      });
    }

    return next;
  }

  createLeafInParent(parent: WorkspaceSplit, index: number): WorkspaceLeaf {
    const leaf = new WorkspaceLeaf();
    parent.addChild(new WorkspaceTabs({ leaves: [leaf] }), index);
    return leaf;
  }

  createLeafBySplit(
    leaf: WorkspaceLeaf,
    direction: SplitDirection = "vertical",
    before: boolean = false,
  ): WorkspaceLeaf {
    const sibling = new WorkspaceLeaf();
    const tab = this.tabsForLeaf(leaf);
    if (tab instanceof WorkspaceBottomPanel) {
      throw new Error("Bottom panel does not support split panes");
    }
    const split = tab.parent;
    const index = split.children.findIndex((it) => it === tab);
    const newTab = new WorkspaceTabs({ leaves: [sibling] });
    if (split.type === direction) {
      split.addChild(newTab, before ? index : index + 1);
    } else {
      const oldTab = split.removeChild(tab, true);
      const nested = new WorkspaceView(direction);
      if (before) {
        nested.addChild(newTab);
        oldTab && nested.addChild(oldTab);
      } else {
        oldTab && nested.addChild(oldTab);
        nested.addChild(newTab);
      }
      split.addChild(nested, index);
    }
    return sibling;
  }

  splitActiveLeaf(direction?: SplitDirection): WorkspaceLeaf {
    return this.getLeaf("split", direction);
  }

  getUnpinnedLeaf(): WorkspaceLeaf {
    return this.getLeaf(false);
  }

  getGroupLeaves(group: string): WorkspaceLeaf[] {
    const leaves: WorkspaceLeaf[] = [];
    this.iterateAllLeaves((leaf) => {
      if (leaf.group === group) {
        leaves.push(leaf);
      }
    });
    return leaves;
  }

  private sideDock(side: SidebarSide): WorkspaceSidedock {
    return side === "left" ? this.leftSplit : this.rightSplit;
  }

  private tabsForLeaf(leaf: WorkspaceLeaf): WorkspaceTabs {
    return leaf.parent instanceof WorkspaceSidebarGroup
      ? leaf.parent.parent
      : leaf.parent;
  }

  private setFocusMode(state: WorkspaceFocusModeState | null): boolean {
    if (
      this.focusMode?.leaf === state?.leaf &&
      this.focusMode?.tabs === state?.tabs
    ) {
      return false;
    }

    this.focusMode = state;
    this.trigger("focus-mode-change", state);
    return true;
  }

  private selectedLeafForWindow(window: WorkspaceWindow): WorkspaceLeaf | null {
    return (
      window.iterateAllTabs((tabs) => tabs.selectedLeaf || undefined) ?? null
    );
  }

  getSidebarGroups(side?: SidebarSide): WorkspaceSidebarGroup[] {
    const groups: WorkspaceSidebarGroup[] = [];
    const sections = side
      ? [this.sideDock(side)]
      : [this.leftSplit, this.rightSplit];
    sections.forEach((section) => {
      section.iterateAllTabs((tabs) => {
        tabs.children.forEach((child) => {
          if (child instanceof WorkspaceSidebarGroup) {
            groups.push(child);
          }
        });
      });
    });
    return groups;
  }

  getSidebarGroup(
    side: SidebarSide,
    group: string,
  ): WorkspaceSidebarGroup | null {
    const id = normalizeSidebarGroupId(group);
    return (
      this.getSidebarGroups(side).find(
        (candidate) => candidate.id === id || candidate.name === group,
      ) ?? null
    );
  }

  getOrCreateSidebarGroup(
    side: SidebarSide,
    group: string,
    options: SidebarGroupOptions = {},
  ): WorkspaceSidebarGroup {
    const id = normalizeSidebarGroupId(options.id ?? group);
    const existing = this.getSidebarGroup(side, id);
    if (existing) {
      if (options.name !== undefined) existing.name = options.name;
      if (options.icon !== undefined) existing.icon = options.icon;
      return existing;
    }

    const sidebarGroup = new WorkspaceSidebarGroup({
      id,
      name: options.name ?? group,
      icon: options.icon,
      hiddenLeafIds: options.hiddenLeafIds,
      collapsed: options.collapsed,
    });
    this.findOrCreateTab(this.sideDock(side)).addChild(sidebarGroup);
    this.requestSaveLayout();
    return sidebarGroup;
  }

  getSidebarGroupLeaves(side: SidebarSide, group: string): WorkspaceLeaf[] {
    return this.getSidebarGroup(side, group)?.children ?? [];
  }

  convertSidebarLeavesToGroup(
    side: SidebarSide,
    leaves: WorkspaceLeaf[],
    options: SidebarGroupOptions & { group?: string } = {},
  ): WorkspaceSidebarGroup {
    if (!leaves.length) {
      throw new Error("Cannot create a sidebar group without leaves");
    }

    const groupId = options.id ?? options.group ?? leaves[0].view.getViewType();
    const group = new WorkspaceSidebarGroup({
      id: normalizeSidebarGroupId(groupId),
      name: options.name ?? groupId,
      icon: options.icon,
      hiddenLeafIds: options.hiddenLeafIds,
      collapsed: options.collapsed,
    });
    const tabs = this.tabsForLeaf(leaves[0]);
    const insertIndex = Math.max(
      0,
      Math.min(
        ...leaves.map((leaf) => tabs.children.findIndex((it) => it === leaf)),
      ),
    );

    leaves.forEach((leaf) => {
      if (this.tabsForLeaf(leaf) !== tabs) {
        throw new Error(
          "Sidebar group conversion requires leaves in one tab set",
        );
      }
      tabs.removeChild(leaf, true);
      leaf.parent = undefined as unknown as WorkspaceTabs;
      group.addChild(leaf);
    });
    tabs.addChild(group, insertIndex);
    tabs.selected = group;
    if (side !== "left" && side !== "right") {
      throw new Error(`Unsupported sidebar side: ${side}`);
    }
    this.requestSaveLayout();
    return group;
  }

  convertSidebarGroupToLeaves(group: WorkspaceSidebarGroup): WorkspaceLeaf[] {
    const tabs = group.parent;
    const index = tabs.children.findIndex((it) => it === group);
    const leaves = [...group.children];
    tabs.removeChild(group, true);
    group.children = [];
    group.hiddenLeafIds = [];
    group.collapsed = {};
    leaves.forEach((leaf, offset) => {
      tabs.addChild(leaf, index + offset);
    });
    tabs.selected = leaves[0] ?? "0";
    this.requestSaveLayout();
    return leaves;
  }

  getLastOpenFiles(): string[] {
    const files: string[] = [];
    this.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof FileView && leaf.view.file) {
        files.push(leaf.view.file.path);
      }
    });
    return [...new Set(files)];
  }

  async openLinkText(
    linktext: string,
    sourcePath: string,
    newLeaf?: PaneType | boolean,
    openState?: OpenViewState,
  ): Promise<void> {
    const linkpath = linktext.split(/[|#]/, 1)[0];
    const candidates = [linkpath, `${linkpath}.md`, `${linkpath}.markdown`];
    const file = candidates
      .map((path) => app.vault.getFileByPath(path))
      .find((file): file is TFile => file instanceof TFile);
    if (!file) {
      new Notice(`Unable to find file: ${linktext}`);
      return;
    }
    const leaf = this.getLeaf(newLeaf);
    const state = openState?.state
      ? { type: leaf.view.getViewType(), state: openState.state }
      : undefined;
    if (openState?.active !== false) {
      this.activeLeaf = leaf;
    }
    await leaf.openFile(file, { state });
  }

  ensureSideLeaf(
    type: string,
    sideOrOptions: SidebarSide | EnsureSideLeafOptions = "right",
    options: EnsureSideLeafOptions = {},
  ): WorkspaceLeaf {
    const registeredOptions = this.sidebarViewPlacements.get(type) ?? {};
    const requestedOptions =
      arguments.length < 2
        ? {}
        : typeof sideOrOptions === "string"
          ? { ...options, side: sideOrOptions }
          : sideOrOptions;
    const placement = { ...registeredOptions, ...requestedOptions };
    const side = placement.side ?? "right";

    if (placement.group) {
      const group = this.getOrCreateSidebarGroup(side, placement.group, {
        id: placement.group,
        name: placement.groupTitle ?? placement.title ?? placement.group,
        icon: placement.groupIcon ?? placement.icon,
      });
      const existing = group.children.find(
        (leaf) => leaf.view.getViewType() === type,
      );
      if (existing) return existing;

      const leaf = new WorkspaceLeaf();
      group.addChild(leaf);
      if (placement.hidden) {
        group.setLeafHidden(leaf, true);
      }
      this.requestSaveLayout();
      return leaf;
    }

    const existing = this.getLeavesOfType(type)[0];
    if (existing) return existing;
    const leaf =
      side === "left" ? this.getLeftLeaf(false) : this.getRightLeaf(false);
    if (!leaf) {
      throw new Error(`Unable to create ${side} leaf`);
    }
    return leaf;
  }

  handleLinkContextMenu(
    menu: Menu,
    linktext: string,
    sourcePath: string,
    event?: MouseEvent,
  ): void {
    menu.addItem((item) =>
      item.setTitle("Open link").onClick(() => {
        this.openLinkText(linktext, sourcePath);
      }),
    );
  }

  moveLeafToPopout(
    leaf: WorkspaceLeaf,
    data?: WorkspaceWindowInitData,
  ): WorkspaceWindow {
    return this.moveWorkspaceChildToWindow(leaf, data, {
      mode: "popout",
      source: "api",
      operation: "move-leaf-to-popout",
    });
  }

  moveWorkspaceChildToPopout(
    item: WorkspaceTabsChild,
    data?: WorkspaceWindowInitData,
  ): WorkspaceWindow {
    return this.moveWorkspaceChildToWindow(item, data, {
      mode: "popout",
      source: "api",
      operation: "move-workspace-child-to-popout",
    });
  }

  openPopoutLeaf(data?: WorkspaceWindowInitData): WorkspaceLeaf {
    const window = this.createWorkspaceWindow({ ...data, mode: "popout" });
    const tabs = new WorkspaceTabs({ leaves: [] });
    const leaf = new WorkspaceLeaf();
    tabs.addChild(leaf);
    tabs.selected = leaf;
    window.addChild(tabs);
    this.floating.addChild(window);
    this.floating.bringToFront(window);
    this.activeLeaf = leaf;
    this.requestSaveLayout({
      source: "popout",
      operation: "open-popout-window",
    });
    return leaf;
  }

  openFloatingLeaf(data?: WorkspaceWindowInitData): WorkspaceLeaf {
    const window = this.createWorkspaceWindow({ ...data, mode: "floating" });
    const tabs = new WorkspaceTabs({ leaves: [] });
    const leaf = new WorkspaceLeaf();
    tabs.addChild(leaf);
    tabs.selected = leaf;
    window.addChild(tabs);
    this.floating.addChild(window);
    this.floating.bringToFront(window);
    this.activeLeaf = leaf;
    this.requestSaveLayout({
      source: "api",
      operation: "open-floating-window",
    });
    return leaf;
  }

  moveWorkspaceChildToFloating(
    item: WorkspaceTabsChild,
    data?: WorkspaceWindowInitData,
    options: {
      source?: WorkspaceLayoutDropSource;
      operation?: string;
    } = {},
  ): WorkspaceWindow {
    return this.moveWorkspaceChildToWindow(item, data, {
      ...options,
      mode: "floating",
    });
  }

  supportsPopoutWindows(): boolean {
    return supportsWorkspacePopouts();
  }

  private createWorkspaceWindow(
    data: WorkspaceWindowInitData = {},
  ): WorkspaceWindow {
    if (data.mode !== "popout") {
      return new WorkspaceWindow({ ...data, mode: "floating" });
    }

    const handle = openWorkspacePopoutHandle(data);
    if (!handle) {
      throw new Error(WORKSPACE_POPOUT_UNSUPPORTED_ERROR_MESSAGE);
    }

    const window = new WorkspaceWindow(
      { ...data, mode: "popout" },
      handle.win,
      handle.doc,
    );
    window.attachPopoutHandle(handle, () => {
      if (this.floating.children.includes(window)) {
        this.closeFloatingWindow(window, {
          closeHost: false,
          operation: "close-popout-window",
        });
      }
    });
    return window;
  }

  private moveWorkspaceChildToWindow(
    item: WorkspaceTabsChild,
    data: WorkspaceWindowInitData | undefined,
    options: {
      mode: WorkspaceWindowMode;
      source?: WorkspaceLayoutDropSource;
      operation?: string;
    },
  ): WorkspaceWindow {
    const window = this.createWorkspaceWindow({ ...data, mode: options.mode });
    const operation = options.operation ?? "float-pane";
    const eventOptions = {
      source: options.source ?? "api",
      operation,
      position: "center" as const,
      target: window,
      item,
    } satisfies Omit<
      WorkspaceLayoutDropEvent,
      "defaultPrevented" | "preventDefault"
    >;
    const willDrop = this.dispatchLayoutDropEvent(
      "layout-will-drop",
      eventOptions,
    );
    if (willDrop.defaultPrevented) {
      window.closePopoutWindow();
      return window;
    }

    // Build and commit the destination tree before detaching the item from its
    // source.  This ensures the item always has a reachable parent: if anything
    // between the detach and the addChild were to throw, the window is already
    // registered in this.floating and the item is still in its original tree.
    const tabs = new WorkspaceTabs({ leaves: [] });
    window.addChild(tabs);
    this.floating.addChild(window);
    if (item.parent) {
      item.detach(true);
    }
    tabs.addChild(item);
    tabs.selected = item;
    this.floating.bringToFront(window);
    this.activeLeaf =
      item instanceof WorkspaceLeaf ? item : item.getSelectedLeaf();

    this.requestSaveLayout({
      source:
        options.mode === "popout"
          ? "popout"
          : options.source === "api"
            ? "api"
            : "drag-drop",
      operation,
    });
    this.dispatchLayoutDropEvent("layout-did-drop", eventOptions);
    return window;
  }

  focusFloatingWindow(window: WorkspaceWindow): void {
    const alreadyTopmost = this.floating.children.at(-1) === window;
    this.focusedHostId = window.id;
    this.floating.bringToFront(window);
    window.focusPopoutWindow();

    const selectedLeaf = this.selectedLeafForWindow(window);
    if (selectedLeaf) {
      this.activeLeaf = selectedLeaf;
    }

    if (!alreadyTopmost) {
      this.requestSaveLayout({
        source: "api",
        operation: "focus-floating-pane",
      });
    }
  }

  setFloatingWindowDisplayState(
    window: WorkspaceWindow,
    displayState: WorkspaceWindowDisplayState,
    operation: string = `set-floating-pane-${displayState}`,
  ): void {
    window.setDisplayState(displayState);
    this.floating.bringToFront(window);
    const selectedLeaf = this.selectedLeafForWindow(window);
    if (selectedLeaf && displayState !== "minimized") {
      this.activeLeaf = selectedLeaf;
    }
    this.requestSaveLayout({ source: "api", operation });
  }

  collapseFloatingWindow(window: WorkspaceWindow): void {
    this.setFloatingWindowDisplayState(
      window,
      "collapsed",
      "collapse-floating-pane",
    );
  }

  minimizeFloatingWindow(window: WorkspaceWindow): void {
    this.setFloatingWindowDisplayState(
      window,
      "minimized",
      "minimize-floating-pane",
    );
  }

  maximizeFloatingWindow(window: WorkspaceWindow): void {
    this.setFloatingWindowDisplayState(
      window,
      "maximized",
      "maximize-floating-pane",
    );
  }

  restoreFloatingWindow(window: WorkspaceWindow): void {
    this.setFloatingWindowDisplayState(
      window,
      "normal",
      "restore-floating-pane",
    );
  }

  setFloatingWindowBounds(
    window: WorkspaceWindow,
    bounds: Partial<Record<"x" | "y" | "width" | "height", number>>,
  ): void {
    window.setBounds(bounds);
  }

  commitFloatingWindowBounds(
    window: WorkspaceWindow,
    bounds: Partial<Record<"x" | "y" | "width" | "height", number>>,
    operation: string = "resize-floating-pane",
  ): void {
    window.setBounds(bounds);
    this.requestSaveLayout({ source: "resize", operation });
  }

  closeFloatingWindow(
    window: WorkspaceWindow,
    options: {
      closeHost?: boolean;
      operation?: string;
    } = {},
  ): void {
    if (this.focusedHostId === window.id) {
      this.focusedHostId = WORKSPACE_ROOT_HOST_ID;
    }
    if (options.closeHost !== false) {
      window.closePopoutWindow();
    }
    const leaves: WorkspaceLeaf[] = [];
    window.iterateAllLeaves((leaf) => {
      leaves.push(leaf);
    });
    leaves.forEach((leaf) => leaf.close());
    if (this.floating.children.includes(window)) {
      this.floating.removeChild(window);
    }
    this.activeLeaf = this.activeRootLeaf;
    this.requestSaveLayout({
      source: window.mode === "popout" ? "popout" : "api",
      operation:
        options.operation ??
        (window.mode === "popout"
          ? "close-popout-window"
          : "close-floating-pane"),
    });
  }

  private createSideLeaf(section: WorkspaceSidedock): WorkspaceLeaf | null {
    const leaf = new WorkspaceLeaf();
    const currentTab = this.findOrCreateTab(section);
    const layout = currentTab.parent;
    const index = layout.children.findIndex((child) => child === currentTab);
    const tab = layout.removeChild(currentTab, true);

    if (!tab || index === -1) {
      return null;
    }

    const nested = new WorkspaceView("horizontal");
    nested.addChild(tab);
    nested.addChild(new WorkspaceTabs({ leaves: [leaf] }));
    layout.addChild(nested, index);
    return leaf;
  }

  private findOrCreateTab(
    section: WorkspaceSidedock | WorkspaceView,
  ): WorkspaceTabs {
    const rootLeaf = section.iterateAllLeaves((leaf) => leaf);
    let currentTab: WorkspaceTabs;

    if (rootLeaf) {
      currentTab = this.tabsForLeaf(rootLeaf);
    } else {
      const tab = section.iterateAllTabs((tab) => tab);
      if (tab) {
        currentTab = tab;
      } else {
        let split = section.iterateAllSplits((split) => split);
        currentTab = new WorkspaceTabs({ leaves: [] });
        if (split) {
          split.addChild(currentTab);
        } else {
          const view = new WorkspaceView();
          view.addChild(currentTab);
          section.addChild(view);
        }
      }
    }
    return currentTab;
  }

  /**
   * Create a new leaf inside the right sidebar.
   *
   * @param split Should the existing split be split up?
   * @public
   */
  getRightLeaf(split: boolean): WorkspaceLeaf | null {
    if (split) {
      return this.createSideLeaf(this.rightSplit);
    }
    const leaf = new WorkspaceLeaf();
    this.findOrCreateTab(this.rightSplit).addChild(leaf);
    return leaf;
  }

  /**
   * Create a new leaf inside the left sidebar.
   *
   * @param split Should the existing split be split up?
   * @public
   */
  getLeftLeaf(split: boolean): WorkspaceLeaf | null {
    if (split) {
      return this.createSideLeaf(this.leftSplit);
    }
    const leaf = new WorkspaceLeaf();
    this.findOrCreateTab(this.leftSplit).addChild(leaf);
    return leaf;
  }

  /** Create and activate a new leaf in the bottom panel. @public */
  getBottomLeaf(): WorkspaceLeaf {
    const leaf = new WorkspaceLeaf();
    this.bottomPanel.addChild(leaf);
    this.bottomPanel.selected = leaf;
    this.bottomPanel._applyOpen(true);
    this.activeLeaf = leaf;
    this.focusRootHost();
    this.requestSaveLayout({
      source: "bottom-panel",
      operation: "open-leaf",
    });
    return leaf;
  }

  /** Open or close the bottom panel without changing its last size. @public */
  setBottomPanelOpen(open: boolean): void {
    if (this.bottomPanel.collapsed === !open) return;
    this.bottomPanel._applyOpen(open);
    this.requestSaveLayout({
      source: "bottom-panel",
      operation: open ? "expand" : "collapse",
    });
  }

  /** Resize the bottom panel using design-core's supported range. @public */
  setBottomPanelSize(size: number): void {
    if (!Number.isFinite(size)) return;
    const nextSize = Math.min(640, Math.max(120, size));
    if (this.bottomPanel.size === nextSize) return;
    this.bottomPanel._applySize(nextSize);
    this.requestSaveLayout({
      source: "bottom-panel",
      operation: "resize",
    });
  }

  /** Toggle the bottom panel while retaining its last expanded size. @public */
  toggleBottomPanel(): void {
    this.setBottomPanelOpen(this.bottomPanel.collapsed);
  }

  /** Configured desktop span of the bottom panel. @public */
  get bottomPanelAlignment(): WorkspaceBottomPanelAlignment {
    return (
      this.#workspaceHostController?.workspace.bottomPanelAlignment ?? "center"
    );
  }

  /** Update the live design-core shell setting without writing workspace JSON. */
  setBottomPanelAlignment(alignment: WorkspaceBottomPanelAlignment): boolean {
    return (
      this.#workspaceHostController?.workspace.setBottomPanelAlignment(
        alignment,
      ) ?? false
    );
  }

  duplicateLeaf(
    leaf: WorkspaceLeaf,
    leafType: PaneType | boolean,
    direction: SplitDirection = "vertical",
  ): Promise<WorkspaceLeaf> {
    if (
      leafType === "split" &&
      this.tabsForLeaf(leaf) instanceof WorkspaceBottomPanel
    ) {
      return Promise.reject(
        new Error("Bottom panel does not support split panes"),
      );
    }
    if (leafType === "window") {
      const popoutLeaf = this.openPopoutLeaf();
      return popoutLeaf.setViewState({ ...leaf.state }).then(() => {
        app.workspace.activeLeaf = popoutLeaf;
        return popoutLeaf;
      });
    }

    const duplicateLeaf = new WorkspaceLeaf();
    return duplicateLeaf.setViewState({ ...leaf.state }).then(() => {
      const leafTabs = this.tabsForLeaf(leaf);
      const split = leafTabs.parent;

      switch (leafType) {
        case true:
        case "tab":
          leafTabs.addChild(duplicateLeaf);
          leafTabs.selected = (leafTabs.children.length - 1).toString();
          break;
        case "split":
          direction ||= "vertical";
          if (split.type === direction) {
            split.addChild(new WorkspaceTabs({ leaves: [duplicateLeaf] }));
          } else {
            const index = split.children.findIndex((it) => it === leafTabs);
            const tab = split.removeChild(leafTabs, true);
            if (tab) {
              const layout = new WorkspaceView(direction);
              layout.addChild(tab);
              layout.addChild(new WorkspaceTabs({ leaves: [duplicateLeaf] }));
              split.addChild(layout, index);
            }
          }
      }
      app.workspace.activeLeaf = duplicateLeaf;
      return duplicateLeaf;
    });
  }

  /**
   * If newLeaf is false (or not set) then an existing leaf which can be
   * navigated is returned, or a new leaf will be created if there was no leaf
   * available.
   *
   * If newLeaf is `'tab'` or `true` then a new leaf will be created in the
   * preferred location within the root split and returned.
   *
   * If newLeaf is `'split'` then a new leaf will be created adjacent to the
   * currently active leaf.
   *
   * If newLeaf is `'window'` then a popout window will be created with a new
   * leaf inside.
   *
   * @public
   */
  getLeaf(
    newLeaf?: PaneType | boolean,
    direction?: SplitDirection,
  ): WorkspaceLeaf {
    if (!newLeaf) {
      const focusedHostId = this.getFocusedCommandHostId();
      if (focusedHostId !== WORKSPACE_ROOT_HOST_ID) {
        const focusedHostLeaf = this.getCommandHostLeaf(focusedHostId);
        if (focusedHostLeaf) {
          return focusedHostLeaf;
        }
      }

      const activeFloatingWindow = this.floatingWindowForLeaf(this._activeLeaf);
      if (activeFloatingWindow && this._activeLeaf) {
        return this._activeLeaf;
      }
      if (this.activeRootLeaf) {
        return this.activeRootLeaf;
      }
      const tab = this.findOrCreateTab(this.rootSplit);
      if (tab.selectedLeaf) {
        return tab.selectedLeaf;
      }
      const leaf = new WorkspaceLeaf();
      tab.addChild(leaf);
      return leaf;
    }

    if (newLeaf === "tab" || newLeaf === true) {
      const tab = this.findOrCreateTab(this.rootSplit);
      const leaf = new WorkspaceLeaf();
      tab.addChild(leaf);
      return leaf;
    }

    if (newLeaf === "split") {
      const activeTab =
        (this.activeLeaf &&
          this.containsRootLeaf(this.activeLeaf) &&
          this.tabsForLeaf(this.activeLeaf)) ||
        this.findOrCreateTab(this.rootSplit);
      const leaf = new WorkspaceLeaf();

      const view = activeTab.parent;
      const dir = direction ?? "vertical";
      if (view.type === dir) {
        view.addChild(new WorkspaceTabs({ leaves: [leaf] }));
      } else {
        const tab = view.removeChild(activeTab);
        if (tab) {
          const split = new WorkspaceView(dir);
          split.addChild(tab);
          split.addChild(new WorkspaceTabs({ leaves: [leaf] }));
          view.addChild(split);
        }
      }

      return leaf;
    }

    if (newLeaf === "window") {
      return this.openPopoutLeaf();
    }

    throw new Error(`Unsupported pane: ${newLeaf}`);
  }
}

export class OnDemandPluginInstallView extends FileView {
  private status: "idle" | "installing" | "failed" = $state("idle");
  private errorMessage: string | null = $state(null);

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: PluginCatalogEntry,
    private readonly application: App = globalThis.app,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return ON_DEMAND_PLUGIN_INSTALL_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.name ?? "Install plugin";
  }

  getIcon(): string {
    return "download";
  }

  canAcceptExtension(): boolean {
    return true;
  }

  async onLoadFile(file: TFile): Promise<void> {
    this.file = file;
    this.render();
  }

  async onUnloadFile(): Promise<void> {
    this.file = null;
  }

  async onRename(file: TFile): Promise<void> {
    this.file = file;
    this.render();
  }

  getErrorMessage(): string | null {
    return this.errorMessage;
  }

  async installAndOpen(): Promise<boolean> {
    if (!this.file || this.status === "installing") {
      return false;
    }

    this.status = "installing";
    this.errorMessage = null;
    this.render();

    try {
      await withPluginInstallProgress(
        this.application,
        {
          pluginId: this.plugin.id,
          title: `Installing ${this.plugin.name}`,
          source: "Plugin install",
        },
        (signal) =>
          this.application.pluginDistribution.install(this.plugin.id, {
            requireOfficial: true,
            enable: true,
            signal,
          }),
      );
      const file = this.file;
      const viewCreator = this.application.workspace.viewCreator(file);
      if (!viewCreator) {
        throw new Error(
          `Plugin ${this.plugin.name} installed, but it did not register a handler for ${file.path}.`,
        );
      }
      await this.leaf.openFile(file, { result: { history: false } });
      return true;
    } catch (error) {
      if (isAbortError(error)) {
        this.status = "idle";
        this.errorMessage = null;
        this.render();
        return false;
      }
      this.status = "failed";
      this.errorMessage =
        error instanceof Error ? error.message : String(error);
      this.render();
      return false;
    }
  }

  load(): void {
    this.render();
  }

  unload(): void {
    this.leaf?.contentEl?.replaceChildren();
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  private render(): void {
    const fileName = this.file?.name ?? "this file";
    const root = document.createElement("section");
    root.className = "plugin-install-prompt";

    const panel = document.createElement("div");
    panel.className = "plugin-install-prompt__panel";
    root.appendChild(panel);

    const title = document.createElement("h2");
    title.className = "plugin-install-prompt__title";
    title.textContent = `${this.plugin.name} is required`;
    panel.appendChild(title);

    const body = document.createElement("p");
    body.className = "plugin-install-prompt__body";
    body.textContent = `${fileName} can be opened by the verified official ${this.plugin.name} plugin.`;
    panel.appendChild(body);

    if (this.errorMessage) {
      const error = document.createElement("pre");
      error.className = "plugin-install-prompt__error";
      error.textContent = this.errorMessage;
      panel.appendChild(error);
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "plugin-install-prompt__button";
    button.disabled = this.status === "installing";
    button.textContent =
      this.status === "installing"
        ? "Installing..."
        : this.status === "failed"
          ? "Retry install"
          : "Install and open";
    button.addEventListener("click", () => {
      void this.installAndOpen();
    });
    panel.appendChild(button);

    this.leaf?.contentEl?.replaceChildren(root);
  }
}

export interface OpenViewState {
  /** @public */
  state?: Record<string, unknown>;
  /** @public */
  eState?: Record<string, unknown>;
  /** @public */
  active?: boolean;
  /** @public */
  group?: WorkspaceLeaf;
}

type WorkspaceLeafJson = {
  id: string;
  type: "leaf";
  state: {
    type: string;
    state: Record<string, unknown>;
    icon: string;
    title: string;
  };
};

function collectLayoutViewTypes(
  node: WorkspaceSplitJson | WorkspaceTabsJson | WorkspaceWindowJson,
  target: Set<string>,
): void {
  if (node.type === "split" || node.type === "floating") {
    for (const child of node.children) {
      collectLayoutViewTypes(child, target);
    }
    return;
  }

  for (const child of node.children) {
    if (child.type === "leaf" && typeof child.state?.type === "string") {
      target.add(child.state.type);
    }
  }
}

/**
 * Single navigable pane in the workspace that hosts one {@link View} at a time.
 *
 * @public
 */
export class WorkspaceLeaf extends WorkspaceItem<{
  "pinned-change": [pinned: boolean];
  "group-change": [pinned: boolean];
}> {
  private _view: View = $state()!;
  hoverPopover: null = null;
  pinned: boolean = $state(false);
  group: string | null = $state(null);
  private ephemeralState: any = {};

  contentEl: HTMLElement = $state()!;
  containerEl: HTMLElement = $state()!;

  history: HistoryManager<ViewState>;

  declare parent: WorkspaceTabs | WorkspaceSidebarGroup;
  currentState: ViewState = Object.freeze({
    type: "empty",
    state: Object.freeze({}),
  });

  detach(softDelete: boolean = false) {
    return this.parent.removeChild(this, softDelete);
  }

  get state() {
    const value = { ...this.currentState };
    value.state ||= {};
    Object.freeze(value.state);
    return Object.freeze(value);
  }

  set state(value: ViewState) {
    value = { ...value };
    value.state ||= {};
    Object.freeze(value.state);
    this.currentState = Object.freeze(value);
  }

  constructor(view?: View) {
    super();
    if (view) {
      view.leaf = this;
      this.view = view;
    } else {
      const viewCreator =
        this.app?.workspace?.viewCreator("empty") ||
        ((leaf: WorkspaceLeaf) => new EmptyView(leaf));
      this.view = viewCreator(this);
    }
    this.containerEl = createDiv("h-full");
    this.contentEl = this.containerEl.createDiv();
    this.history = new HistoryManager<ViewState>(this.updateHistory.bind(this));
  }

  updateHistory(state: ViewState): Promise<void> {
    const nextState = cloneViewState(state);
    this.state = nextState;
    this.pinned = !!nextState.pinned;

    const filePath = historyFilePathForViewState(nextState);
    const file = filePath ? app.vault.getFileByPath(filePath) : null;
    if (file instanceof TFile) {
      this.ensureContentEl();
      return this.openFile(file, {
        state: nextState,
        result: { history: false },
      });
    }

    this.ensureContentEl();
    return this.setViewState(nextState, { history: false });
  }

  captureCurrentViewState(): ViewState {
    return captureLeafViewState(this);
  }

  private snapshotHistoryBeforeNavigation(result?: ViewStateResult): void {
    if (result?.history === false || this.history.history.length === 0) {
      return;
    }

    const currentState = this.captureCurrentViewState();
    this.state = currentState;
    this.history.replaceState(cloneViewState(currentState));
  }

  private pushHistoryAfterNavigation(result?: ViewStateResult): void {
    if (result?.history === false) {
      return;
    }

    this.history.pushState(cloneViewState(this.state));
  }

  get view(): View {
    return this._view;
  }

  set view(view: View) {
    if (this._view === view) {
      return;
    }

    if (this._view) {
      const previousView = this._view;
      previousView.unload();
      if (hasDestroyableEditor(previousView)) {
        previousView.editor.destroy();
      }
    }
    this._view = view;
  }

  get app() {
    return globalThis.app;
  }

  open(
    view: View,
    result: ViewStateResult = { history: true },
    state?: ViewState,
  ): Promise<View> {
    view.leaf = this;
    const filePath = (state || this.state)?.state?.["file"]?.toString();
    const file = filePath ? app.vault.getFileByPath(filePath) : null;
    this.view = view;
    if (file instanceof TFile) {
      return this.openFile(file, { view, result, state }).then(() => view);
    } else if (filePath) {
      new Notice(`Unable to load file: ${filePath}`);
    }
    this.ensureContentEl();
    if (result?.history !== false) {
      this.snapshotHistoryBeforeNavigation(result);
    }
    this.view.load();
    if (result?.history !== false) {
      this.pushHistoryAfterNavigation(result);
    }
    this.app.workspace.requestSaveLayout();
    return Promise.resolve(this.view);
  }

  private ensureContentEl(): void {
    if (this.contentEl.parentElement === this.containerEl) {
      return;
    }
    this.containerEl.empty();
    this.containerEl.appendChild(this.contentEl);
  }

  openFile(
    file: TFile,
    {
      view,
      result,
      state,
    }: { view?: View; result?: ViewStateResult; state?: ViewState } = {},
  ): Promise<void> {
    return this.app.telemetry
      .measureAsync(
        "workspace.leaf.prepare_open_file",
        async () => {
          await this.app.plugins.activateForPath(file.path);
          const languageIds = this.app.plugins.findLanguageIdsForPath(
            file.path,
          );
          for (const languageId of languageIds) {
            await this.app.plugins.activateForLanguage(languageId);
          }
          const association = this.app.workspace.getEditorAssociationForPath(
            file.path,
          );
          if (association?.view) {
            await this.app.plugins.activateForViewType(
              association.view.viewType,
            );
          }
        },
        { slowThresholdMs: 100 },
      )
      .then(async () => {
        view =
          view ??
          resolveViewForOpenFile(this, file) ??
          (await this.app.workspace.createOnDemandPluginInstallView(
            this,
            file,
          )) ??
          undefined;
        return this.app.telemetry.measureAsync(
          "workspace.leaf.open_file",
          async (span) => {
            span.setAttribute("leaf.id", this.id);
            span.setAttribute("file.extension", file.extension);
            span.setAttribute("view.type", view?.getViewType?.() ?? "unknown");
            if (view instanceof FileView) {
              if (result?.history !== false) {
                this.snapshotHistoryBeforeNavigation(result);
              }
              this.ensureContentEl();

              const mergedState = {
                ...view.getState(),
                ...(state?.state ?? {}),
                file: file.path,
              };
              await view.setState(mergedState);
              this.state = {
                type: view.getViewType(),
                state: mergedState,
              };
              this.view = view;

              await view.onLoadFile(file);
              if (result?.history !== false) {
                this.pushHistoryAfterNavigation(result);
              }
              this.view.load();
              this.app.workspace.requestSaveLayout();
              return;
            }
          },
          {
            attributes: {
              "leaf.id": this.id,
              "file.extension": file.extension,
            },
            slowThresholdMs: 250,
          },
        );
      });
  }

  async setViewState(viewState: ViewState, eState?: any) {
    return this.app.telemetry.measureAsync(
      "workspace.leaf.set_view_state",
      async (span) => {
        span.setAttribute("leaf.id", this.id);
        span.setAttribute("view.type", viewState.type);
        const requestedViewType = viewState.type;
        const filePath = viewState.state?.["file"]?.toString();
        const file = filePath ? app.vault.getFileByPath(filePath) : null;

        if (
          requestedViewType === ON_DEMAND_PLUGIN_INSTALL_VIEW_TYPE &&
          file instanceof TFile
        ) {
          const promptView =
            await this.app.workspace.createOnDemandPluginInstallView(
              this,
              file,
              { confirm: false },
            );
          if (promptView) {
            this.state = viewState;
            this.pinned = !!viewState.pinned;
            const result: ViewStateResult = {
              history: eState?.history === true,
            };
            await promptView.setState({ ...(viewState.state || {}) });
            await this.open(promptView, result, viewState);
            return;
          }
        }

        await this.app.plugins.activateForViewType(viewState.type);
        let viewCreator = this.app.workspace.viewCreator(viewState.type);
        const isMissingViewType = !viewCreator;
        let resolvedViewState = viewState;

        if (!viewCreator) {
          new Notice(`Unknown view type: ${viewState.type}`);
          resolvedViewState = {
            ...viewState,
            type: "empty",
            state: {
              ...(viewState.state ?? {}),
              __missingViewType: requestedViewType,
            },
          };
          viewCreator =
            this.app.workspace.viewCreator("empty") ||
            ((leaf: WorkspaceLeaf) => new EmptyView(leaf));
        }
        this.state = resolvedViewState;
        this.pinned = !!viewState.pinned;
        const view = viewCreator(this);
        const result: ViewStateResult = { history: eState?.history === true };
        await view.setState({ ...(resolvedViewState.state || {}) });
        await this.open(view, result, resolvedViewState);
      },
      {
        attributes: {
          "leaf.id": this.id,
          "view.type": viewState.type,
        },
        slowThresholdMs: 150,
      },
    );
  }

  getViewState(): ViewState {
    return this.state;
  }

  get isDeferred(): boolean {
    return false;
  }

  loadIfDeferred(): Promise<void> {
    return Promise.resolve();
  }

  getEphemeralState(): any {
    return this.ephemeralState;
  }

  setEphemeralState(state: any): void {
    this.ephemeralState = state;
  }

  togglePinned(): void {
    this.setPinned(!this.pinned);
  }

  setPinned(pinned: boolean): void {
    this.pinned = pinned;
    this.state = { ...this.state, pinned };
    this.trigger("pinned-change", pinned);
  }

  setGroupMember(other: WorkspaceLeaf): void {
    if (other.group) {
      this.setGroup(other.group);
    }
  }

  setGroup(group: string): void {
    this.group = group;
    this.trigger("group-change", !!group);
  }

  getIcon(): string {
    return this.view.getIcon();
  }

  getDisplayText(): string {
    return this.view.getDisplayText();
  }

  getContainer(): WorkspaceContainer {
    return this.app.workspace.rootContainer;
  }

  onResize(): void {}

  close() {
    this.parent.removeChild(this);
  }

  loadJson(layout: WorkspaceLeafJson) {
    this.id = layout.id;
    if (
      this.view.getViewType() === layout.state.type &&
      isEqual(this.view.getState(), layout.state.state)
    ) {
      this.state = {
        type: layout.state.type,
        state: { ...layout.state.state },
      };
      return Promise.resolve();
    }
    return this.setViewState(
      {
        type: layout.state.type,
        state: layout.state.state,
      },
      { history: true },
    );
  }

  reload() {
    this.loadJson(this.toJson());
  }

  toJson(): WorkspaceLeafJson {
    return {
      id: this.id,
      type: "leaf",
      state: {
        type: this.view.getViewType(),
        state: this.view.getState(),
        icon: this.view.getIcon(),
        title: this.view.getDisplayText(),
      },
    };
  }
}

export class Notice {
  id!: string | number;
  noticeEl: HTMLElement = createDiv();
  containerEl: HTMLElement = this.noticeEl;
  messageEl: HTMLElement = this.noticeEl.createDiv();

  constructor(message: string, duration?: number) {
    this.messageEl.setText(message);
    if (globalThis.app?.notifications) {
      const record = globalThis.app.notifications.notify({
        message,
        id: createNoticeId(),
      });
      this.id = record.id;
      return;
    }
    this.id = toast(message, { duration });
  }

  setMessage(message: string) {
    this.messageEl.setText(message);
    const id = this.id;
    if (globalThis.app?.notifications) {
      globalThis.app.notifications.notify({
        message,
        id: String(id),
      });
      return;
    }
    this.id = toast(message, { id });
  }

  hide(): void {
    toast.dismiss(this.id);
    this.noticeEl.detach();
  }
}

function createNoticeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `notice-${crypto.randomUUID()}`;
  }
  return `notice-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}
