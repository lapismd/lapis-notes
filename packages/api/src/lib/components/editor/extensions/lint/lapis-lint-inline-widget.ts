import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";

export interface InlineProblemSpec {
  /** Start-of-line character position; the block widget renders below this line. */
  lineStart: number;
  /** End-of-line character position; the block widget renders below this line. */
  lineEnd: number;
  /** Approximate character offset of the diagnostic start within the line. */
  column: number;
  message: string;
  sourceLabel?: string;
  ruleId?: string;
  pointerLeftPx: number;
  maxWidthPx: number;
}

export const showInlineProblem = StateEffect.define<InlineProblemSpec | null>();

class InlineProblemWidget extends WidgetType {
  constructor(readonly spec: InlineProblemSpec) {
    super();
  }

  eq(other: InlineProblemWidget): boolean {
    return (
      this.spec.lineEnd === other.spec.lineEnd &&
      this.spec.lineStart === other.spec.lineStart &&
      this.spec.column === other.spec.column &&
      this.spec.message === other.spec.message &&
      this.spec.ruleId === other.spec.ruleId
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const doc = view.dom.ownerDocument;
    const root = doc.createElement("div");
    root.className = "lapis-inline-problem";
    root.style.setProperty(
      "--lapis-inline-problem-pointer-left",
      `${this.spec.pointerLeftPx}px`,
    );
    root.style.setProperty(
      "--lapis-inline-problem-max-width",
      `${this.spec.maxWidthPx}px`,
    );

    const pointer = doc.createElement("div");
    pointer.className = "lapis-inline-problem__pointer";
    pointer.setAttribute("aria-hidden", "true");

    // Header row
    const header = doc.createElement("div");
    header.className = "lapis-inline-problem__header";

    const title = doc.createElement("span");
    title.className = "lapis-inline-problem__title";

    const icon = doc.createElement("span");
    icon.className = "lapis-inline-problem__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "⚠";

    const labelEl = doc.createElement("span");
    labelEl.className = "lapis-inline-problem__label";
    labelEl.textContent = "Problem";

    title.append(icon, labelEl);

    const closeBtn = doc.createElement("button");
    closeBtn.className = "lapis-inline-problem__close";
    closeBtn.setAttribute("type", "button");
    closeBtn.setAttribute("aria-label", "Close problem widget");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.dispatch({ effects: showInlineProblem.of(null) });
    });

    header.append(title, closeBtn);

    // Body row
    const body = doc.createElement("div");
    body.className = "lapis-inline-problem__body";

    const msgSpan = doc.createElement("span");
    msgSpan.className = "lapis-inline-problem__message";
    msgSpan.textContent = this.spec.message;
    body.append(msgSpan);

    if (this.spec.sourceLabel != null || this.spec.ruleId != null) {
      const sourceTag = doc.createElement("span");
      sourceTag.className = "lapis-inline-problem__source";
      const src = this.spec.sourceLabel ?? "";
      const ruleParens =
        this.spec.ruleId != null ? `(${this.spec.ruleId})` : "";
      sourceTag.textContent = `${src}${ruleParens}`;
      body.append(sourceTag);
    }

    root.append(pointer, header, body);
    return root;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

/**
 * StateField that tracks the active inline problem widget.
 *
 * Include this in the editor's extensions (e.g. via `lapisCodeMirrorLint`) so
 * that `toggleInlineProblem` can show or hide the widget.
 */
export const inlineProblemExtension =
  StateField.define<InlineProblemSpec | null>({
    create: () => null,

    update(spec, tr) {
      // Keep the anchor position in sync with document edits.
      if (spec != null && tr.docChanged) {
        const mappedStart = tr.changes.mapPos(spec.lineStart, 1);
        const mappedEnd = tr.changes.mapPos(spec.lineEnd, -1);
        spec = { ...spec, lineStart: mappedStart, lineEnd: mappedEnd };
      }
      for (const effect of tr.effects) {
        if (effect.is(showInlineProblem)) {
          return effect.value;
        }
      }
      return spec;
    },

    provide: (f) =>
      EditorView.decorations.from(f, (spec) => {
        if (spec == null) return Decoration.none;
        return Decoration.set([
          Decoration.widget({
            widget: new InlineProblemWidget(spec),
            block: true,
            inlineOrder: true,
            side: 1,
          }).range(spec.lineEnd),
        ]);
      }),
  });

/**
 * Toggle the inline problem widget below the diagnostic's line.
 *
 * Calling with the same position and message a second time dismisses the
 * widget. A no-op when `inlineProblemExtension` is absent from the editor state
 * (the dispatched effect is silently ignored by CodeMirror).
 */
export function toggleInlineProblem(
  view: EditorView,
  from: number,
  spec: Omit<
    InlineProblemSpec,
    "lineStart" | "lineEnd" | "column" | "pointerLeftPx" | "maxWidthPx"
  >,
): void {
  const line = view.state.doc.lineAt(from);
  const current = view.state.field(inlineProblemExtension, false);
  const lineStartCoords = view.coordsAtPos(line.from);
  const lineEndCoords = view.coordsAtPos(line.to);
  const diagnosticCoords = view.coordsAtPos(from);
  const contentRect = view.contentDOM.getBoundingClientRect();
  const lineLeft = lineStartCoords?.left ?? contentRect.left;
  const lineEndLeft = lineEndCoords?.left ?? lineLeft;
  const diagnosticLeft = diagnosticCoords?.left ?? lineLeft;

  const isSameWidget =
    current != null &&
    current.lineStart === line.from &&
    current.lineEnd === line.to &&
    current.message === spec.message;

  view.dispatch({
    effects: showInlineProblem.of(
      isSameWidget
        ? null
        : {
            ...spec,
            lineStart: line.from,
            lineEnd: line.to,
            column: from - line.from,
            pointerLeftPx: Math.max(0, diagnosticLeft - lineEndLeft),
            maxWidthPx: Math.max(240, contentRect.right - lineEndLeft),
          },
    ),
  });
}
