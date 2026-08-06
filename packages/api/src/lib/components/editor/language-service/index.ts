import type { Completion, CompletionContext } from "@codemirror/autocomplete";
import type { Action } from "@codemirror/lint";
import { Facet, type Extension, type Text } from "@codemirror/state";
import { hoverTooltip, type EditorView } from "@codemirror/view";
import {
  editorViewField,
  fromPosition,
  toPosition,
} from "../../../editor.svelte";
import { lapisCodeMirrorAutocomplete } from "../extensions/autocomplete";
import {
  lapisCodeMirrorLint,
  lintGutter,
  mapToLapisLintDiagnostic,
  markdownlintRuleUrl,
  setDiagnostics,
} from "../extensions/lint";
import type {
  LanguageServiceCodeAction,
  LanguageServiceCompletionItem,
  LanguageServiceDiagnostic,
  LanguageServicePosition,
  LanguageServiceRange,
  VirtualDocument,
} from "../../../language-service";
import { createLanguageServiceHoverDom } from "./dom";

export interface LanguageServiceDocumentContext {
  document: VirtualDocument | (() => VirtualDocument | null);
  toVirtualPosition?: (
    position: LanguageServicePosition,
  ) => LanguageServicePosition | null;
  fromVirtualRange?: (
    range: LanguageServiceRange,
  ) => LanguageServiceRange | null;
}

export const languageServiceDocumentContext = Facet.define<
  LanguageServiceDocumentContext,
  LanguageServiceDocumentContext | null
>({
  combine(values) {
    return values.at(-1) ?? null;
  },
});

export type E2eSyntheticLintRange = {
  startCol: number;
  endCol: number;
};

export type E2eSyntheticLintPayload = {
  lineIndex: number;
  ranges: E2eSyntheticLintRange[];
};

export interface LanguageServiceEditorOptions {
  languageId?: string;
  lintGutter?: boolean;
  diagnostics?: boolean;
  completion?: boolean;
  hover?: boolean;
}

export function languageServiceExtensions(
  options: LanguageServiceEditorOptions = {},
): Extension[] {
  const extensions: Extension[] = [];
  const wantsDiagnostics = options.diagnostics ?? true;
  const wantsGutter = options.lintGutter ?? true;

  if (wantsDiagnostics) {
    extensions.push(
      ...lapisCodeMirrorLint({
        source: async (view: EditorView) =>
          collectLanguageServiceDiagnostics(view, options),
        gutter: wantsGutter ? undefined : false,
      }),
    );
  } else if (wantsGutter) {
    extensions.push(lintGutter());
  }

  if (options.completion ?? true) {
    extensions.push(...languageServiceCompletions(options));
  }
  if (options.hover ?? true) {
    extensions.push(languageServiceHover(options));
  }
  return extensions;
}

async function collectLanguageServiceDiagnostics(
  view: EditorView,
  options: Pick<LanguageServiceEditorOptions, "languageId">,
) {
  const globalFlags = globalThis as typeof globalThis & {
    __LAPIS_SUPPRESS_LANGUAGE_SERVICE_LINT__?: boolean;
    __LAPIS_SYNTHETIC_LINT__?: E2eSyntheticLintPayload | null;
  };

  if (globalFlags.__LAPIS_SUPPRESS_LANGUAGE_SERVICE_LINT__) {
    const payload = globalFlags.__LAPIS_SYNTHETIC_LINT__;
    if (!payload) {
      return [];
    }

    const line = view.state.doc.line(payload.lineIndex + 1);
    return payload.ranges.map((range) => {
      const startCol = Math.max(0, Math.min(range.startCol, line.length));
      const endCol = Math.max(startCol, Math.min(range.endCol, line.length));
      return mapToLapisLintDiagnostic({
        from: line.from + startCol,
        to: line.from + endCol,
        severity: "warning",
        message: "e2e synthetic lint",
      });
    });
  }

  const context = resolveDocumentContext(view, options.languageId);
  if (!context) {
    return [];
  }

  const diagnostics = await context.info.app.languageServices.diagnostics(
    context.document,
  );

  const mapped = await Promise.all(
    diagnostics.map(async (diagnostic) => {
      const mappedRange =
        context.fromVirtualRange?.(diagnostic.range) ?? diagnostic.range;
      if (!mappedRange) {
        return null;
      }

      const displayRange = normalizeDiagnosticDisplayRange(
        view.state.doc,
        diagnostic,
        mappedRange,
      );
      const from = positionToOffset(view.state.doc, displayRange.start);
      const to = positionToOffset(view.state.doc, displayRange.end);
      const codeActions = await context.info.app.languageServices.codeActions(
        context.document,
        mappedRange,
      );

      return mapToLapisLintDiagnostic(
        {
          from,
          to,
          severity: languageServiceSeverityToLint(diagnostic.severity),
          message: diagnostic.message,
          source: diagnostic.source,
        },
        {
          code: diagnostic.code,
          ruleId: diagnostic.code != null ? String(diagnostic.code) : undefined,
          ruleUrl:
            diagnostic.source === "markdownlint" && diagnostic.code != null
              ? markdownlintRuleUrl(diagnostic.code)
              : undefined,
          sourceLabel: diagnostic.source,
        },
        {
          actions: codeActionsToLintActions(codeActions, view),
        },
      );
    }),
  );

  return mapped.filter(
    (diagnostic): diagnostic is NonNullable<typeof diagnostic> =>
      Boolean(diagnostic),
  );
}

export async function refreshLanguageServiceDiagnostics(
  view: EditorView,
  options: Pick<LanguageServiceEditorOptions, "languageId"> = {},
): Promise<void> {
  const diagnostics = await collectLanguageServiceDiagnostics(view, options);
  view.dispatch(setDiagnostics(view.state, diagnostics));
}

function normalizeDiagnosticDisplayRange(
  doc: Text,
  diagnostic: LanguageServiceDiagnostic,
  range: LanguageServiceRange,
): LanguageServiceRange {
  if (
    diagnostic.source !== "markdownlint" ||
    range.start.line !== range.end.line ||
    range.start.character !== 0 ||
    range.end.character - range.start.character > 1
  ) {
    return range;
  }

  const line = doc.line(range.start.line + 1);
  return {
    start: range.start,
    end: {
      line: range.end.line,
      character: Math.max(range.end.character, line.length),
    },
  };
}

function languageServiceSeverityToLint(
  severity: LanguageServiceDiagnostic["severity"],
): "error" | "warning" | "info" | "hint" {
  if (severity === "error") {
    return "error";
  }
  if (severity === "warning") {
    return "warning";
  }
  if (severity === "information") {
    return "info";
  }
  return "hint";
}

function codeActionsToLintActions(
  codeActions: LanguageServiceCodeAction[],
  view: EditorView,
): Action[] {
  return codeActions
    .map((action) => {
      if (!action.title) {
        return null;
      }
      return {
        name: action.title,
        apply(editorView, from, to) {
          applyLanguageServiceCodeAction(editorView ?? view, action, from, to);
        },
      } satisfies Action;
    })
    .filter((action): action is Action => Boolean(action));
}

function applyLanguageServiceCodeAction(
  view: EditorView,
  action: LanguageServiceCodeAction,
  from: number,
  to: number,
): void {
  const edit = action.edit;
  if (!edit || typeof edit !== "object") {
    return;
  }

  const record = edit as Record<string, unknown>;
  const changes = record.changes;
  if (!Array.isArray(changes)) {
    return;
  }

  const mappedChanges = changes
    .map((change) => {
      if (typeof change !== "object" || change === null) {
        return null;
      }
      const entry = change as Record<string, unknown>;
      const insert =
        typeof entry.insert === "string"
          ? entry.insert
          : typeof entry.text === "string"
            ? entry.text
            : undefined;
      const changeFrom = typeof entry.from === "number" ? entry.from : from;
      const changeTo = typeof entry.to === "number" ? entry.to : to;
      if (insert === undefined) {
        return null;
      }
      return { from: changeFrom, to: changeTo, insert };
    })
    .filter((change): change is { from: number; to: number; insert: string } =>
      Boolean(change),
    );

  if (!mappedChanges.length) {
    return;
  }

  view.dispatch({ changes: mappedChanges });
}

export function languageServiceCompletions(
  options: Pick<LanguageServiceEditorOptions, "languageId"> = {},
): Extension[] {
  return lapisCodeMirrorAutocomplete({
    override: [
      async (completionContext: CompletionContext) => {
        if (!completionContext.view) {
          return null;
        }
        const resolved = resolveDocumentContext(
          completionContext.view,
          options.languageId,
        );
        if (!resolved) {
          return null;
        }

        const localPosition = offsetToPosition(
          completionContext.state.doc,
          completionContext.pos,
        );
        const virtualPosition =
          resolved.toVirtualPosition?.(localPosition) ?? localPosition;
        if (!virtualPosition) {
          return null;
        }

        const completions =
          await resolved.info.app.languageServices.completions(
            resolved.document,
            virtualPosition,
          );
        if (!completions?.items.length) {
          return null;
        }

        return {
          from:
            completions.from === undefined
              ? completionContext.pos
              : positionToOffset(
                  completionContext.state.doc,
                  resolved.fromVirtualRange?.({
                    start: completions.from,
                    end: completions.to ?? virtualPosition,
                  })?.start ?? localPosition,
                ),
          to:
            completions.to === undefined
              ? completionContext.pos
              : positionToOffset(
                  completionContext.state.doc,
                  resolved.fromVirtualRange?.({
                    start: completions.from ?? virtualPosition,
                    end: completions.to,
                  })?.end ?? localPosition,
                ),
          options: completions.items.map(toCodeMirrorCompletion),
        };
      },
    ],
  });
}

export function languageServiceHover(
  options: Pick<LanguageServiceEditorOptions, "languageId"> = {},
): Extension {
  return hoverTooltip(async (view, pos) => {
    const resolved = resolveDocumentContext(view, options.languageId);
    if (!resolved) {
      return null;
    }

    const localPosition = offsetToPosition(view.state.doc, pos);
    const virtualPosition =
      resolved.toVirtualPosition?.(localPosition) ?? localPosition;
    if (!virtualPosition) {
      return null;
    }

    const hover = await resolved.info.app.languageServices.hover(
      resolved.document,
      virtualPosition,
    );
    if (!hover?.contents) {
      return null;
    }

    const range = hover.range ? resolved.fromVirtualRange?.(hover.range) : null;
    const dom = createLanguageServiceHoverDom(
      view.dom.ownerDocument,
      hover.contents,
    );
    return {
      pos: range ? positionToOffset(view.state.doc, range.start) : pos,
      end: range ? positionToOffset(view.state.doc, range.end) : pos,
      above: true,
      create() {
        return { dom };
      },
    };
  });
}

function resolveDocumentContext(view: EditorView, languageId?: string) {
  const facetContext = view.state.facet(languageServiceDocumentContext);
  const info = view.state.field(editorViewField, false) ?? {
    app,
    file: null,
  };

  if (facetContext) {
    const document = resolveVirtualDocument(facetContext);
    if (!document) {
      return null;
    }
    return {
      info,
      document,
      toVirtualPosition: facetContext.toVirtualPosition,
      fromVirtualRange: facetContext.fromVirtualRange,
    };
  }

  const file = info.file;
  if (!file) {
    return null;
  }

  return {
    info,
    document: {
      uri: `vault:///${file.path}`,
      languageId: languageId ?? languageIdFromExtension(file.extension),
      version: view.state.doc.length,
      text: view.state.doc.toString(),
    } satisfies VirtualDocument,
  };
}

function resolveVirtualDocument(
  context: LanguageServiceDocumentContext,
): VirtualDocument | null {
  return typeof context.document === "function"
    ? context.document()
    : context.document;
}

function languageIdFromExtension(extension: string): string {
  if (extension === "md" || extension === "markdown") {
    return "markdown";
  }
  if (extension === "ts") {
    return "typescript";
  }
  if (extension === "js") {
    return "javascript";
  }
  return extension;
}

function positionToOffset(
  doc: Text,
  position: LanguageServicePosition,
): number {
  return fromPosition(doc, {
    line: position.line,
    ch: position.character,
  });
}

function offsetToPosition(doc: Text, offset: number): LanguageServicePosition {
  const position = toPosition(doc, offset);
  return {
    line: position.line,
    character: position.ch,
  };
}

function toCodeMirrorCompletion(
  item: LanguageServiceCompletionItem,
): Completion {
  return {
    label: item.label,
    detail: item.detail,
    info: item.documentation,
    type: item.kind,
    apply: item.apply,
  };
}
