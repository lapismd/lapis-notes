export * from "./editor";
export * from "./embedded-editor-surface";
export * from "./language-service";
export * from "./extensions/autocomplete";
export * from "./extensions/lint";
import NoteEditor from "./editor.svelte";
import EmbeddedEditorSurface from "./embedded-editor-surface.svelte";

export { EmbeddedEditorSurface, NoteEditor };
export default NoteEditor;
