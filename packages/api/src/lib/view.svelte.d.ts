import type { DataAdapter, TFile } from "./storage/fs";
import type { WorkspaceLeaf } from "./workspace.svelte";
import type { Menu } from "./menu.svelte";
import { Editor } from "./editor.svelte";
import type { App } from "./context.svelte";
import "./enhance";
import { EventDispatcher, type EventNames, type EventRef, type ValidEventTypes } from "./events";
import type { Scope } from "./command.svelte";
/**
 * Base lifecycle helper used throughout the public API.
 *
 * Components can own child components and cleanup callbacks so complex views
 * and plugins can tear themselves down predictably.
 *
 * @public
 */
export declare abstract class Component<Events extends ValidEventTypes = Record<string, any>> extends EventDispatcher<Events> {
    children: Component[];
    private unloaders;
    loaded: boolean;
    protected _containerEl: HTMLElement;
    get containerEl(): HTMLElement;
    set containerEl(el: HTMLElement);
    /**
     * Load this component and its children
     *
     * @public
     */
    load(): void;
    /**
     * Override this to load your component
     *
     * @abstract
     * @public
     */
    onload(): Promise<void> | void;
    protected loadAsync(): Promise<void>;
    /**
     * Unload this component and its children
     *
     * @public
     */
    unload(): void;
    protected unloadAsync(): Promise<void>;
    /**
     * Override this to unload your component
     *
     * @abstract
     * @public
     */
    onunload(): void;
    private cleanupAsync;
    /**
     * Adds a child component, loading it if this component is loaded
     *
     * @public
     */
    addChild<T extends Component>(component: T): T;
    /**
     * Removes a child component, unloading it
     *
     * @public
     */
    removeChild<T extends Component>(component: T): T;
    /**
     * Registers a callback to be called when unloading
     *
     * @public
     */
    register(cb: () => any): void;
    registerEvent<T extends ValidEventTypes, K extends EventNames<T>>(eventRef: EventRef<T, K, any>): void;
    registerInterval(id: ReturnType<typeof setInterval>): void;
    /**
     * Registers an DOM event to be detached when unloading
     *
     * @public
     */
    registerDomEvent<K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    registerDomEvent<K extends keyof DocumentEventMap>(el: Document, type: K, callback: (this: HTMLElement, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    registerDomEvent<K extends keyof WindowEventMap>(el: Window, type: K, callback: (this: HTMLElement, ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
}
/**
 * Additional metadata returned from view-state transitions.
 *
 * @public
 */
export interface ViewStateResult {
    /**
     * Set this to true to indicate that there is a state change which should be
     * recorded in the navigation history.
     *
     * @public
     */
    history: boolean;
}
/**
 * Serialized workspace state for a single leaf.
 *
 * @public
 */
export interface ViewState {
    /** @public */
    type: string;
    /** @public */
    state?: Record<string, unknown>;
    /** @public */
    active?: boolean;
    /** @public */
    pinned?: boolean;
    /** @public */
    group?: WorkspaceLeaf;
}
/**
 * Header breadcrumb contributed by a view. Keep the leaf filename in the
 * header title rather than this list.
 *
 * @public
 */
export interface ViewBreadcrumb {
    id: string;
    label: string;
    onSelect?: () => void;
}
/**
 * Base class for anything that can be mounted inside a workspace leaf.
 *
 * @public
 */
export declare abstract class View extends Component {
    icon: string;
    leaf: WorkspaceLeaf;
    scope: Scope | null;
    protected state: Record<string, unknown>;
    constructor(leaf?: WorkspaceLeaf);
    get containerEl(): HTMLElement;
    get app(): App;
    /** @public */
    protected abstract onOpen(): Promise<void>;
    /** @public */
    protected abstract onClose(): Promise<void>;
    /** @public */
    abstract getViewType(): string;
    getState(): Record<string, unknown>;
    setState(state: Record<string, unknown>, result?: ViewStateResult): Promise<void>;
    getIcon(): string;
    abstract getDisplayText(): string;
    getBreadcrumbFilePath(): string | null;
    getBreadcrumbs(): ViewBreadcrumb[];
    onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string): void;
}
export declare class EmptyView extends View {
    private component;
    constructor(leaf?: WorkspaceLeaf);
    protected onOpen(): Promise<void>;
    protected onClose(): Promise<void>;
    load(): void;
    unload(): void;
    getViewType(): string;
    getDisplayText(): string;
    getIcon(): string;
}
/**
 * View base class with an action bar and content area.
 *
 * @public
 */
export declare abstract class ItemView extends View {
    actions: Array<{
        icon: string;
        title: string;
        callback: (evt: MouseEvent) => any;
        disabled?: boolean;
    }>;
    constructor(leaf?: WorkspaceLeaf);
    get contentEl(): HTMLElement;
    unload(): void;
    addAction(icon: string, title: string, callback: (evt: MouseEvent) => any, options?: {
        disabled?: boolean;
    }): void;
    protected onOpen(): Promise<void>;
    protected onClose(): Promise<void>;
}
/**
 * Item view base class that is backed by a vault file.
 *
 * @public
 */
export declare abstract class FileView extends ItemView {
    file: TFile | null;
    constructor(leaf?: WorkspaceLeaf);
    getBreadcrumbFilePath(): string | null;
    abstract onLoadFile(file: TFile): Promise<void>;
    abstract onUnloadFile(file: TFile): Promise<void>;
    abstract onRename(file: TFile): Promise<void>;
    abstract canAcceptExtension(extension: string): boolean;
}
/**
 * File view base class for text-backed editors.
 *
 * @public
 */
export declare abstract class TextFileView extends FileView {
    editor: Editor;
    data: string;
    constructor(leaf?: WorkspaceLeaf);
    get adapter(): DataAdapter;
    abstract getViewData(): string;
    abstract setViewData(data: string, clear?: boolean): void;
    abstract clear(): void;
    onLoadFile(file: TFile): Promise<void>;
    getIcon(): string;
    onRename(file: TFile): Promise<void>;
    onUnloadFile(file: TFile): Promise<void>;
    save(clear?: boolean): Promise<void>;
}
