/* eslint-disable @typescript-eslint/no-unused-vars */

import { DateTime } from "luxon";
import type { DataAdapter, TFile } from "./storage/fs";
import type { WorkspaceLeaf } from "./workspace.svelte";
import type { Menu } from "./menu.svelte";
import { Editor } from "./editor.svelte";
import type { App } from "./context.svelte";
import { mount, unmount } from "svelte";
import EmptyViewComponent from "$lib/components/empty-view/empty-view.svelte";
import "./enhance";
import {
  EventDispatcher,
  type EventNames,
  type EventRef,
  type ValidEventTypes,
} from "./events";
import type { Scope } from "./command.svelte";
import { t } from "./localization-manager.svelte";

/**
 * Base lifecycle helper used throughout the public API.
 *
 * Components can own child components and cleanup callbacks so complex views
 * and plugins can tear themselves down predictably.
 *
 * @public
 */
export abstract class Component<
  Events extends ValidEventTypes = Record<string, any>,
> extends EventDispatcher<Events> {
  children: Component[] = [];
  private unloaders: Set<() => void> = new Set();
  loaded: boolean = false;

  protected _containerEl: HTMLElement = $state(createDiv());

  get containerEl(): HTMLElement {
    return this._containerEl;
  }

  set containerEl(el: HTMLElement) {
    this._containerEl = el;
  }

  /**
   * Load this component and its children
   *
   * @public
   */
  load(): void {
    if (this.loaded) {
      return;
    }
    this.onload();
    this.children.forEach((it) => it.load());
    this.loaded = true;
  }
  /**
   * Override this to load your component
   *
   * @abstract
   * @public
   */
  onload(): Promise<void> | void {}

  protected async loadAsync(): Promise<void> {
    if (this.loaded) {
      return;
    }
    try {
      await this.onload();
      for (const child of [...this.children]) {
        await child.loadAsync();
      }
      this.loaded = true;
    } catch (error) {
      try {
        await this.cleanupAsync(false);
      } catch (cleanupError) {
        console.error("Failed to rollback component load", cleanupError);
      }
      throw error;
    }
  }

  /**
   * Unload this component and its children
   *
   * @public
   */
  unload(): void {
    if (!this.loaded) {
      return;
    }
    this.children.forEach((child) => child.unload());
    this.unloaders.forEach((cb) => cb());
    this.unloaders.clear();
    this.children = [];
    this.onunload();
    this.loaded = false;
  }

  protected async unloadAsync(): Promise<void> {
    if (
      !this.loaded &&
      this.children.length === 0 &&
      this.unloaders.size === 0
    ) {
      return;
    }
    await this.cleanupAsync(this.loaded);
    this.loaded = false;
  }

  /**
   * Override this to unload your component
   *
   * @abstract
   * @public
   */
  onunload(): void {}

  private async cleanupAsync(callOnUnload: boolean): Promise<void> {
    let firstError: unknown = null;

    for (const child of [...this.children].reverse()) {
      try {
        await child.unloadAsync();
      } catch (error) {
        firstError ??= error;
      }
    }
    this.children = [];

    for (const cb of [...this.unloaders]) {
      try {
        cb();
      } catch (error) {
        firstError ??= error;
      }
    }
    this.unloaders.clear();

    if (callOnUnload) {
      try {
        await this.onunload();
      } catch (error) {
        firstError ??= error;
      }
    }

    if (firstError) {
      throw firstError;
    }
  }
  /**
   * Adds a child component, loading it if this component is loaded
   *
   * @public
   */
  addChild<T extends Component>(component: T): T {
    if (this.children.indexOf(component) === -1) {
      this.children.push(component);
      if (this.loaded) {
        component.load();
      }
    }
    return component;
  }
  /**
   * Removes a child component, unloading it
   *
   * @public
   */
  removeChild<T extends Component>(component: T): T {
    const index = this.children.indexOf(component);
    if (index > -1) {
      this.children.splice(index, 1);
    }
    return component;
  }

  /**
   * Registers a callback to be called when unloading
   *
   * @public
   */
  register(cb: () => any): void {
    this.unloaders.add(cb);
  }

  registerEvent<T extends ValidEventTypes, K extends EventNames<T>>(
    eventRef: EventRef<T, K, any>,
  ): void {
    this.register(() => eventRef.dispatcher.offref(eventRef));
  }

  registerInterval(id: ReturnType<typeof setInterval>): void {
    this.register(() => clearInterval(id));
  }

  /**
   * Registers an DOM event to be detached when unloading
   *
   * @public
   */
  registerDomEvent<K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  registerDomEvent<K extends keyof DocumentEventMap>(
    el: Document,
    type: K,
    callback: (this: HTMLElement, ev: DocumentEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  registerDomEvent<K extends keyof WindowEventMap>(
    el: Window,
    type: K,
    callback: (this: HTMLElement, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  registerDomEvent<
    K extends keyof (WindowEventMap | DocumentEventMap | HTMLElementEventMap),
  >(
    el: Window | HTMLElement | Document,
    type: K,
    callback: (this: HTMLElement, ev: any) => any,
    options?: boolean | AddEventListenerOptions,
  ): void {
    el.addEventListener(type, callback, options);
    this.register(() => el.removeEventListener(type, callback, options));
  }
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
 * Base class for anything that can be mounted inside a workspace leaf.
 *
 * @public
 */
export abstract class View extends Component {
  icon: string = "";
  leaf!: WorkspaceLeaf;
  scope: Scope | null = null;
  protected state: Record<string, unknown> = $state({});

  constructor(leaf?: WorkspaceLeaf) {
    super();
    if (leaf) {
      this.leaf = leaf;
      leaf.view = this;
    }
  }

  get containerEl(): HTMLElement {
    return this.leaf.containerEl;
  }

  get app(): App {
    return this.leaf.app;
  }

  /** @public */
  protected abstract onOpen(): Promise<void>;
  /** @public */
  protected abstract onClose(): Promise<void>;
  /** @public */
  abstract getViewType(): string;

  getState(): Record<string, unknown> {
    return { ...this.state };
  }

  setState(
    state: Record<string, unknown>,
    result?: ViewStateResult,
  ): Promise<void> {
    this.state = { ...state };
    return Promise.resolve();
  }

  getIcon() {
    return this.icon;
  }

  abstract getDisplayText(): string;

  onPaneMenu(
    menu: Menu,
    source: "more-options" | "tab-header" | string,
  ): void {}
}

export class EmptyView extends View {
  private component: any;

  constructor(leaf?: WorkspaceLeaf) {
    super(leaf);
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  load(): void {
    if (this.containerEl) {
      this.containerEl.innerHTML = "";
      this.component = mount(EmptyViewComponent, {
        target: this.containerEl,
        props: {
          app: this.app,
          onClose: () => this.leaf.close(),
        },
      });
    }
  }

  unload(): void {
    if (this.component) {
      unmount(this.component);
      this.component = null;
    }
  }

  getViewType(): string {
    return "empty";
  }

  getDisplayText(): string {
    const missingViewType = this.state["__missingViewType"];
    if (typeof missingViewType === "string" && missingViewType.length > 0) {
      return missingViewType;
    }
    return t("base/empty-view", "New Tab");
  }

  getIcon(): string {
    return "file";
  }
}

/**
 * View base class with an action bar and content area.
 *
 * @public
 */
export abstract class ItemView extends View {
  actions: Array<{
    icon: string;
    title: string;
    callback: (evt: MouseEvent) => any;
    disabled?: boolean;
  }> = $state([]);

  constructor(leaf?: WorkspaceLeaf) {
    super(leaf);
  }

  get contentEl(): HTMLElement {
    return this.leaf.contentEl;
  }

  unload(): void {
    super.unload();
  }

  addAction(
    icon: string,
    title: string,
    callback: (evt: MouseEvent) => any,
    options?: { disabled?: boolean },
  ) {
    this.actions.push({ icon, title, callback, disabled: options?.disabled });
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }
}

/**
 * Item view base class that is backed by a vault file.
 *
 * @public
 */
export abstract class FileView extends ItemView {
  file: TFile | null = $state()!;

  constructor(leaf?: WorkspaceLeaf) {
    super(leaf);
  }

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
export abstract class TextFileView extends FileView {
  editor: Editor;
  data: string = $state("");

  constructor(leaf?: WorkspaceLeaf) {
    super(leaf);
    this.editor = new Editor(this.data, [], leaf?.application);
  }

  get adapter(): DataAdapter {
    return this.app.vault.adapter;
  }

  abstract getViewData(): string;
  abstract setViewData(data: string, clear?: boolean): void;
  abstract clear(): void;

  async onLoadFile(file: TFile): Promise<void> {
    return this.app.telemetry.measureAsync(
      "view.text_file.on_load_file",
      async (span) => {
        span.setAttribute("view.type", this.getViewType());
        span.setAttribute("file.extension", file.extension);
        const contents = await this.app.telemetry.measureAsync(
          "vault.read",
          async () => this.app.vault.read(file),
          {
            attributes: {
              "file.extension": file.extension,
              "view.type": this.getViewType(),
            },
            slowThresholdMs: 100,
          },
        );
        this.file = file.copy();
        this.editor.file = file;
        await this.setState({ ...this.getState(), file: file.path });
        this.editor.extensions = this.app.editorExtensions(
          this.file.extension,
          this.getState(),
        );
        this.data = contents;
        this.setViewData(contents, true);
      },
      {
        attributes: {
          "view.type": this.getViewType(),
          "file.extension": file.extension,
        },
        slowThresholdMs: 150,
      },
    );
  }

  getIcon(): string {
    return "file";
  }

  onRename(file: TFile): Promise<void> {
    this.file = file.copy();
    this.editor.file = file;
    this.setState({ ...this.getState(), file: file.path });
    return Promise.resolve();
  }

  onUnloadFile(file: TFile): Promise<void> {
    this.setState({ ...this.getState(), file: "" });
    return Promise.resolve();
  }

  save(clear?: boolean): Promise<void> {
    return this.app.vault
      .modify(this.file!, this.data, {
        mtime: DateTime.now().toMillis(),
      })
      .then(() => {
        if (clear) {
          this.clear();
        }
      });
  }
}
