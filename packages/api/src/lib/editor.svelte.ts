import {
  Annotation,
  EditorState,
  type Text,
  Transaction,
  type TransactionSpec,
  type Extension,
  StateField,
  EditorSelection as CodeMirrorSelection,
} from "@codemirror/state";
import { EditorView, type ViewUpdate } from "@codemirror/view";
import { redo as redoCommand, undo as undoCommand } from "@codemirror/commands";
import type { TFile } from "./storage/fs";
import { EventDispatcher } from "./events";
import type { App } from "./context.svelte";
import debounce from "lodash-es/debounce";

export type EditorPosition = { line: number; ch: number };
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
export type EditorCommandName =
  | "goUp"
  | "goDown"
  | "goLeft"
  | "goRight"
  | "goStart"
  | "goEnd"
  | "goWordLeft"
  | "goWordRight"
  | "indentMore"
  | "indentLess"
  | "newlineAndIndent"
  | "swapLineUp"
  | "swapLineDown"
  | "deleteLine"
  | "toggleFold"
  | "foldAll"
  | "unfoldAll";
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

export const editorViewField: StateField<MarkdownFileInfo> =
  StateField.define<MarkdownFileInfo>({
    create() {
      return { app: app, file: null };
    },
    update(state) {
      return state;
    },
  });

export const editorInfoField = editorViewField;

export const editorEditorField = StateField.define<EditorView | null>({
  create() {
    return null;
  },
  update(value) {
    return value;
  },
});

export const editorLivePreviewField = StateField.define<boolean>({
  create() {
    return false;
  },
  update(value) {
    return value;
  },
});

export function fromPosition(doc: Text, pos: EditorPosition): number {
  return doc.line(pos.line + 1).from + pos.ch;
}

export function toPosition(doc: Text, pos: number): EditorPosition {
  const line = doc.lineAt(pos);
  return {
    line: line.number - 1,
    ch: pos - line.from,
  };
}
const syncAnnotation = Annotation.define<boolean>();

export function createEditorState(
  editor: Editor,
  doc: string,
  extensions: Extension[] = [],
  selection?: CodeMirrorSelection,
) {
  return EditorState.create({
    doc,
    selection,
    extensions: [
      editorViewField.init(() => ({
        app: app,
        editor,
        get file() {
          return editor.file;
        },
      })),
      EditorView.updateListener.of((v: ViewUpdate) => {
        if (
          v.docChanged &&
          !v.transactions.some((it) => it.annotation(syncAnnotation))
        ) {
          editor.queueChange(v.state.doc.toString());
        }
      }),
      ...extensions,
    ],
  });
}

export function createEditor(
  editor: Editor,
  doc: string,
  ...extensions: Extension[]
) {
  return new EditorView({
    doc,
    dispatchTransactions: (trs, view) => {
      view.update(trs);
      const specs: TransactionSpec[] = [];
      let selectionChanged = false;
      for (let tr of trs) {
        selectionChanged ||= tr.selection !== undefined;
        if (!tr.changes.empty && !tr.annotation(syncAnnotation)) {
          let annotations: Annotation<any>[] = [syncAnnotation.of(true)];
          let userEvent = tr.annotation(Transaction.userEvent);
          if (userEvent) annotations.push(Transaction.userEvent.of(userEvent));
          specs.push({ changes: tr.changes, annotations });
        }
      }
      if (specs.length || selectionChanged) {
        app.workspace.dispatch("editor-updated", editor, specs);
      }
    },
    state: createEditorState(editor, doc, extensions),
  });
}

export class Editor extends EventDispatcher<{
  change: [data: string];
}> {
  view: EditorView;
  file: TFile | null = $state(null);
  persistence: EditorPersistence = "vault";
  readonly id = crypto.randomUUID();
  private destroyed = false;
  private readonly pendingChange = debounce(async (content: string) => {
    if (this.data === content) {
      return;
    }
    if (this.file && this.persistence === "vault") {
      await app.vault.modify(this.file, content);
    }
    this.data = content;
    this.onChange(content);
  }, 500);

  constructor(
    public data: string = "",
    public extensions: Extension[] = [],
  ) {
    super();
    this.view = createEditor(this, data, extensions);
  }

  readonly save = debounce(() => {
    if (this.file) {
      return app.vault.modify(this.file, this.getValue());
    }
    return Promise.resolve();
  }, 500);

  get cm() {
    return this.view;
  }

  onChange(data: string) {
    this.trigger("change", data);
  }

  /** Queue the latest editor contents for persistence/change notification. */
  queueChange(data: string): void {
    this.pendingChange(data);
  }

  /** Flush the latest queued change before a view or embedded surface closes. */
  flushChanges(): Promise<void> {
    return Promise.resolve(this.pendingChange.flush()).then(() => undefined);
  }

  /** Cancel a queued change when the owning document is intentionally reset. */
  cancelPendingChanges(): void {
    this.pendingChange.cancel();
  }

  getValue() {
    return this.view.state.doc.toString();
  }

  refresh(): void {
    this.view.requestMeasure();
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.pendingChange.cancel();
    this.save.cancel();
    this.view.destroy();
  }

  trackChanges(callback?: (data: string, editor: Editor) => void) {
    const editorUpdated = app.workspace.on(
      "editor-updated",
      (editor: Editor, transactions: readonly TransactionSpec[]) => {
        if (editor.id !== this.id && editor.file?.path === this.file?.path) {
          if (this.getValue() !== editor.getValue()) {
            this.view.dispatch(...transactions);
            this.onChange(this.getValue());
            callback?.(this.getValue(), this);
          }
        }
      },
    );

    const fileChanged = app.workspace.on(
      "file-change",
      (file: TFile, event: string) => {
        if (file.path === this.file?.path) {
          if (event !== "delete" && file) {
            app.vault.read(file).then((contents) => {
              if (this.getValue() !== contents) {
                this.replaceContent(contents);
                this.onChange(this.getValue());
                callback?.(this.getValue(), this);
              }
            });
          }
        }
      },
    );

    return () => {
      app.workspace.offref(editorUpdated);
      app.workspace.offref(fileChanged);
    };
  }

  updateExtensions(
    extensions: Extension[],
    context?: Record<string, any>,
  ): this {
    return app.telemetry.measure(
      "editor.update_extensions",
      (span) => {
        const ext = this.file?.extension;
        let editorExtensions: Extension[] = extensions.flat();
        if (!extensions.length && ext) {
          editorExtensions = app.editorExtensions(ext, context);
        }
        span.setAttribute("editor.extension_count", editorExtensions.length);
        span.setAttribute("file.extension", ext ?? "");
        const content = this.getValue();
        const selection = this.view.state.selection;
        this.extensions = editorExtensions;
        this.data = content;
        this.view.setState(
          createEditorState(this, content, this.extensions, selection),
        );
        return this;
      },
      {
        attributes: { "file.extension": this.file?.extension ?? "" },
        slowThresholdMs: 50,
      },
    );
  }

  setValue(content: string) {
    app.telemetry.measure(
      "editor.set_value",
      (span) => {
        span.setAttribute("editor.content_length", content.length);
        span.setAttribute("file.extension", this.file?.extension ?? "");
        this.data = content;
        this.view.setState(createEditorState(this, content, this.extensions));
      },
      {
        attributes: { "file.extension": this.file?.extension ?? "" },
        slowThresholdMs: 50,
      },
    );
  }

  replaceContent(content: string, options: { userEvent?: string } = {}) {
    this.data = content;
    const annotations = [syncAnnotation.of(true)];
    this.view.dispatch({
      changes: {
        from: 0,
        to: this.view.state.doc.length,
        insert: content,
      },
      annotations,
      ...(options.userEvent ? { userEvent: options.userEvent } : {}),
    });
  }

  getLine(line: number): string {
    return this.view.state.doc.line(line + 1)?.text ?? "";
  }

  somethingSelected(): boolean {
    return !this.view.state.selection.main.empty;
  }

  getRange(from: EditorPosition, to: EditorPosition): string {
    return this.view.state.sliceDoc(
      this.posToOffset(from),
      this.posToOffset(to),
    );
  }

  replaceSelection(replacement: string, origin?: string): void {
    this.view.dispatch(
      this.view.state.replaceSelection(replacement),
      origin ? { userEvent: origin } : {},
    );
  }

  getCursor(side: "from" | "to" | "head" | "anchor" = "head"): EditorPosition {
    const selection = this.view.state.selection.main;
    const pos =
      side === "from"
        ? selection.from
        : side === "to"
          ? selection.to
          : side === "anchor"
            ? selection.anchor
            : selection.head;
    return toPosition(this.view.state.doc, pos);
  }

  listSelections(): EditorSelection[] {
    return this.view.state.selection.ranges.map((range) => ({
      anchor: toPosition(this.view.state.doc, range.anchor),
      head: toPosition(this.view.state.doc, range.head),
    }));
  }

  setCursor(pos: EditorPosition | number, ch?: number) {
    const cursor = typeof pos === "number" ? { line: pos, ch: ch ?? 0 } : pos;
    this.setSelection(cursor, cursor);
  }

  setSelection(anchor: EditorPosition, head?: EditorPosition) {
    this.view.dispatch({
      selection: {
        anchor: fromPosition(this.view.state.doc, anchor),
        head: head ? fromPosition(this.view.state.doc, head) : undefined,
      },
      scrollIntoView: true,
    });
  }

  setSelections(ranges: EditorSelectionOrCaret[], main: number = 0): void {
    const cmRanges = ranges.map((range) =>
      CodeMirrorSelection.range(
        this.posToOffset(range.anchor),
        this.posToOffset(range.head ?? range.anchor),
      ),
    );
    this.view.dispatch({
      selection: CodeMirrorSelection.create(cmRanges, main),
      scrollIntoView: true,
    });
  }

  replaceRange(
    replacement: string,
    from: EditorPosition,
    to?: EditorPosition,
    origin?: string,
  ) {
    this.view.dispatch({
      userEvent: origin,
      changes: {
        from: fromPosition(this.view.state.doc, from),
        to: to ? fromPosition(this.view.state.doc, to) : undefined,
        insert: replacement,
      },
    });
  }

  focus(): void {
    this.view.focus();
  }

  blur(): void {
    this.view.contentDOM.blur();
  }

  hasFocus(): boolean {
    return this.view.hasFocus;
  }

  getScrollInfo(): EditorScrollInfo {
    const el = this.view.scrollDOM;
    return {
      left: el.scrollLeft,
      top: el.scrollTop,
      width: el.scrollWidth,
      height: el.scrollHeight,
      clientWidth: el.clientWidth,
      clientHeight: el.clientHeight,
    };
  }

  scrollTo(x?: number | null, y?: number | null): void {
    this.view.scrollDOM.scrollTo({
      left: x ?? this.view.scrollDOM.scrollLeft,
      top: y ?? this.view.scrollDOM.scrollTop,
    });
  }

  scrollIntoView(range: EditorRange, center?: boolean): void {
    this.view.dispatch({
      effects: EditorView.scrollIntoView(this.posToOffset(range.from), {
        y: center ? "center" : "nearest",
      }),
    });
  }

  undo(): void {
    undoCommand(this.view);
  }

  redo(): void {
    redoCommand(this.view);
  }

  exec(command: EditorCommandName): void {
    const commands: Partial<Record<EditorCommandName, () => void>> = {
      goUp: () => this.view.dispatch({ selection: { anchor: 0 } }),
      goStart: () => this.view.dispatch({ selection: { anchor: 0 } }),
      goEnd: () =>
        this.view.dispatch({
          selection: { anchor: this.view.state.doc.length },
        }),
      deleteLine: () => {
        const line = this.view.state.doc.lineAt(
          this.view.state.selection.main.head,
        );
        this.view.dispatch({
          changes: {
            from: line.from,
            to: Math.min(line.to + 1, this.view.state.doc.length),
            insert: "",
          },
        });
      },
    };
    commands[command]?.();
  }

  transaction(tx: EditorTransaction, origin?: string): void {
    const specs: TransactionSpec[] = [];
    if (tx.replaceSelection !== undefined) {
      specs.push(this.view.state.replaceSelection(tx.replaceSelection));
    }
    if (tx.changes) {
      specs.push(
        ...tx.changes.map((change) => ({
          changes: {
            from: this.posToOffset(change.from),
            to: this.posToOffset(change.to ?? change.from),
            insert: change.text,
          },
        })),
      );
    }
    if (tx.selection) {
      specs.push({
        selection: {
          anchor: this.posToOffset(tx.selection.from),
          head: this.posToOffset(tx.selection.to ?? tx.selection.from),
        },
      });
    }
    if (tx.selections) {
      specs.push({
        selection: CodeMirrorSelection.create(
          tx.selections.map((selection) =>
            CodeMirrorSelection.range(
              this.posToOffset(selection.from),
              this.posToOffset(selection.to ?? selection.from),
            ),
          ),
        ),
      });
    }
    if (origin) {
      specs.push({ userEvent: origin });
    }
    if (specs.length) {
      this.view.dispatch(...specs);
    }
  }

  wordAt(pos: EditorPosition): EditorRange | null {
    const lineText = this.getLine(pos.line);
    const wordPattern = /[\p{L}\p{N}_-]+/gu;
    for (const match of lineText.matchAll(wordPattern)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      if (pos.ch >= start && pos.ch <= end) {
        return {
          from: { line: pos.line, ch: start },
          to: { line: pos.line, ch: end },
        };
      }
    }
    return null;
  }

  posToOffset(pos: EditorPosition): number {
    return fromPosition(this.view.state.doc, pos);
  }

  offsetToPos(offset: number): EditorPosition {
    return toPosition(this.view.state.doc, offset);
  }

  processLines<T>(
    read: (line: number, lineText: string) => T | null,
    write: (
      line: number,
      lineText: string,
      value: T | null,
    ) => EditorChange | void,
    ignoreEmpty?: boolean,
  ): void {
    const changes: EditorChange[] = [];
    for (let line = 0; line < this.lineCount(); line++) {
      const lineText = this.getLine(line);
      if (ignoreEmpty && !lineText.trim()) {
        continue;
      }
      const value = read(line, lineText);
      const change = write(line, lineText, value);
      if (change) {
        changes.push(change);
      }
    }
    this.transaction({ changes });
  }

  lastLine() {
    return this.view.state.doc.lines - 1;
  }

  setLine(n: number, text: string) {
    const line = this.view.state.doc.line(n + 1);
    if (line) {
      this.view.dispatch({
        changes: { from: line.from, to: line.to, insert: text },
      });
    }
  }

  lineCount(): number {
    return this.view.state.doc.lines;
  }

  getSelection() {
    const selection = this.view.state.selection.main;
    if (selection) {
      return this.view.state.sliceDoc(selection.from, selection.to);
    }
    return "";
  }

  getDoc(): this {
    return this;
  }
}
