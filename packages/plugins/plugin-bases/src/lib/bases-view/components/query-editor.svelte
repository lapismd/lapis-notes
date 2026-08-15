<script lang="ts">
  import { keywordCompletionSource, sql } from "@codemirror/lang-sql";
  import { syntaxHighlighting } from "@codemirror/language";
  import {
    CompletionContext,
    type Completion,
    type CompletionResult,
  } from "@codemirror/autocomplete";
  import { EditorState } from "@codemirror/state";
  import {
    EditorView,
    ViewUpdate,
    keymap,
    placeholder as placeHolder,
    tooltips,
  } from "@codemirror/view";
  import {
    cn,
    lapisCodeMirrorAutocomplete,
    setIcon,
    type BasesPropertyId,
  } from "@lapis-notes/api";
  import { classHighlighter } from "@lapis-notes/api/editor/extensions/class-highlighter";
  import { debounce } from "lodash-es";
  import type { HTMLAttributes } from "svelte/elements";
  import { basesDialect } from "../db";
  import { filterLabels } from "../models";
  import { isOp } from "../filter-parser";
  import type { QueryController } from "../bases.svelte";

  let {
    content = $bindable(""),
    onDocChange,
    onBlur,
    class: className,
    placeholder,
    controller,
    ...rest
  }: HTMLAttributes<HTMLDivElement> & {
    content: string;
    onBlur?: (value: string) => void;
    onDocChange?: (value: string) => void;
    placeholder?: string;
    controller: QueryController;
  } = $props();

  let editorView!: EditorView;

  let reportChanges = debounce((value: string) => {
    if (onDocChange) {
      onDocChange(value);
    }
  }, 500);

  let dialect = $derived(basesDialect(controller));
  let completionIcons = $derived.by(() => {
    return controller
      .getAllColumns()
      .reduce<Record<string, string>>((acc, value) => {
        acc[value.id] = value.icon ?? "lucide-info";
        if (value.id.startsWith("note.")) {
          acc[value.id] = acc[value.id];
        }
        return acc;
      }, {});
  });

  function completeFunctions(
    context: CompletionContext,
  ): CompletionResult | null {
    let word = context.matchBefore(/[\w$]+(\.[\w$]+(\([^)]*\))?)*\.?/);
    if (!word || (word.from == word.to && !context.explicit)) return null;
    const parts = word.text.split(".");
    if (parts.length >= 2) {
      const base = parts
        .slice(0, parts.length - 1)
        .join(".") as BasesPropertyId;
      const after = parts.length > 2 ? parts[parts.length - 1] : "";
      const type = completionIcons[base]
        ? (controller.getColumn(base)?.type ?? "unknown")
        : "unknown";
      if (filterLabels[type]) {
        const completions: Completion[] = filterLabels[type]
          .filter((it) => !it.value.startsWith("!") && !isOp(it.value))
          .map((value) => {
            return {
              label: `${value.value}()`,
              type: "function",
            };
          });
        return {
          from: word.to - after.length,
          options: [...completions, { label: `toString()`, type: "function" }],
        };
      }
    }
    return null;
  }

  function codeMirror(el: HTMLElement, content: string) {
    editorView = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          sql({
            dialect: dialect,
          }),
          ...lapisCodeMirrorAutocomplete({
            override: [keywordCompletionSource(dialect), completeFunctions],
            addToOptions: [
              {
                render(completion) {
                  let icon = completionIcons[completion.label];
                  if (completion.type === "function") {
                    icon = "lucide-square-function";
                  }
                  if (icon) {
                    const span = createSpan(
                      "suggestion-flair [&_svg:not([class*='text-'])]:text-muted-foreground  text-sm  [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                    );
                    setIcon(span, icon);
                    return span;
                  }
                  return null;
                },
                position: 20,
              },
            ],
          }),
          syntaxHighlighting(classHighlighter),
          tooltips({
            parent: document.body,
          }),
          EditorView.domEventHandlers({
            blur: () => {
              onBlur?.(editorView.state.doc.toString());
            },
          }),
          keymap.of([
            {
              key: "Enter",
              run: (view) => {
                // Insert newline and prevent event from bubbling to parent
                view.dispatch({
                  changes: {
                    from: view.state.selection.main.head,
                    insert: "\n",
                  },
                  selection: { anchor: view.state.selection.main.head + 1 },
                });
                return true; // This prevents the event from propagating
              },
            },
          ]),
          placeholder ? placeHolder(placeholder) : [],
          EditorView.editorAttributes.of({ class: "mod-inline" }),
          EditorView.updateListener.of((v: ViewUpdate) => {
            if (v.docChanged) {
              reportChanges(v.state.doc.toString());
            }
          }),
        ],
      }),
      parent: el,
    });
    return {
      update: (content: string) => {
        const current = editorView.state.doc.toString();
        if (current === content) {
          return;
        }
        editorView.dispatch({
          changes: [
            { from: 0, to: editorView.state.doc.length, insert: content },
          ],
        });
      },
    };
  }
</script>

<div
  {...rest}
  use:codeMirror={content}
  data-ui-component="bases-query-editor"
  class={cn("bases-style-h-full-668b21", className)}
></div>
