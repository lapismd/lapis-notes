import {
  Annotation,
  Compartment,
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
import { tick } from "svelte";
import {
  EditorSaveContext,
  type EditorSaveSnapshot,
} from "./editor-save-context";
import { resolveApplication } from "./application-compatibility";
import { FileTextPersistence } from "./file-text-persistence";
import type { FileEditingRegistration } from "./file-editing-sessions";

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
export interface EditorPersistenceRequest {
  readonly content: string;
  readonly file: TFile | null;
  readonly application: App;
}
export type EditorPersistenceWriter = (
  request: EditorPersistenceRequest,
) => Promise<void>;
interface EditorDocumentBinding {
  application: App;
  file: TFile | null;
  path?: string;
  persistence: EditorPersistence;
  writer?: EditorPersistenceWriter;
  saves: EditorSaveContext;
  text?: FileTextPersistence;
  unregister?: FileEditingRegistration;
  loading?: Promise<void>;
}
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
      return {
        get app() {
          return resolveApplication();
        },
        file: null,
      };
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
        get app() {
          return editor.app;
        },
        editor,
        get file() {
          return editor.file;
        },
      })),
      editor.protectionExtensions(),
      EditorState.transactionFilter.of((transaction) =>
        transaction.docChanged &&
        editor.editingProtected &&
        !transaction.annotation(syncAnnotation)
          ? []
          : transaction,
      ),
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
        editor.app.workspace.dispatch("editor-updated", editor, specs);
      }
    },
    state: createEditorState(editor, doc, extensions),
  });
}

export class Editor extends EventDispatcher<{
  change: [data: string];
}> {
  view: EditorView;
  #file: TFile | null = $state.raw(null);
  #persistence: EditorPersistence = "vault";
  #externalWriter: EditorPersistenceWriter | undefined;
  #editingProtected = $state(0);
  readonly #protection = new Compartment();
  readonly #documents = new Set<EditorDocumentBinding>();
  #document: EditorDocumentBinding | undefined;
  readonly id = crypto.randomUUID();
  private destroyed = false;
  private application?: App;
  #writeTail: Promise<void> = Promise.resolve();
  #sequence = 0;
  #completedSequence = 0;
  #documentGeneration = 0;
  #fileReadGeneration = 0;
  #refreshError: unknown;
  #loading: { cancel(): void } | undefined;
  #controlledLoad = false;

  get file(): TFile | null {
    return this.#file;
  }
  set file(file: TFile | null) {
    if (file === this.#file && file?.path === this.#document?.path) return;
    this.#assertWritable();
    const next = this.#createDocument(
      this.app,
      file,
      this.#persistence,
      this.#externalWriter,
    );
    this.#retireDocument();
    this.#file = file;
    this.#document = next;
    this.#documentGeneration++;
  }

  get persistence(): EditorPersistence {
    return this.#persistence;
  }
  set persistence(value: EditorPersistence) {
    if (value === this.#persistence) return;
    this.#assertWritable();
    const next = this.#createDocument(
      this.app,
      this.#file,
      value,
      this.#externalWriter,
    );
    this.#retireDocument();
    this.#persistence = value;
    this.#document = next;
    this.#documentGeneration++;
  }

  /** Capture an explicit asynchronous owner for external-mode persistence. */
  setExternalPersistenceWriter(writer?: EditorPersistenceWriter): this {
    if (writer === this.#externalWriter) return this;
    this.#assertWritable();
    const next = this.#createDocument(
      this.app,
      this.#file,
      this.#persistence,
      writer,
    );
    this.#retireDocument();
    this.#externalWriter = writer;
    this.#document = next;
    this.#documentGeneration++;
    return this;
  }

  #assertWritable(): void {
    if (this.destroyed) throw new Error("Editor is destroyed");
    if (this.editingProtected) throw new Error("Editor editing is protected");
  }

  #retireDocument(): void {
    this.#document?.saves.retire();
  }

  #serializeWrite(run: () => Promise<void>): Promise<void> {
    const result = this.#writeTail.then(run);
    this.#writeTail = result.catch(() => undefined);
    return result;
  }

  #createDocument(
    application: App,
    file: TFile | null,
    persistence: EditorPersistence,
    writer?: EditorPersistenceWriter,
  ): EditorDocumentBinding {
    const initialText = this.data;
    const document = {
      application,
      file,
      path: file?.path,
      persistence,
      writer,
    } as EditorDocumentBinding;
    document.saves = new EditorSaveContext({
      unownedExternal: persistence === "external" && !writer,
      serialize: (run) => this.#serializeWrite(run),
      persist: async (snapshot) => {
        if (document.unregister?.native) await document.unregister.ready();
        if (file?.path !== document.path)
          throw new Error("Editor persistence target changed");
        if (document.text) await document.text.persist(snapshot.content);
        else if (persistence === "vault" && file)
          await application.vault.modify(file, snapshot.content);
        else if (persistence === "external" && writer)
          await writer({ application, file, content: snapshot.content });
      },
      saved: (snapshot) => {
        this.#completedSequence = Math.max(
          this.#completedSequence,
          snapshot.sequence,
        );
        if (
          !this.destroyed &&
          this.#document === document &&
          this.app === application &&
          this.file === file &&
          snapshot.documentGeneration === this.#documentGeneration
        ) {
          this.data = snapshot.content;
          if (snapshot.content === this.getValue())
            this.onChange(snapshot.content);
        }
      },
      released: () => {
        document.unregister?.();
        this.#documents.delete(document);
      },
    });
    if (
      persistence === "vault" &&
      file &&
      application.vault.supportsConditionalTextWrites
    ) {
      document.text = new FileTextPersistence({
        vault: application.vault,
        file,
        baseline: this.data,
        conflicts: application.fileEditingSessions.textConflicts,
        local: () => document.saves.latest?.content ?? this.data,
        protect: () => ({
          release:
            !this.destroyed && this.#document === document
              ? this.#holdEditing()
              : () => undefined,
          saved: () => {
            const snapshot = document.saves.latest;
            if (!snapshot) throw new Error("No retained editor snapshot");
            document.saves.accept(snapshot);
          },
          reset: (contents) => {
            if (!this.destroyed && this.#document === document) {
              this.#replaceContent(contents);
              this.onChange(contents);
            }
            document.saves.discard();
          },
        }),
        settle: async () => {
          await document.loading;
          try {
            await document.saves.flush(false);
          } catch (error) {
            if (!document.text?.hasConflict) throw error;
          }
        },
        serialize: (run) => this.#serializeWrite(run),
      });
    }
    if (file) {
      if (!application.fileEditingSessions)
        throw new Error("App has no file editing-session registry");
      document.unregister = application.fileEditingSessions.register(
        file.path,
        {
          native: {
            hold: () => this.#holdEditing(),
            savedText: () =>
              document.text
                ? document.text.baseline
                : (document.saves.latest?.content ?? initialText),
            refreshSavedText: (contents) => {
              if (document.loading || document.saves.dirty || !document.text)
                throw new Error(
                  "Native editor refresh requires clean conditional text authority",
                );
              document.text.acceptBaseline(contents);
              if (
                !this.destroyed &&
                this.#document === document &&
                contents !== null
              ) {
                if (this.getValue() !== contents)
                  this.#replaceContent(contents);
                this.data = contents;
                this.onChange(contents);
              }
            },
          },
          get dirty() {
            return !!document.loading || document.saves.dirty;
          },
          flush: async () => {
            await document.loading;
            await document.saves.flush();
          },
          protect: () => this.#protectDocument(document),
        },
      );
    }
    this.#documents.add(document);
    return document;
  }

  #currentDocument(): EditorDocumentBinding {
    return (this.#document ??= this.#createDocument(
      this.app,
      this.file,
      this.persistence,
      this.#externalWriter,
    ));
  }

  private captureChange(content: string): EditorSaveSnapshot {
    return {
      content,
      documentGeneration: this.#documentGeneration,
      sequence: ++this.#sequence,
    };
  }

  get hasUnsavedChanges(): boolean {
    return (
      (!this.destroyed && this.getValue() !== this.data) ||
      [...this.#documents].some((document) => document.saves.dirty)
    );
  }

  get editingProtected(): boolean {
    return this.destroyed || this.#editingProtected > 0;
  }

  /** Native CodeMirror protection, retained whenever editor state is rebuilt. */
  protectionExtensions(): Extension {
    return this.#protection.of([
      EditorState.readOnly.of(this.editingProtected),
      EditorView.editable.of(!this.editingProtected),
    ]);
  }

  #holdEditing(): () => void {
    this.#editingProtected++;
    this.#updateProtection();
    let held = true;
    return () => {
      if (!held) return;
      held = false;
      this.#editingProtected--;
      this.#updateProtection();
    };
  }

  #updateProtection(): void {
    if (!this.destroyed)
      this.view.dispatch({
        effects: this.#protection.reconfigure([
          EditorState.readOnly.of(this.editingProtected),
          EditorView.editable.of(!this.editingProtected),
        ]),
      });
  }

  async #protectDocument(document: EditorDocumentBinding): Promise<() => void> {
    if (document.persistence === "external" && !document.writer)
      throw new Error(
        "External editor persistence requires an explicit writer for protection",
      );
    const release =
      !this.destroyed && (this.#document === document || !!document.loading)
        ? this.#holdEditing()
        : () => undefined;
    try {
      await tick();
      await document.loading;
      await document.saves.flush();
      return release;
    } catch (error) {
      release();
      throw error;
    }
  }

  /** Protect the current document and drain its captured persistence. */
  protect(): Promise<() => void> {
    if (this.destroyed) return Promise.reject(new Error("Editor is destroyed"));
    return this.#protectDocument(this.#currentDocument());
  }

  /**
   * Register and protect a target, then publish its file and contents
   * atomically.
   */
  async loadDocument(
    file: TFile,
    read: () => Promise<string>,
    publish?: (contents: string) => void,
  ): Promise<boolean> {
    if (this.destroyed) throw new Error("Editor is destroyed");
    if (this.#editingProtected > (this.#loading ? 1 : 0))
      throw new Error("Editor editing is protected");
    const application = this.app,
      path = file.path;
    // Admission failure leaves any previous load and binding untouched.
    const document = this.#createDocument(
      application,
      file,
      this.persistence,
      this.#externalWriter,
    );
    const release = this.#holdEditing();
    let cancelRead!: (value: { canceled: true }) => void;
    const cancellation = new Promise<{ canceled: true }>((resolve) => {
      cancelRead = resolve;
    });
    let finish!: () => void;
    document.loading = new Promise<void>((resolve) => {
      finish = resolve;
    });
    let canceled = false,
      completed = false;
    const load = {
      cancel: () => {
        if (completed || canceled) return;
        canceled = true;
        cancelRead({ canceled: true });
        document.loading = undefined;
        document.saves.retire();
        finish();
        release();
        if (this.#loading === load) this.#loading = undefined;
      },
    };
    this.#loading?.cancel();
    this.#loading = load;
    let published = false;
    try {
      if (document.unregister?.native) {
        const admission = await Promise.race([
          document.unregister.ready().then(() => ({ ready: true as const })),
          cancellation,
        ]);
        if ("canceled" in admission || canceled) return false;
      }
      const drained = await Promise.race([
        this.flushChanges().then(() => ({ drained: true as const })),
        cancellation,
      ]);
      if ("canceled" in drained || canceled) return false;
      const result = await Promise.race([
        Promise.resolve()
          .then(read)
          .then((contents) => ({ contents })),
        cancellation,
      ]);
      if ("canceled" in result || canceled) return false;
      if (this.destroyed || this.app !== application || file.path !== path)
        throw new Error("Editor document load authority changed");
      const previous = {
        document: this.#document,
        file: this.#file,
        data: this.data,
        state: this.view.state,
        extensions: this.extensions,
      };
      this.#document = document;
      this.#file = file;
      try {
        this.#controlledLoad = true;
        this.setValue(result.contents);
        publish?.(result.contents);
        if (this.destroyed || canceled)
          throw new Error("Editor document load canceled during publication");
        if (this.app !== application || file.path !== path)
          throw new Error("Editor document load authority changed");
        published = true;
        previous.document?.saves.retire();
      } catch (error) {
        this.#document = previous.document;
        this.#file = previous.file;
        this.data = previous.data;
        this.extensions = previous.extensions;
        this.#documentGeneration++;
        if (!this.destroyed) this.view.setState(previous.state);
        throw error;
      } finally {
        this.#controlledLoad = false;
      }
      return true;
    } finally {
      if (!canceled) {
        completed = true;
        document.loading = undefined;
        if (!published) document.saves.retire();
        finish();
        release();
      }
      if (this.#loading === load) this.#loading = undefined;
    }
  }

  /** Cancel a pending publication while observing any late read result. */
  cancelDocumentLoad(): void {
    this.#loading?.cancel();
  }

  get refreshError(): unknown {
    return this.#refreshError;
  }

  constructor(
    public data: string = "",
    public extensions: Extension[] = [],
    application?: App,
  ) {
    super();
    this.application = application;
    this.view = createEditor(this, data, extensions);
  }

  /** Bind this editor to the application that owns its view. */
  bindApplication(application: App): this {
    if (this.application === application) return this;
    this.#assertWritable();
    const next = this.#createDocument(
      application,
      this.#file,
      this.#persistence,
      this.#externalWriter,
    );
    this.#retireDocument();
    this.application = application;
    this.#document = next;
    this.#documentGeneration++;
    return this;
  }

  /** The owning application, with the global alias retained as fallback. */
  get app(): App {
    return resolveApplication(this.application);
  }

  readonly save = Object.assign(
    () => {
      this.#assertWritable();
      const document = this.#currentDocument();
      document.unregister?.changed();
      return document.saves.queue(this.captureChange(this.getValue()), true);
    },
    {
      flush: () => this.#document?.saves.flushSave(),
      cancel: () => {
        this.#assertWritable();
        this.#document?.saves.cancelSave();
      },
    },
  );

  get cm() {
    return this.view;
  }

  onChange(data: string) {
    this.trigger("change", data);
  }

  /** Queue the latest editor contents for persistence/change notification. */
  queueChange(data: string): void {
    this.#assertWritable();
    const document = this.#currentDocument();
    document.unregister?.changed();
    document.saves.queue(this.captureChange(data));
    document.text?.updateLocal(data);
  }

  /** Drain every captured document, including failed or retired saves. */
  async flushChanges(): Promise<void> {
    const errors = new Map<EditorDocumentBinding, unknown>();
    const visited = new Set<EditorDocumentBinding>();
    let sequence: number, generation: number;
    do {
      sequence = this.#sequence;
      generation = this.#documentGeneration;
      const documents = [...this.#documents];
      const results = await Promise.allSettled(
        documents.map((document) => {
          const retry = !visited.has(document);
          visited.add(document);
          return document.saves.flush(retry);
        }),
      );
      results.forEach((result, index) => {
        if (result.status === "rejected")
          errors.set(documents[index], result.reason);
      });
    } while (
      sequence !== this.#sequence ||
      generation !== this.#documentGeneration
    );
    if (errors.size === 1) throw errors.values().next().value;
    if (errors.size)
      throw new AggregateError(
        [...errors.values()],
        "Editor persistence failed",
      );
  }

  /** Cancel a queued change when the owning document is intentionally reset. */
  cancelPendingChanges(): void {
    this.#assertWritable();
    this.#document?.saves.cancelChange();
  }

  getValue() {
    return this.view.state.doc.toString();
  }

  refresh(): void {
    this.view.requestMeasure();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cancelDocumentLoad();
    for (const document of this.#documents) document.saves.retire();
    this.view.destroy();
  }

  /** Stop editing immediately and await all retained document persistence. */
  async dispose(): Promise<void> {
    this.destroy();
    await this.flushChanges();
  }

  trackChanges(callback?: (data: string, editor: Editor) => void) {
    const owner = this.app;
    let active = true;
    const editorUpdated = owner.workspace.on(
      "editor-updated",
      (editor: Editor, transactions: readonly TransactionSpec[]) => {
        if (!active || this.destroyed || this.app !== owner) return;
        if (editor.id !== this.id && editor.file?.path === this.file?.path) {
          if (this.getValue() !== editor.getValue()) {
            this.view.dispatch(...transactions);
            this.onChange(this.getValue());
            callback?.(this.getValue(), this);
          }
        }
      },
    );

    const fileChanged = owner.workspace.on(
      "file-change",
      (file: TFile, event: string) => {
        if (!active || this.destroyed || this.app !== owner) return;
        if (file.path === this.file?.path) {
          if (event !== "delete" && file) {
            const application = this.app,
              target = this.file,
              path = target?.path;
            const readGeneration = ++this.#fileReadGeneration,
              documentGeneration = this.#documentGeneration;
            const sequence = this.#sequence,
              completed = this.#completedSequence;
            void application.vault
              .read(file)
              .then((contents) => {
                if (
                  !active ||
                  this.destroyed ||
                  this.app !== application ||
                  this.file !== target ||
                  this.file?.path !== path ||
                  this.#fileReadGeneration !== readGeneration ||
                  this.#documentGeneration !== documentGeneration ||
                  this.#sequence !== sequence ||
                  this.#completedSequence !== completed
                )
                  return;
                this.#refreshError = undefined;
                if (this.getValue() === contents) {
                  this.data = contents;
                  if (!this.#document?.saves.dirty)
                    this.#document?.text?.acceptBaseline(contents);
                  return;
                }
                if (
                  this.getValue() !== this.data ||
                  this.#document?.saves.dirty
                )
                  return;
                if (this.getValue() !== contents) {
                  this.#replaceContent(contents);
                  this.onChange(this.getValue());
                  callback?.(this.getValue(), this);
                }
              })
              .catch((error: unknown) => {
                if (
                  active &&
                  !this.destroyed &&
                  this.app === application &&
                  this.file?.path === path &&
                  this.#fileReadGeneration === readGeneration &&
                  this.file === target &&
                  this.#documentGeneration === documentGeneration &&
                  this.#sequence === sequence &&
                  this.#completedSequence === completed
                )
                  this.#refreshError = error;
              });
          }
        }
      },
    );

    return () => {
      active = false;
      owner.workspace.offref(editorUpdated);
      owner.workspace.offref(fileChanged);
    };
  }

  updateExtensions(
    extensions: Extension[],
    context?: Record<string, any>,
  ): this {
    return this.app.telemetry.measure(
      "editor.update_extensions",
      (span) => {
        const ext = this.file?.extension;
        let editorExtensions: Extension[] = extensions.flat();
        if (!extensions.length && ext) {
          editorExtensions = this.app.editorExtensions(ext, context);
        }
        span.setAttribute("editor.extension_count", editorExtensions.length);
        span.setAttribute("file.extension", ext ?? "");
        const content = this.getValue();
        const selection = this.view.state.selection;
        this.extensions = editorExtensions;
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
    if (!this.#controlledLoad) this.#assertWritable();
    else if (this.destroyed) throw new Error("Editor is destroyed");
    this.#documentGeneration++;
    this.#refreshError = undefined;
    if (!this.#document?.saves.dirty)
      this.#document?.text?.acceptBaseline(content);
    this.app.telemetry.measure(
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
    this.#assertWritable();
    this.#replaceContent(content, options);
  }

  #replaceContent(content: string, options: { userEvent?: string } = {}) {
    this.#documentGeneration++;
    this.#refreshError = undefined;
    if (!this.#document?.saves.dirty)
      this.#document?.text?.acceptBaseline(content);
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
