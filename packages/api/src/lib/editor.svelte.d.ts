import { EditorState, type Text, type Extension, StateField, EditorSelection as CodeMirrorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { TFile } from "./storage/fs";
import { EventDispatcher } from "./events";
import type { App } from "./context.svelte";
export type EditorPosition = {
    line: number;
    ch: number;
};
export interface EditorRange {
    from: EditorPosition;
    to: EditorPosition;
}
export interface EditorRangeOrCaret {
    from: EditorPosition;
    to?: EditorPosition;
}
export interface EditorChange extends EditorRangeOrCaret {
    text: string;
}
export type EditorCommandName = "goUp" | "goDown" | "goLeft" | "goRight" | "goStart" | "goEnd" | "goWordLeft" | "goWordRight" | "indentMore" | "indentLess" | "newlineAndIndent" | "swapLineUp" | "swapLineDown" | "deleteLine" | "toggleFold" | "foldAll" | "unfoldAll";
export interface EditorScrollInfo {
    left: number;
    top: number;
    width: number;
    height: number;
    clientWidth: number;
    clientHeight: number;
}
export interface EditorSelection {
    anchor: EditorPosition;
    head: EditorPosition;
}
export interface EditorSelectionOrCaret {
    anchor: EditorPosition;
    head?: EditorPosition;
}
export interface EditorTransaction {
    replaceSelection?: string;
    changes?: EditorChange[];
    selections?: EditorRangeOrCaret[];
    selection?: EditorRangeOrCaret;
}
/** Controls whether an editor persists its own debounced document changes. */
export type EditorPersistence = "vault" | "external";
export interface MarkdownFileInfo {
    /** @public */
    app: App;
    /** @public */
    get file(): TFile | null;
    /** @public */
    editor?: Editor;
}
export declare const editorViewField: StateField<MarkdownFileInfo>;
export declare const editorInfoField: StateField<MarkdownFileInfo>;
export declare const editorEditorField: StateField<EditorView | null>;
export declare const editorLivePreviewField: StateField<boolean>;
export declare function fromPosition(doc: Text, pos: EditorPosition): number;
export declare function toPosition(doc: Text, pos: number): EditorPosition;
export declare function createEditorState(editor: Editor, doc: string, extensions?: Extension[], selection?: CodeMirrorSelection): EditorState;
export declare function createEditor(editor: Editor, doc: string, ...extensions: Extension[]): EditorView;
export declare class Editor extends EventDispatcher<{
    change: [data: string];
}> {
    data: string;
    extensions: Extension[];
    view: EditorView;
    file: TFile | null;
    persistence: EditorPersistence;
    readonly id: `${string}-${string}-${string}-${string}-${string}`;
    private destroyed;
    private readonly pendingChange;
    constructor(data?: string, extensions?: Extension[]);
    readonly save: import("lodash-es").DebouncedFunc<() => Promise<void>>;
    get cm(): EditorView;
    onChange(data: string): void;
    /** Queue the latest editor contents for persistence/change notification. */
    queueChange(data: string): void;
    /** Flush the latest queued change before a view or embedded surface closes. */
    flushChanges(): Promise<void>;
    /** Cancel a queued change when the owning document is intentionally reset. */
    cancelPendingChanges(): void;
    getValue(): string;
    refresh(): void;
    destroy(): void;
    trackChanges(callback?: (data: string, editor: Editor) => void): () => void;
    updateExtensions(extensions: Extension[], context?: Record<string, any>): this;
    setValue(content: string): void;
    replaceContent(content: string, options?: {
        userEvent?: string;
    }): void;
    getLine(line: number): string;
    somethingSelected(): boolean;
    getRange(from: EditorPosition, to: EditorPosition): string;
    replaceSelection(replacement: string, origin?: string): void;
    getCursor(side?: "from" | "to" | "head" | "anchor"): EditorPosition;
    listSelections(): EditorSelection[];
    setCursor(pos: EditorPosition | number, ch?: number): void;
    setSelection(anchor: EditorPosition, head?: EditorPosition): void;
    setSelections(ranges: EditorSelectionOrCaret[], main?: number): void;
    replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition, origin?: string): void;
    focus(): void;
    blur(): void;
    hasFocus(): boolean;
    getScrollInfo(): EditorScrollInfo;
    scrollTo(x?: number | null, y?: number | null): void;
    scrollIntoView(range: EditorRange, center?: boolean): void;
    undo(): void;
    redo(): void;
    exec(command: EditorCommandName): void;
    transaction(tx: EditorTransaction, origin?: string): void;
    wordAt(pos: EditorPosition): EditorRange | null;
    posToOffset(pos: EditorPosition): number;
    offsetToPos(offset: number): EditorPosition;
    processLines<T>(read: (line: number, lineText: string) => T | null, write: (line: number, lineText: string, value: T | null) => EditorChange | void, ignoreEmpty?: boolean): void;
    lastLine(): number;
    setLine(n: number, text: string): void;
    lineCount(): number;
    getSelection(): string;
    getDoc(): this;
}
