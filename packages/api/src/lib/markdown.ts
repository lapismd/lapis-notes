import type { App } from "./context.svelte";
import { resolveApplication } from "./application-compatibility";
import type { Editor, MarkdownFileInfo } from "./editor.svelte";
import { Component, FileView, TextFileView } from "./view.svelte";
import type { Menu } from "./menu.svelte";
import type { TFile } from "./storage/fs";
import type { WorkspaceLeaf } from "./workspace.svelte";
import { HoverPopover, type HoverParent } from "./popover";
import type { Component as SvelteComponent } from "svelte";
import type {
  MarkdownContributionMode,
  MarkdownSurfaceContext,
} from "./markdown-extension-registry";

function createFallbackElement(): HTMLElement {
  if (typeof document !== "undefined") {
    return document.createElement("div");
  }
  return {} as HTMLElement;
}

export class MarkdownRenderChild extends Component {
  /**
   * @param containerEl - This HTMLElement will be used to test whether this
   *   component is still alive. It should be a child of the Markdown preview
   *   sections, and when it's no longer attached (for example, when it is
   *   replaced with a new version because the user edited the Markdown source
   *   code), this component will be unloaded.
   * @public
   */
  constructor(containerEl: HTMLElement) {
    super();
    this.containerEl = containerEl;
  }
}

export interface MarkdownSectionInformation {
  /** @public */
  text: string;
  /** @public */
  lineStart: number;
  /** @public */
  lineEnd: number;
}

/**
 * A post processor receives an element which is a section of the preview.
 *
 * Post processors can mutate the DOM to render various things, such as mermaid
 * graphs, latex equations, or custom controls.
 *
 * If your post processor requires lifecycle management, for example, to clear
 * an interval, kill a subprocess, etc when this element is removed from the
 * app, look into {@link MarkdownPostProcessorContext.addChild}
 *
 * @public
 */
export interface MarkdownPostProcessor {
  /**
   * The processor function itself.
   *
   * @public
   */
  (el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<any> | void;
  /**
   * An optional integer sort order. Defaults to 0. Lower number runs before
   * higher numbers.
   *
   * @public
   */
  sortOrder?: number;
}

export interface MarkdownPostProcessorContext {
  /** @public */
  docId: string;
  /**
   * The path to the associated file. Any links are assumed to be relative to
   * the `sourcePath`.
   *
   * @public
   */
  sourcePath: string;
  /** @public */
  frontmatter: any | null | undefined;
  /** Rendering mode for this processor invocation. @public */
  mode?: MarkdownContributionMode;
  /** Owning Markdown surface and optional consumer context. @public */
  surface?: MarkdownSurfaceContext;

  /**
   * Adds a child component that will have its lifecycle managed by the
   * renderer.
   *
   * Use this to add a dependent child to the renderer such that if the
   * containerEl of the child is ever removed, the component's unload will be
   * called.
   *
   * @public
   */
  addChild(child: MarkdownRenderChild): void;
  /**
   * Gets the section information of this element at this point in time. Only
   * call this function right before you need this information to get the most
   * up-to-date version. This function may also return null in many
   * circumstances; if you use it, you must be prepared to deal with nulls.
   *
   * @public
   */
  getSectionInfo(el: HTMLElement): MarkdownSectionInformation | null;
}

export interface MarkdownViewMenuContext {
  menu: Menu;
  source: "more-options" | "tab-header" | string;
  leaf: WorkspaceLeaf;
  file: TFile;
}

export type MarkdownDirectiveRenderer = SvelteComponent<any, any, any>;

export type MarkdownViewMenuItemProvider = (
  context: MarkdownViewMenuContext,
) => void;

export interface MarkdownSubView {
  getScroll(): number;
  applyScroll(scroll: number): void;
  get(): string;
  set(data: string, clear: boolean): void;
}

export interface MarkdownPreviewEvents extends Component {}

export type MarkdownViewModeType = "source" | "preview" | "live-preview";

/**
 * A file-backed view that Markdown editing can return to without owning that
 * view's rendering policy.
 *
 * @public
 */
export interface MarkdownViewReturnTarget {
  /** Registered workspace view type to restore. @public */
  type: string;
  /** Human-readable destination used by the Markdown title action. @public */
  label: string;
  /** Optional icon for the return action. Defaults to `book-open`. @public */
  icon?: string;
  /** State supplied to the restored view. The current file is preserved. @public */
  state?: Record<string, unknown>;
}

/**
 * Public serialized state accepted by the bundled Markdown view.
 *
 * @public
 */
export interface MarkdownViewState {
  file?: string | null;
  mode?: MarkdownViewModeType;
  returnTarget?: MarkdownViewReturnTarget;
}

export interface LivePreviewStateType {
  editor: Editor;
}

export const livePreviewState: any = null;

export abstract class EditableFileView extends FileView {}

export abstract class MarkdownView extends TextFileView {
  hoverPopover: HoverPopover | null = null;
  previewMode!: MarkdownPreviewView;
  currentMode!: MarkdownSubView;

  constructor(leaf?: WorkspaceLeaf) {
    super(leaf);
  }
}

export class MarkdownPreviewRenderer {
  static registerPostProcessor(
    postProcessor: MarkdownPostProcessor,
    sortOrder?: number,
  ): void {
    postProcessor.sortOrder = sortOrder ?? postProcessor.sortOrder ?? 0;
    resolveApplication().registerMarkdownPostProcessor(postProcessor);
  }

  static unregisterPostProcessor(postProcessor: MarkdownPostProcessor): void {
    resolveApplication().unregisterMarkdownPostProcessor(postProcessor);
  }

  static createCodeBlockPostProcessor(
    language: string,
    handler: (
      source: string,
      el: HTMLElement,
      ctx: MarkdownPostProcessorContext,
    ) => Promise<any> | void,
  ): (el: HTMLElement, ctx: MarkdownPostProcessorContext) => void {
    return (el, ctx) => {
      const source = ctx.getSectionInfo(el)?.text ?? "";
      handler(source.replace(/^([`]{3}[^\n]*\n+)|\n+[`]{3}\n*$/g, ""), el, ctx);
    };
  }
}

export abstract class MarkdownRenderer
  extends MarkdownRenderChild
  implements MarkdownPreviewEvents, HoverParent
{
  app: App;
  hoverPopover: HoverPopover | null = null;

  constructor(
    containerEl: HTMLElement = createFallbackElement(),
    application?: App,
  ) {
    super(containerEl);
    this.app = resolveApplication(application);
  }

  abstract get file(): TFile | null;

  /**
   * Renders Markdown string to an HTML element.
   *
   * @deprecated - Use {@link MarkdownRenderer.render}
   * @public
   */
  static renderMarkdown(
    markdown: string,
    el: HTMLElement,
    sourcePath: string,
    component: Component,
  ): Promise<void> {
    return MarkdownRenderer.render(app, markdown, el, sourcePath, component);
  }

  /**
   * Renders Markdown string to an HTML element.
   *
   * @param app - A reference to the app object
   * @param markdown - The Markdown source code
   * @param el - The element to append to
   * @param sourcePath - The normalized path of this Markdown file, used to
   *   resolve relative internal links
   * @param component - A parent component to manage the lifecycle of the
   *   rendered child components.
   * @public
   */
  static async render(
    app: App,
    markdown: string,
    el: HTMLElement,
    sourcePath: string,
    component: Component,
  ): Promise<void> {
    await app.props.markdownRenderer(markdown, el, sourcePath, component);
  }
}

export class MarkdownPreviewView
  extends MarkdownRenderer
  implements MarkdownSubView, MarkdownPreviewEvents
{
  private data = "";
  private scroll = 0;

  constructor(readonly view?: MarkdownView) {
    super(view?.containerEl ?? createFallbackElement(), view?.app);
  }

  get file(): TFile | null {
    return this.view?.file ?? null;
  }

  get(): string {
    return this.data;
  }

  set(data: string, clear: boolean): void {
    if (clear) this.clear();
    this.data = data;
  }

  clear(): void {
    this.containerEl?.replaceChildren?.();
  }

  rerender(full?: boolean): void {}

  getScroll(): number {
    return this.containerEl?.scrollTop ?? this.scroll;
  }

  applyScroll(scroll: number): void {
    this.scroll = scroll;
    if (this.containerEl) {
      this.containerEl.scrollTop = scroll;
    }
  }
}

export class MarkdownEditView
  implements MarkdownSubView, HoverParent, MarkdownFileInfo
{
  app: App;
  hoverPopover: HoverPopover | null = null;

  constructor(readonly view: MarkdownView) {
    this.app = view.app;
  }

  clear(): void {
    this.view.clear();
  }

  get(): string {
    return this.view.getViewData();
  }

  set(data: string, clear: boolean): void {
    this.view.setViewData(data, clear);
  }

  get file(): TFile | null {
    return this.view.file;
  }

  get editor(): Editor {
    return this.view.editor;
  }

  getSelection(): string {
    return this.view.editor.getSelection();
  }

  getScroll(): number {
    return this.view.editor.getScrollInfo().top;
  }

  applyScroll(scroll: number): void {
    this.view.editor.scrollTo(null, scroll);
  }
}
