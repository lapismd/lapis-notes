import { getContext, setContext } from "svelte";

const EDITABLE_PREVIEW_CLOSE_CONTEXT = Symbol(
  "lapis-editable-preview-close-context",
);

export function provideEditablePreviewClose(callback: () => void): void {
  setContext(EDITABLE_PREVIEW_CLOSE_CONTEXT, callback);
}

export function useEditablePreviewClose(): (() => void) | undefined {
  return getContext<(() => void) | undefined>(EDITABLE_PREVIEW_CLOSE_CONTEXT);
}
