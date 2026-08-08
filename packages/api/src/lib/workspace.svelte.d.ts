import { EventDispatcher, type EventMap } from "./events";
import { View, type ViewState, type ViewStateResult } from "./view.svelte";
import type { Menu } from "./menu.svelte";
import { TFile, type TAbstractFile } from "./storage/fs";
import type { Editor, MarkdownFileInfo } from "./editor.svelte";
import { SidebarState, type SidebarStateProps } from "@lapis-notes/ui/sidebar-custom";
import { HistoryManager } from "./history.svelte";
import type { TransactionSpec } from "@codemirror/state";
import type { App } from "./context.svelte";
import { EditorViewRegistry, type EditorViewContribution, type RegisteredEditorViewContribution } from "./editor-view-registry";
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
export declare abstract class WorkspaceItem<T extends EventMap<T> = EventMap<any>> extends EventDispatcher<T> {
    parent: WorkspaceParent;
    id: string;
    constructor();
    _root: WorkspaceItem | undefined;
    getRoot(): WorkspaceItem;
}
export declare abstract class WorkspaceParent<T extends EventMap<T> = EventMap<any>> extends WorkspaceItem<T> {
    constructor();
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
export type WorkspaceWindowDisplayState = "normal" | "collapsed" | "minimized" | "maximized";
export declare const WORKSPACE_ROOT_HOST_ID = "root";
type WorkspaceWindowPersistedDisplayState = Extract<WorkspaceWindowDisplayState, "collapsed" | "minimized">;
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
export declare const WORKSPACE_POPOUT_UNSUPPORTED_ERROR_MESSAGE = "Workspace popout windows are not supported in the current renderer host.";
export declare function setWorkspacePopoutHost(host: WorkspacePopoutHost | null): void;
export declare function getWorkspacePopoutHost(): WorkspacePopoutHost | null;
export declare function supportsWorkspacePopouts(): boolean;
export declare abstract class WorkspaceSplit<T extends EventMap<T> = EventMap<any>> extends WorkspaceParent<T> {
    type: "horizontal" | "vertical";
    children: Array<WorkspaceTabs | WorkspaceView>;
    sizes: number[];
    constructor(type?: "horizontal" | "vertical");
    loadJson(layout: WorkspaceSplitJson): Promise<void>;
    toJson(): WorkspaceSplitJson;
    addChild(child: WorkspaceTabs | WorkspaceView, index?: number): void;
    iterateAllSplits<T = any>(callback: (split: WorkspaceSplit<any>) => T): T | void;
    iterateAllTabs<T = any>(callback: (tab: WorkspaceTabs) => T): T | void;
    iterateAllLeaves<T = any>(callback: (leaf: WorkspaceLeaf) => T): T | void;
    onEmpty(): void;
    removeChild(index: number | WorkspaceTabs | WorkspaceSplit, softDelete?: boolean): WorkspaceTabs | WorkspaceView | undefined;
    get topLeft(): void | WorkspaceTabs;
    get topRight(): WorkspaceTabs;
}
export declare class WorkspaceView extends WorkspaceSplit {
}
type WorkspaceSidedockJson = WorkspaceSplitJson & {
    width: string;
};
/**
 * Collapsible split container used for the left and right workspace sidebars.
 *
 * @public
 */
export declare class WorkspaceSidedock extends WorkspaceSplit<{
    "sidebar-changed": [id: string, open: boolean, width: string];
}> {
    protected open: boolean;
    sidebar: SidebarState;
    constructor(options?: Partial<SidebarStateProps>);
    loadJson(layout: WorkspaceSidedockJson): Promise<void>;
    toJson(): WorkspaceSidedockJson;
    onEmpty(): void;
    get size(): string;
    get collapsed(): boolean;
    toggle(): void;
    collapse(): void;
    expand(): void;
}
export declare abstract class WorkspaceContainer<T extends EventMap<T> = EventMap<any>> extends WorkspaceSplit<T> {
    /** @public */
    abstract win: Window;
    /** @public */
    abstract doc: Document;
}
export declare class WorkspaceRoot extends WorkspaceContainer {
    readonly win: Window;
    readonly doc: Document;
    constructor(win?: Window, doc?: Document);
}
export declare class WorkspaceWindow extends WorkspaceContainer {
    mode: WorkspaceWindowMode;
    displayState: WorkspaceWindowDisplayState;
    x: number;
    y: number;
    width: number;
    height: number;
    win: Window;
    doc: Document;
    private focusHost;
    private closeHost;
    private detachHostClose;
    constructor(data?: WorkspaceWindowInitData, win?: Window, doc?: Document);
    private applyInitData;
    attachPopoutHandle(handle: WorkspacePopoutHostHandle, onClose: () => void): void;
    focusPopoutWindow(): void;
    closePopoutWindow(): void;
    loadWindowJson(layout: WorkspaceWindowJson): Promise<void>;
    toWindowJson(): WorkspaceWindowJson;
    setBounds(bounds: Partial<Record<"x" | "y" | "width" | "height", number>>): void;
    setDisplayState(displayState: WorkspaceWindowDisplayState): void;
    removeChild(index: number | WorkspaceTabs | WorkspaceSplit, softDelete?: boolean): WorkspaceTabs | WorkspaceView | undefined;
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
export declare class WorkspaceFloating extends WorkspaceParent {
    children: WorkspaceWindow[];
    loadJson(layouts?: WorkspaceWindowJson[]): Promise<any[]>;
    toJson(): WorkspaceWindowJson[];
    addChild(child: WorkspaceWindow, index?: number): void;
    bringToFront(child: WorkspaceWindow): void;
    removeChild(index: number | WorkspaceWindow, softDelete?: boolean): WorkspaceWindow | undefined;
    iterateAllLeaves<T = any>(callback: (leaf: WorkspaceLeaf) => T): T | void;
}
export declare class WorkspaceMobileDrawer extends WorkspaceParent {
    collapsed: boolean;
    expand(): void;
    collapse(): void;
    toggle(): void;
}
type WorkspaceTabsJson = {
    id: string;
    type: "tabs";
    stacked: boolean;
    children: WorkspaceTabsChildJson[];
    currentTab: number;
};
type WorkspaceBottomPanelJson = WorkspaceTabsJson & {
    height: string;
};
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
export interface EnsureSideLeafOptions extends SidebarViewPlacementOptions {
}
export interface SidebarGroupOptions {
    id?: string;
    name?: string;
    icon?: string;
    hiddenLeafIds?: string[];
    collapsed?: Record<string, boolean>;
    panelSizes?: Record<string, number>;
}
export type WorkspaceTabsChild = WorkspaceLeaf | WorkspaceSidebarGroup;
/**
 * Sidebar-only container that groups leaves into a named view container.
 *
 * @public
 */
export declare class WorkspaceSidebarGroup extends WorkspaceParent {
    parent: WorkspaceTabs;
    name: string;
    icon: string | undefined;
    hiddenLeafIds: string[];
    collapsed: Record<string, boolean>;
    panelSizes: Record<string, number>;
    children: WorkspaceLeaf[];
    constructor(options?: SidebarGroupOptions);
    detach(softDelete?: boolean): WorkspaceTabsChild | undefined;
    addChild(child: WorkspaceLeaf, index?: number): void;
    removeChild(index: number | WorkspaceLeaf, softDelete?: boolean): WorkspaceLeaf | undefined;
    getSelectedLeaf(): WorkspaceLeaf | null;
    iterateAllLeaves<T = any>(callback: (leaf: WorkspaceLeaf) => T): T | void;
    isLeafHidden(leaf: WorkspaceLeaf | string): boolean;
    setLeafHidden(leaf: WorkspaceLeaf | string, hidden: boolean): void;
    isLeafCollapsed(leaf: WorkspaceLeaf | string): boolean;
    setLeafCollapsed(leaf: WorkspaceLeaf | string, collapsed: boolean): void;
    getLeafPanelSize(leaf: WorkspaceLeaf | string): number | undefined;
    setPanelSizes(leaves: WorkspaceLeaf[], sizes: number[]): void;
    private serializedPanelSizes;
    loadJson(layout: WorkspaceSidebarGroupJson): Promise<void>;
    toJson(): WorkspaceSidebarGroupJson;
}
/**
 * Tab strip container for root and sidebar workspace leaves.
 *
 * @public
 */
export declare class WorkspaceTabs extends WorkspaceParent {
    containerEl: HTMLElement | null;
    stacked: boolean;
    _selected: string;
    parent: WorkspaceSplit<Record<string, any>>;
    children: WorkspaceTabsChild[];
    constructor(props?: Partial<{
        leaves: WorkspaceLeaf[];
        stacked: boolean;
    }>);
    loadJson(layout: WorkspaceTabsJson): Promise<void>;
    toJson(): WorkspaceTabsJson;
    get selected(): string;
    get sideBar(): WorkspaceSidedock | undefined;
    inSideBar(): boolean;
    get selectedIndex(): number;
    get selectedChild(): WorkspaceTabsChild | undefined;
    get selectedLeaf(): WorkspaceLeaf | null;
    set selected(value: string | number | WorkspaceTabsChild);
    detach(softDelete?: boolean): WorkspaceTabs | WorkspaceView | undefined;
    addChild(child: WorkspaceTabsChild, index?: number): void;
    iterateAllLeaves<T = any>(callback: (leaf: WorkspaceLeaf) => T): T | void;
    removeChild(index: number | WorkspaceTabsChild, softDelete?: boolean): WorkspaceTabsChild | undefined;
    closeAll(): void;
}
/** Stable compatibility wrapper for design-core's bottom workspace dock. */
export declare class WorkspaceBottomPanel extends WorkspaceTabs {
    readonly workspace: Workspace;
    protected open: boolean;
    protected height: string;
    constructor(workspace: Workspace);
    loadJson(layout: WorkspaceBottomPanelJson): Promise<void>;
    toJson(): WorkspaceBottomPanelJson;
    get size(): number;
    get collapsed(): boolean;
    expand(): void;
    collapse(): void;
    toggle(): void;
    detach(): undefined;
    removeChild(index: number | WorkspaceTabsChild, softDelete?: boolean): WorkspaceTabsChild | undefined;
    closeAll(): void;
    getRoot(): WorkspaceItem;
    /** @internal */
    _applyOpen(open: boolean): void;
    /** @internal */
    _applySize(size: number): void;
}
export type ViewCreator = (leaf: WorkspaceLeaf) => View;
export type PaneType = "tab" | "split" | "window";
export type SplitDirection = "vertical" | "horizontal";
type WorkspaceRibbonItem = {
    id: string;
    icon: string;
    title: string;
    hidden: boolean;
    callback: (event: MouseEvent) => void;
};
export declare class WorkspaceRibbon {
    readonly workspace: Workspace;
    open: boolean;
    containerEl: HTMLElement;
    ribbonSettingsEl: HTMLElement;
    ribbonItemsEl: HTMLUListElement;
    private _items;
    constructor(workspace: Workspace);
    get items(): WorkspaceRibbonItem[];
    addItem(item: WorkspaceRibbonItem): () => void;
    removeItem(id: string): void;
}
type WorkspaceJson = {
    main: WorkspaceSplitJson;
    left: WorkspaceSidedockJson;
    right: WorkspaceSidedockJson;
    bottom: WorkspaceBottomPanelJson;
    floating?: WorkspaceWindowJson[];
    active?: string;
};
export type WorkspaceLayoutChangeSource = "api" | "drag-drop" | "layout-load" | "resize" | "bottom-panel" | "popout";
export interface WorkspaceLayoutChangeEvent {
    source: WorkspaceLayoutChangeSource;
    operation?: string;
}
export type WorkspaceOpenLeafRegion = "main" | "left" | "right" | "bottom" | "floating" | "popout";
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
export interface WorkspaceOpenLeafEntryOptions {
    includeMain?: boolean;
    includeLeftSidebar?: boolean;
    includeRightSidebar?: boolean;
    includeBottomPanel?: boolean;
    includeFloating?: boolean;
    includePopout?: boolean;
}
export type WorkspaceBottomPanelAlignment = "left" | "right" | "center" | "justify";
export type WorkspaceLayoutDropPosition = "left" | "right" | "top" | "bottom" | "center";
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
export declare class Workspace extends EventDispatcher<{
    resize: [any];
    "active-leaf-change": [leaf?: WorkspaceLeaf | null];
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
        leaf?: WorkspaceLeaf
    ];
    "files-menu": [
        menu: Menu,
        files: TAbstractFile[],
        source: string,
        leaf?: WorkspaceLeaf
    ];
    "editor-menu": [menu: Menu, editor: Editor];
    "editor-updated": [editor: Editor, transactions: readonly TransactionSpec[]];
}> {
    readonly app: App;
    private viewTypes;
    private viewExtensions;
    readonly editorViews: EditorViewRegistry;
    private sidebarViewPlacements;
    private hoverLinkSources;
    rootContainer: WorkspaceRoot;
    rootSplit: WorkspaceView;
    _activeLeaf: WorkspaceLeaf | null;
    focusMode: WorkspaceFocusModeState | null;
    focusedHostId: string;
    leftSplit: WorkspaceSidedock;
    rightSplit: WorkspaceSidedock;
    bottomPanel: WorkspaceBottomPanel;
    floating: WorkspaceFloating;
    layoutReady: boolean;
    private layoutHandlers;
    private suspendedLayoutPersistence;
    private workspaceLayoutFile;
    statusEl: HTMLElement;
    statusCompatEl: HTMLElement;
    leftRibbon: WorkspaceRibbon;
    rightRibbon: WorkspaceRibbon;
    containerEl: HTMLElement;
    private saveLayoutDebounced;
    requestSaveLayout(event?: WorkspaceLayoutChangeEvent): void;
    private withoutLayoutPersistence;
    private dispatchLayoutDropEvent;
    willShowLayoutDropOverlay(options: Omit<WorkspaceLayoutDropEvent, "defaultPrevented" | "preventDefault">): WorkspaceLayoutDropEvent;
    startLayoutDrag(options: Omit<WorkspaceLayoutDropEvent, "defaultPrevented" | "preventDefault">): WorkspaceLayoutDropEvent;
    endLayoutDrag(options: Omit<WorkspaceLayoutDropEvent, "defaultPrevented" | "preventDefault">): WorkspaceLayoutDropEvent;
    moveWorkspaceChildToTabIndex(item: WorkspaceLeaf | WorkspaceSidebarGroup, target: WorkspaceTabs, index: number, options: {
        position: Extract<WorkspaceLayoutDropPosition, "left" | "right">;
        source?: WorkspaceLayoutDropSource;
        operation?: string;
    }): boolean;
    dropWorkspaceItemOnTabs(parent: WorkspaceTabs | WorkspaceSplit, options: {
        position: WorkspaceLayoutDropPosition;
        item?: WorkspaceLeaf;
        file?: TFile;
        source?: WorkspaceLayoutDropSource;
        operation?: string;
    }): Promise<boolean>;
    moveLeafToSidebarGroupIndex(leaf: WorkspaceLeaf, group: WorkspaceSidebarGroup, index: number, options: {
        position: Extract<WorkspaceLayoutDropPosition, "top" | "bottom">;
        source?: WorkspaceLayoutDropSource;
        operation?: string;
    }): boolean;
    moveLeafToSidebarGroup(leaf: WorkspaceLeaf, group: WorkspaceSidebarGroup, options?: {
        source?: WorkspaceLayoutDropSource;
        operation?: string;
    }): boolean;
    private containsLeaf;
    private containsRootLeaf;
    private floatingWindowForLeaf;
    getCommandHostIdForLeaf(target: WorkspaceLeaf | null): string;
    getCommandHostLeaf(hostId: string): WorkspaceLeaf | null;
    getCommandHostDocument(hostId?: string): Document;
    getFocusedCommandHostId(): string;
    focusRootHost(): void;
    get activeLeaf(): WorkspaceLeaf | null;
    get activeRootLeaf(): WorkspaceLeaf | null;
    set activeLeaf(leaf: WorkspaceLeaf | null);
    get activeEditor(): MarkdownFileInfo | null;
    enterFocusMode(leaf?: WorkspaceLeaf | null): boolean;
    exitFocusMode(): boolean;
    clearFocusModeForLeaf(leaf: WorkspaceLeaf): boolean;
    isFocusModeForTabs(tabs: WorkspaceTabs): boolean;
    toJson(): WorkspaceJson;
    private restoreLayoutJson;
    loadLayout(file?: string): Promise<void>;
    /**
     * Runs the callback function right away if layout is already ready, or push
     * it to a queue to be called later when layout is ready.
     *
     * @public
     */
    onLayoutReady(callback: () => any): void;
    constructor(app: App);
    /** @internal Complete the configuration bridge after App construction. */
    bindConfiguration(): void;
    /** Dispose the API-owned shell controller and its compatibility bridges. */
    disposeWorkspaceHost(): Promise<void>;
    getMostRecentLeaf(): WorkspaceLeaf | null;
    getVisibleHintTargets(): WorkspaceHintTarget[];
    changeLayout(workspace: WorkspaceJson | any): Promise<void>;
    getLayout(): Record<string, unknown>;
    /**
     * Bring a given leaf to the foreground. If the leaf is in a sidebar, the
     * sidebar will be uncollapsed. `await` this function to ensure your view has
     * been fully loaded and is not deferred.
     *
     * @public
     */
    revealLeaf(leaf: WorkspaceLeaf): Promise<void>;
    registerView(type: string, viewCreator: ViewCreator): void;
    registerEditorView(contribution: EditorViewContribution): () => void;
    registerSidebarView(type: string, options?: SidebarViewPlacementOptions): void;
    unregisterSidebarView(type: string): void;
    /**
     * Registers a view with the 'Page preview' core plugin as an emitter of the
     * 'hover-link' event.
     *
     * @public
     */
    registerHoverLinkSource(id: string, info: HoverLinkSource): void;
    unregisterHoverLinkSource(id: string): void;
    updateOptions(): void;
    unregisterView(type: string): boolean;
    private normalizeExtensionKey;
    private resolveViewTypeForExtensionKey;
    private resolveViewTypeForPath;
    private extensionKeyToFilenamePattern;
    private humanizeViewType;
    private registeredEditorViewForPath;
    getEditorAssociationForPath(path: string): {
        pattern: string;
        editorViewId: string;
        view?: RegisteredEditorViewContribution;
    } | undefined;
    private resolveEditorAssociationViewType;
    registerExtensions(extensions: string[], viewType: string): void;
    unregisterExtensions(extensions: string[], viewType: string): void;
    determineViewType(type: string): string | undefined;
    determineViewTypeForPath(path: string): string | undefined;
    private activateLayoutPlugins;
    viewCreator(type: string | TFile): ViewCreator | undefined;
    setActiveLeaf(leaf: WorkspaceLeaf, params?: {
        /** @public */
        focus?: boolean;
    }): void;
    /**
     * Retrieve a leaf by its id.
     *
     * @param id Id of the leaf to retrieve.
     * @public
     */
    getLeafById(id: string): WorkspaceLeaf | null;
    /**
     * Get the currently active view of a given type.
     *
     * @public
     */
    getActiveViewOfType<T extends View>(type: Constructor<T>): T | null;
    /**
     * Iterate through all leaves in the main area of the workspace.
     *
     * @public
     */
    iterateRootLeaves(callback: (leaf: WorkspaceLeaf) => any): void;
    /**
     * Returns the file for the current view if it's a `FileView`. Otherwise, it
     * will return the most recently active file.
     *
     * @public
     */
    getActiveFile(): TFile | null;
    /**
     * Iterate through all leaves, including main area leaves, floating leaves,
     * and sidebar leaves.
     *
     * @public
     */
    iterateAllLeaves<T = any>(callback: (leaf: WorkspaceLeaf) => T): T | void;
    getOpenLeafEntries(options?: WorkspaceOpenLeafEntryOptions): WorkspaceOpenLeafEntry[];
    /**
     * Remove all leaves of the given type.
     *
     * @public
     */
    detachLeavesOfType(viewType: string): void;
    getLeavesOfType(viewType: string): WorkspaceLeaf[];
    createLeafInParent(parent: WorkspaceSplit, index: number): WorkspaceLeaf;
    createLeafBySplit(leaf: WorkspaceLeaf, direction?: SplitDirection, before?: boolean): WorkspaceLeaf;
    splitActiveLeaf(direction?: SplitDirection): WorkspaceLeaf;
    getUnpinnedLeaf(): WorkspaceLeaf;
    getGroupLeaves(group: string): WorkspaceLeaf[];
    private sideDock;
    private tabsForLeaf;
    private setFocusMode;
    private selectedLeafForWindow;
    getSidebarGroups(side?: SidebarSide): WorkspaceSidebarGroup[];
    getSidebarGroup(side: SidebarSide, group: string): WorkspaceSidebarGroup | null;
    getOrCreateSidebarGroup(side: SidebarSide, group: string, options?: SidebarGroupOptions): WorkspaceSidebarGroup;
    getSidebarGroupLeaves(side: SidebarSide, group: string): WorkspaceLeaf[];
    convertSidebarLeavesToGroup(side: SidebarSide, leaves: WorkspaceLeaf[], options?: SidebarGroupOptions & {
        group?: string;
    }): WorkspaceSidebarGroup;
    convertSidebarGroupToLeaves(group: WorkspaceSidebarGroup): WorkspaceLeaf[];
    getLastOpenFiles(): string[];
    openLinkText(linktext: string, sourcePath: string, newLeaf?: PaneType | boolean, openState?: OpenViewState): Promise<void>;
    ensureSideLeaf(type: string, sideOrOptions?: SidebarSide | EnsureSideLeafOptions, options?: EnsureSideLeafOptions): WorkspaceLeaf;
    handleLinkContextMenu(menu: Menu, linktext: string, sourcePath: string, event?: MouseEvent): void;
    moveLeafToPopout(leaf: WorkspaceLeaf, data?: WorkspaceWindowInitData): WorkspaceWindow;
    moveWorkspaceChildToPopout(item: WorkspaceTabsChild, data?: WorkspaceWindowInitData): WorkspaceWindow;
    openPopoutLeaf(data?: WorkspaceWindowInitData): WorkspaceLeaf;
    moveWorkspaceChildToFloating(item: WorkspaceTabsChild, data?: WorkspaceWindowInitData, options?: {
        source?: WorkspaceLayoutDropSource;
        operation?: string;
    }): WorkspaceWindow;
    supportsPopoutWindows(): boolean;
    private createWorkspaceWindow;
    private moveWorkspaceChildToWindow;
    focusFloatingWindow(window: WorkspaceWindow): void;
    setFloatingWindowDisplayState(window: WorkspaceWindow, displayState: WorkspaceWindowDisplayState, operation?: string): void;
    collapseFloatingWindow(window: WorkspaceWindow): void;
    minimizeFloatingWindow(window: WorkspaceWindow): void;
    maximizeFloatingWindow(window: WorkspaceWindow): void;
    restoreFloatingWindow(window: WorkspaceWindow): void;
    setFloatingWindowBounds(window: WorkspaceWindow, bounds: Partial<Record<"x" | "y" | "width" | "height", number>>): void;
    commitFloatingWindowBounds(window: WorkspaceWindow, bounds: Partial<Record<"x" | "y" | "width" | "height", number>>, operation?: string): void;
    closeFloatingWindow(window: WorkspaceWindow, options?: {
        closeHost?: boolean;
        operation?: string;
    }): void;
    private createSideLeaf;
    private findOrCreateTab;
    /**
     * Create a new leaf inside the right sidebar.
     *
     * @param split Should the existing split be split up?
     * @public
     */
    getRightLeaf(split: boolean): WorkspaceLeaf | null;
    /**
     * Create a new leaf inside the left sidebar.
     *
     * @param split Should the existing split be split up?
     * @public
     */
    getLeftLeaf(split: boolean): WorkspaceLeaf | null;
    getBottomLeaf(): WorkspaceLeaf;
    setBottomPanelOpen(open: boolean): void;
    setBottomPanelSize(size: number): void;
    toggleBottomPanel(): void;
    get bottomPanelAlignment(): WorkspaceBottomPanelAlignment;
    setBottomPanelAlignment(alignment: WorkspaceBottomPanelAlignment): boolean;
    duplicateLeaf(leaf: WorkspaceLeaf, leafType: PaneType | boolean, direction?: SplitDirection): Promise<WorkspaceLeaf>;
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
    getLeaf(newLeaf?: PaneType | boolean, direction?: SplitDirection): WorkspaceLeaf;
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
/**
 * Single navigable pane in the workspace that hosts one {@link View} at a time.
 *
 * @public
 */
export declare class WorkspaceLeaf extends WorkspaceItem<{
    "pinned-change": [pinned: boolean];
    "group-change": [pinned: boolean];
}> {
    private _view;
    hoverPopover: null;
    pinned: boolean;
    group: string | null;
    private ephemeralState;
    contentEl: HTMLElement;
    containerEl: HTMLElement;
    history: HistoryManager<ViewState>;
    parent: WorkspaceTabs | WorkspaceSidebarGroup;
    currentState: ViewState;
    detach(softDelete?: boolean): WorkspaceTabsChild | undefined;
    get state(): ViewState;
    set state(value: ViewState);
    constructor(view?: View);
    updateHistory(state: ViewState): Promise<void>;
    captureCurrentViewState(): ViewState;
    private snapshotHistoryBeforeNavigation;
    private pushHistoryAfterNavigation;
    get view(): View;
    set view(view: View);
    get app(): App;
    open(view: View, result?: ViewStateResult, state?: ViewState): Promise<View>;
    private ensureContentEl;
    openFile(file: TFile, { view, result, state, }?: {
        view?: View;
        result?: ViewStateResult;
        state?: ViewState;
    }): Promise<void>;
    setViewState(viewState: ViewState, eState?: any): Promise<void>;
    getViewState(): ViewState;
    get isDeferred(): boolean;
    loadIfDeferred(): Promise<void>;
    getEphemeralState(): any;
    setEphemeralState(state: any): void;
    togglePinned(): void;
    setPinned(pinned: boolean): void;
    setGroupMember(other: WorkspaceLeaf): void;
    setGroup(group: string): void;
    getIcon(): string;
    getDisplayText(): string;
    getContainer(): WorkspaceContainer;
    onResize(): void;
    close(): void;
    loadJson(layout: WorkspaceLeafJson): Promise<void>;
    reload(): void;
    toJson(): WorkspaceLeafJson;
}
export declare class Notice {
    id: string | number;
    noticeEl: HTMLElement;
    containerEl: HTMLElement;
    messageEl: HTMLElement;
    constructor(message: string, duration?: number);
    setMessage(message: string): void;
    hide(): void;
}
export {};
