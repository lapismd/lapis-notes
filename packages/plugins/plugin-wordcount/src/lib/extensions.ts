import { StateField, Transaction } from "@codemirror/state";
import {
  ViewPlugin,
  type EditorView,
  type PluginValue,
  type ViewUpdate,
} from "@codemirror/view";
import type { WordCountPlugin } from "./wordcount-plugin";

export const pluginField = StateField.define<WordCountPlugin | null>({
  create() {
    return null;
  },
  update(state) {
    return state;
  },
});

function collectText(
  iterate: () => { done: boolean; value: string; next(): { value: string } },
): string {
  const textIter = iterate();
  let text = "";
  while (!textIter.done) {
    text += textIter.next().value;
  }
  return text;
}

function documentText(view: EditorView): string {
  const selection = view.state.selection.main;
  return selection.from !== selection.to
    ? view.state.doc.sliceString(selection.from, selection.to)
    : view.state.doc.toString();
}

class StatusBarEditorPlugin implements PluginValue {
  constructor(view: EditorView) {
    const plugin = view.state.field(pluginField);
    plugin?.scheduleStatusUpdate(documentText(view));
  }

  update(update: ViewUpdate): void {
    const tr = update.transactions[0];
    if (!tr) return;
    const plugin = update.view.state.field(pluginField);
    if (!plugin) return;

    const userEventTypeUndefined =
      tr.annotation(Transaction.userEvent) === undefined;
    if (
      (tr.isUserEvent("select") || userEventTypeUndefined) &&
      tr.newSelection.ranges[0].from !== tr.newSelection.ranges[0].to
    ) {
      const selection = tr.newSelection.main;
      plugin.scheduleStatusUpdate(
        collectText(() => tr.newDoc.iterRange(selection.from, selection.to)),
      );
      return;
    }
    if (
      tr.isUserEvent("input") ||
      tr.isUserEvent("delete") ||
      tr.isUserEvent("move") ||
      tr.isUserEvent("undo") ||
      tr.isUserEvent("redo") ||
      tr.isUserEvent("select")
    ) {
      plugin.scheduleStatusUpdate(collectText(() => tr.newDoc.iter()));
    }
  }
}

export const statusBarEditorPlugin = ViewPlugin.fromClass(
  StatusBarEditorPlugin,
);
