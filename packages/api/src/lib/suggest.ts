import { Scope } from "./command.svelte";
import type { App } from "./context.svelte";
import type { Editor, EditorPosition } from "./editor.svelte";
import type { TFile } from "./storage";
import { closeCompletion, startCompletion } from "@codemirror/autocomplete";
import { Modal } from "./settings.svelte";
import { prepareFuzzySearch, renderMatches, type FuzzyMatch } from "./search";

export interface CloseableComponent {
  close(): void;
}

/** @public */
export interface ISuggestOwner<T> {
  /**
   * Render the suggestion item into DOM.
   *
   * @public
   */
  renderSuggestion(value: T, el: HTMLElement): void;
  /**
   * Called when the user makes a selection.
   *
   * @public
   */
  selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void;
}

/**
 * Base class for adding a type-ahead popover.
 *
 * @public
 */
export abstract class PopoverSuggest<T>
  implements ISuggestOwner<T>, CloseableComponent
{
  /** @public */
  constructor(
    readonly app: App,
    readonly scope?: Scope,
  ) {}

  /** @public */
  open(): void {}

  /** @public */
  close(): void {}

  /**
   * @inheritDoc
   * @public
   */
  abstract renderSuggestion(value: T, el: HTMLElement): void;
  /**
   * @inheritDoc
   * @public
   */
  abstract selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void;
}

export abstract class AbstractInputSuggest<T> extends PopoverSuggest<T> {
  limit: number = 100;
  suggestEl: HTMLElement;
  instructionContainerEl: HTMLElement;
  emptyStateEl: HTMLElement;
  private instructions: Instruction[] = [];
  private suggestions: T[] = [];
  private itemElements: HTMLElement[] = [];
  private activeIndex = -1;
  private isOpen = false;
  private selectCallback:
    | ((value: T, evt: MouseEvent | KeyboardEvent) => any)
    | null = null;

  constructor(
    app: App,
    readonly textInputEl: HTMLInputElement | HTMLDivElement,
  ) {
    super(app);
    this.suggestEl = createDomElement("div");
    this.instructionContainerEl = createDomElement("div");
    this.emptyStateEl = createDomElement("div");
    this.suggestEl.className = "suggestion-container";
    this.instructionContainerEl.className = "prompt-instructions";
    this.emptyStateEl.className = "suggestion-empty";
    this.emptyStateEl.textContent = "No results found";
  }

  setValue(value: string): void {
    if (isTextInputElement(this.textInputEl)) {
      this.textInputEl.value = value;
    } else {
      this.textInputEl.textContent = value;
    }
  }

  getValue(): string {
    return isTextInputElement(this.textInputEl)
      ? this.textInputEl.value
      : (this.textInputEl.textContent ?? "");
  }

  protected abstract getSuggestions(query: string): T[] | Promise<T[]>;

  open(): void {
    if (this.isOpen) {
      return;
    }
    this.isOpen = true;
    this.attachSuggestEl();
    this.textInputEl.addEventListener("input", this.onInput);
    this.textInputEl.addEventListener(
      "keydown",
      this.onKeyDown as EventListener,
    );
    this.textInputEl.addEventListener("blur", this.onBlur);
    void this.updateSuggestions();
  }

  close(): void {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.textInputEl.removeEventListener("input", this.onInput);
    this.textInputEl.removeEventListener(
      "keydown",
      this.onKeyDown as EventListener,
    );
    this.textInputEl.removeEventListener("blur", this.onBlur);
    this.suggestions = [];
    this.itemElements = [];
    this.activeIndex = -1;
    this.suggestEl.replaceChildren();
    this.suggestEl.remove?.();
  }

  selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void {
    this.selectCallback?.(value, evt);
    this.close();
  }

  setInstructions(instructions: Instruction[]): this {
    this.instructions = instructions.slice();
    return this;
  }

  onSelect(callback: (value: T, evt: MouseEvent | KeyboardEvent) => any): this {
    this.selectCallback = callback;
    return this;
  }

  private readonly onInput = () => {
    void this.updateSuggestions();
  };

  private readonly onBlur = () => {
    setTimeout(() => this.close(), 0);
  };

  private readonly onKeyDown = (evt: KeyboardEvent) => {
    if (!this.suggestions.length) {
      if (evt.key === "Escape") {
        evt.preventDefault();
        this.close();
      }
      return;
    }

    if (evt.key === "ArrowDown") {
      evt.preventDefault();
      this.setActiveSuggestion(
        (this.activeIndex + 1) % this.suggestions.length,
      );
      return;
    }

    if (evt.key === "ArrowUp") {
      evt.preventDefault();
      this.setActiveSuggestion(
        (this.activeIndex - 1 + this.suggestions.length) %
          this.suggestions.length,
      );
      return;
    }

    if (evt.key === "Enter" || evt.key === "Tab") {
      evt.preventDefault();
      this.selectSuggestion(this.suggestions[this.activeIndex]!, evt);
      return;
    }

    if (evt.key === "Escape") {
      evt.preventDefault();
      this.close();
    }
  };

  private attachSuggestEl(): void {
    const parent =
      this.textInputEl.parentElement ??
      document.body ??
      document.documentElement;

    if (!this.suggestEl.parentElement) {
      parent?.append(this.suggestEl);
    }
  }

  private async updateSuggestions(): Promise<void> {
    const suggestions = await this.getSuggestions(this.getValue());
    const visible =
      this.limit > 0 ? suggestions.slice(0, this.limit) : suggestions;

    this.suggestions = visible;
    this.itemElements = [];
    this.suggestEl.replaceChildren();
    this.renderInstructions();

    if (!visible.length) {
      this.activeIndex = -1;
      this.suggestEl.append(this.emptyStateEl);
      return;
    }

    visible.forEach((suggestion, index) => {
      const itemEl = createDomElement("div");
      itemEl.className = "suggestion-item";
      this.renderSuggestion(suggestion, itemEl);
      itemEl.addEventListener("mousedown", (evt) => {
        evt.preventDefault();
        this.selectSuggestion(suggestion, evt);
      });
      itemEl.addEventListener("mouseenter", () => {
        this.setActiveSuggestion(index);
      });
      this.suggestEl.append(itemEl);
      this.itemElements.push(itemEl);
    });

    this.setActiveSuggestion(0);
  }

  private renderInstructions(): void {
    this.instructionContainerEl.replaceChildren();
    if (!this.instructions.length) {
      return;
    }

    for (const instruction of this.instructions) {
      const row = createDomElement("div");
      row.className = "prompt-instruction";

      const commandEl = createDomElement("span");
      commandEl.className = "prompt-instruction-command";
      commandEl.textContent = instruction.command;

      const purposeEl = createDomElement("span");
      purposeEl.className = "prompt-instruction-purpose";
      purposeEl.textContent = instruction.purpose;

      row.append(commandEl, purposeEl);
      this.instructionContainerEl.append(row);
    }

    this.suggestEl.append(this.instructionContainerEl);
  }

  private setActiveSuggestion(index: number): void {
    this.activeIndex = index;
    this.itemElements.forEach((itemEl, itemIndex) => {
      const active = itemIndex === index;
      itemEl.classList.toggle("is-selected", active);
      itemEl.setAttribute("aria-selected", active ? "true" : "false");
    });
  }
}

function createDomElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
): HTMLElementTagNameMap[K] {
  return document.createElement(tag);
}

function isTextInputElement(
  element: HTMLInputElement | HTMLDivElement,
): element is HTMLInputElement {
  return (
    (typeof HTMLInputElement !== "undefined" &&
      element instanceof HTMLInputElement) ||
    ("value" in element && typeof element.value === "string")
  );
}

export abstract class SuggestModal<T>
  extends Modal
  implements ISuggestOwner<T>
{
  limit: number = 100;
  emptyStateText: string = "No results found";
  inputEl: HTMLInputElement;
  instructionContainerEl: HTMLElement;
  resultContainerEl: HTMLElement;
  private instructions: Instruction[] = [];
  private suggestions: T[] = [];
  private itemElements: HTMLElement[] = [];
  private activeIndex = -1;
  private activeSuggestion: T | null = null;

  constructor(app: App) {
    super(app);
    this.inputEl = createDomElement("input");
    this.instructionContainerEl = createDomElement("div");
    this.resultContainerEl = createDomElement("div");
    this.inputEl.type = "text";
    this.inputEl.className = "prompt-input";
    this.instructionContainerEl.className = "prompt-instructions";
    this.resultContainerEl.className = "suggestion-container";
    this.containerEl?.append(
      this.inputEl,
      this.instructionContainerEl,
      this.resultContainerEl,
    );
    this.inputEl.addEventListener("input", () => {
      void this.updateSuggestions();
    });
    this.inputEl.addEventListener("keydown", (evt) => {
      this.onKeyDown(evt as KeyboardEvent);
    });
  }

  setPlaceholder(placeholder: string): void {
    this.inputEl.placeholder = placeholder;
  }

  setInstructions(instructions: Instruction[]): void {
    this.instructions = instructions.slice();
    this.renderInstructions();
  }

  onNoSuggestion(): void {
    this.suggestions = [];
    this.itemElements = [];
    this.activeIndex = -1;
    this.activeSuggestion = null;
    this.resultContainerEl.textContent = this.emptyStateText;
  }

  async updateSuggestions(): Promise<void> {
    const suggestions = await this.getSuggestions(this.inputEl.value);
    const visible =
      this.limit > 0 ? suggestions.slice(0, this.limit) : suggestions;
    this.suggestions = visible;
    this.resultContainerEl.replaceChildren();
    this.itemElements = [];

    if (!visible.length) {
      this.onNoSuggestion();
      return;
    }

    visible.forEach((suggestion, index) => {
      const itemEl = createDomElement("div");
      itemEl.className = "suggestion-item";
      this.renderSuggestion(suggestion, itemEl);
      itemEl.addEventListener("click", (evt) => {
        this.selectSuggestion(suggestion, evt);
      });
      itemEl.addEventListener("mouseenter", () => {
        this.setActiveSuggestion(index);
      });
      this.resultContainerEl.append(itemEl);
      this.itemElements.push(itemEl);
    });

    this.setActiveSuggestion(0);
  }

  open(): void {
    super.open();
    this.inputEl.focus?.();
    void this.updateSuggestions();
  }

  selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void {
    this.onChooseSuggestion(value, evt);
    this.close();
  }

  selectActiveSuggestion(evt: MouseEvent | KeyboardEvent): void {
    if (this.activeSuggestion) {
      this.selectSuggestion(this.activeSuggestion, evt);
    }
  }

  private renderInstructions(): void {
    this.instructionContainerEl.replaceChildren();
    if (!this.instructions.length) {
      return;
    }

    for (const instruction of this.instructions) {
      const row = createDomElement("div");
      row.className = "prompt-instruction";

      const commandEl = createDomElement("span");
      commandEl.className = "prompt-instruction-command";
      commandEl.textContent = instruction.command;

      const purposeEl = createDomElement("span");
      purposeEl.className = "prompt-instruction-purpose";
      purposeEl.textContent = instruction.purpose;

      row.append(commandEl, purposeEl);
      this.instructionContainerEl.append(row);
    }
  }

  private setActiveSuggestion(index: number): void {
    this.activeIndex = index;
    this.activeSuggestion = this.suggestions[index] ?? null;
    this.itemElements.forEach((itemEl, itemIndex) => {
      const active = itemIndex === index;
      itemEl.classList.toggle("is-selected", active);
      itemEl.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  private onKeyDown(evt: KeyboardEvent): void {
    if (!this.suggestions.length) {
      if (evt.key === "Escape") {
        evt.preventDefault();
        this.close();
      }
      return;
    }

    if (evt.key === "ArrowDown") {
      evt.preventDefault();
      this.setActiveSuggestion(
        (this.activeIndex + 1) % this.suggestions.length,
      );
      return;
    }

    if (evt.key === "ArrowUp") {
      evt.preventDefault();
      this.setActiveSuggestion(
        (this.activeIndex - 1 + this.suggestions.length) %
          this.suggestions.length,
      );
      return;
    }

    if (evt.key === "Enter" || evt.key === "Tab") {
      evt.preventDefault();
      this.selectActiveSuggestion(evt);
      return;
    }

    if (evt.key === "Escape") {
      evt.preventDefault();
      this.close();
    }
  }

  abstract getSuggestions(query: string): T[] | Promise<T[]>;
  abstract renderSuggestion(value: T, el: HTMLElement): void;
  abstract onChooseSuggestion(item: T, evt: MouseEvent | KeyboardEvent): void;
}

export abstract class FuzzySuggestModal<T> extends SuggestModal<FuzzyMatch<T>> {
  getSuggestions(query: string): FuzzyMatch<T>[] {
    const search = prepareFuzzySearch(query);
    return this.getItems()
      .map((item) => {
        const match = search(this.getItemText(item));
        return match ? { item, match } : null;
      })
      .filter((item): item is FuzzyMatch<T> => !!item)
      .sort((a, b) => b.match.score - a.match.score);
  }

  renderSuggestion(item: FuzzyMatch<T>, el: HTMLElement): void {
    renderMatches(el, this.getItemText(item.item), item.match.matches);
  }

  onChooseSuggestion(
    item: FuzzyMatch<T>,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    this.onChooseItem(item.item, evt);
  }

  abstract getItems(): T[];
  abstract getItemText(item: T): string;
  abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;
}

/** @public */
export interface EditorSuggestContext extends EditorSuggestTriggerInfo {
  /** @public */
  editor: Editor;
  /** @public */
  file: TFile;
}

/** @public */
export interface EditorSuggestTriggerInfo {
  /**
   * The start position of the triggering text. This is used to position the
   * popover.
   *
   * @public
   */
  start: EditorPosition;
  /**
   * The end position of the triggering text. This is used to position the
   * popover.
   *
   * @public
   */
  end: EditorPosition;
  /**
   * They query string (usually the text between start and end) that will be
   * used to generate the suggestion content.
   *
   * @public
   */
  query: string;
}

export interface Instruction {
  /** @public */
  command: string;
  /** @public */
  purpose: string;
}

export abstract class EditorSuggest<T> extends PopoverSuggest<T> {
  /**
   * Current suggestion context, containing the result of `onTrigger`. This will
   * be null any time the EditorSuggest is not supposed to run.
   *
   * @public
   */
  context: EditorSuggestContext | null = null;

  scope: Scope = new Scope();
  suggestEl: HTMLElement = createDiv();

  /**
   * Override this to use a different limit for suggestion items
   *
   * @public
   */
  limit: number = -1;
  /** @public */
  constructor(app: App) {
    super(app);
  }

  /** @public */
  setInstructions(instructions: Instruction[]): void {}

  close(): void {
    if (!this.context) return;
    closeCompletion(this.context.editor.cm);
  }

  open(): void {
    if (!this.context) return;
    startCompletion(this.context.editor.cm);
  }

  /**
   * Based on the editor line and cursor position, determine if this
   * EditorSuggest should be triggered at this moment. Typically, you would run
   * a regular expression on the current line text before the cursor. Return
   * null to indicate that this editor suggest is not supposed to be triggered.
   *
   * Please be mindful of performance when implementing this function, as it
   * will be triggered very often (on each keypress). Keep it simple, and return
   * null as early as possible if you determine that it is not the right time.
   *
   * @public
   */
  abstract onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile | null,
  ): EditorSuggestTriggerInfo | null;
  /**
   * Generate suggestion items based on this context. Can be async, but
   * preferably sync. When generating async suggestions, you should pass the
   * context along.
   *
   * @public
   */
  abstract getSuggestions(context: EditorSuggestContext): T[] | Promise<T[]>;
}
