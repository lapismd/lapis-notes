import { autocompletion } from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/**
 * Align tooltip typography with the app shell. List chrome is themed via
 * `@lapis-notes/ui/codemirror-autocomplete.css`.
 */
const lapisAutocompleteTooltipTheme = EditorView.theme({
  ".cm-tooltip.cm-tooltip-autocomplete": {
    fontFamily: "inherit",
  },
  ".cm-tooltip.cm-completionInfo": {
    fontFamily: "inherit",
  },
});

/** Options accepted by `@codemirror/autocomplete`'s `autocompletion()`. */
export type LapisCodeMirrorAutocompleteConfig = Exclude<
  Parameters<typeof autocompletion>[0],
  undefined
>;

/**
 * Shared CodeMirror autocompletion defaults for Lapis editors. Popover-aligned
 * surfaces come from `@lapis-notes/ui/codemirror-autocomplete.css`; this sets
 * shared defaults (e.g. `icons: false`) plus a light `EditorView.theme`.
 *
 * **Facet merge:** multiple `autocompletion()` extensions merge completion
 * config (`addToOptions` concatenate; `optionClass` / `tooltipClass` join with
 * spaces; `icons` uses AND). Avoid defining conflicting `override` arrays in
 * two extensions — either pass every `CompletionSource` in one call or rely on
 * a single extension that provides `override`.
 */
export function lapisCodeMirrorAutocomplete(
  config: LapisCodeMirrorAutocompleteConfig = {},
): Extension[] {
  return [
    lapisAutocompleteTooltipTheme,
    autocompletion({
      ...config,
      icons: false,
    }),
  ];
}
