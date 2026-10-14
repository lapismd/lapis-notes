import type {
  App,
  Editor,
  EditorPersistenceWriter,
  FileEditingSession,
  TFile,
} from "../../dist/index.js";

declare const app: App;
// Portable writers can provide synchronous release callbacks without renderer types.
const session: FileEditingSession = {
  dirty: false,
  flush: async () => undefined,
  protect: async () => () => undefined,
};
const unregister: () => void = app.fileEditingSessions.register(
  "note.md",
  session,
);
const result: Promise<string> = app.fileEditingSessions.guard(
  "note.md",
  async () => "applied",
);
const flushed: Promise<{ flushed: boolean; path?: string }> =
  app.fileEditingSessions.flush("note.md");
const cleanup: Promise<void> = app.fileEditingSessions.dispose();
void unregister;
void result;
void flushed;
void cleanup;

declare const editor: Editor;
const writer: EditorPersistenceWriter = async ({
  application,
  file,
  content,
}) => {
  if (file) await application.vault.modify(file, content);
};
editor.setExternalPersistenceWriter(writer);
const protection: Promise<() => void> = editor.protect();
const disposal: Promise<void> = editor.dispose();
const dirty: boolean = editor.hasUnsavedChanges;
const protectedEditor: boolean = editor.editingProtected;
void protection;
void disposal;
void dirty;
void protectedEditor;

declare const file: TFile;
const loaded: Promise<boolean> = editor.loadDocument(
  file,
  () => app.vault.read(file),
  (contents) => {
    editor.setValue(contents);
  },
);
editor.cancelDocumentLoad();
void loaded;
