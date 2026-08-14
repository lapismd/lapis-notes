import type { Extension } from "@codemirror/state";
import type { App } from "$lib/context.svelte";
import type { Editor } from "$lib/editor.svelte";
import { markupEditor } from "./editor";

export interface EmbeddedEditorExtensionOptions {
  viewType: string;
  mode?: string;
  sourcePath?: string;
  fallbackLanguage?: string;
}

export function embeddedEditorContext(
  options: EmbeddedEditorExtensionOptions,
): Record<string, unknown> {
  return {
    ...(options.mode ? { mode: options.mode } : {}),
    ...(options.sourcePath ? { file: options.sourcePath } : {}),
  };
}

export function resolveEmbeddedEditorExtensions(
  app: App,
  options: EmbeddedEditorExtensionOptions,
): Extension[] {
  const registered = app.editorExtensions(
    options.viewType,
    embeddedEditorContext(options),
  );
  if (registered.length > 0) {
    return registered;
  }
  return [
    markupEditor({
      language: options.fallbackLanguage ?? options.viewType,
    }),
  ];
}

export function applyEmbeddedEditorExtensions(
  app: App,
  editor: Editor,
  options: EmbeddedEditorExtensionOptions,
): void {
  editor.updateExtensions(resolveEmbeddedEditorExtensions(app, options));
}
