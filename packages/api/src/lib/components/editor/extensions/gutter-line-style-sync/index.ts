import type { Extension } from "@codemirror/state";
import {
  EditorView,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

type VisibleLineStyle = {
  top: number;
  bottom: number;
  lineHeight: string;
  paddingTop: string;
};

function collectVisibleLineStyles(view: EditorView): VisibleLineStyle[] {
  return Array.from(
    view.dom.querySelectorAll<HTMLElement>(".cm-content .cm-line"),
    (line) => {
      const style = getComputedStyle(line);
      const rect = line.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        lineHeight: style.lineHeight,
        paddingTop: style.paddingTop,
      };
    },
  );
}

type MeasuredGutterElement = {
  element: HTMLElement;
  top: number;
  bottom: number;
};

function collectGutterColumns(view: EditorView): MeasuredGutterElement[][] {
  return Array.from(
    view.dom.querySelectorAll<HTMLElement>(".cm-gutters .cm-gutter"),
    (gutter) =>
      Array.from(
        gutter.querySelectorAll<HTMLElement>(".cm-gutterElement"),
        (element) => {
          const rect = element.getBoundingClientRect();
          return {
            element,
            top: rect.top,
            bottom: rect.bottom,
          };
        },
      ),
  );
}

function mutationMayAffectGutters(mutation: MutationRecord): boolean {
  if (mutation.type === "attributes") {
    return mutation.attributeName === "class";
  }

  return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
}

function findMatchingLineStyle(
  gutterElement: MeasuredGutterElement,
  lineStyles: VisibleLineStyle[],
): VisibleLineStyle | null {
  let bestMatch: VisibleLineStyle | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const lineStyle of lineStyles) {
    const overlaps =
      gutterElement.top < lineStyle.bottom &&
      gutterElement.bottom > lineStyle.top;
    if (overlaps) {
      return lineStyle;
    }

    const distance = Math.abs(gutterElement.top - lineStyle.top);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = lineStyle;
    }
  }

  return bestMatch;
}

class GutterLineStyleSyncPlugin implements PluginValue {
  private readonly mutationObserver: MutationObserver;

  private readonly resizeObserver: ResizeObserver;

  private syncScheduled = false;

  constructor(private readonly view: EditorView) {
    this.mutationObserver = new MutationObserver((mutations) => {
      if (mutations.some(mutationMayAffectGutters)) {
        this.scheduleSync();
      }
    });

    this.mutationObserver.observe(this.view.dom, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleSync();
    });
    this.resizeObserver.observe(this.view.dom);
    this.resizeObserver.observe(this.view.contentDOM);

    this.scheduleSync();
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged || update.geometryChanged) {
      this.scheduleSync();
    }
  }

  destroy(): void {
    this.mutationObserver.disconnect();
    this.resizeObserver.disconnect();
  }

  private scheduleSync() {
    if (this.syncScheduled) {
      return;
    }

    this.syncScheduled = true;
    this.view.requestMeasure({
      read: (view) => ({
        lineStyles: collectVisibleLineStyles(view),
        gutterColumns: collectGutterColumns(view),
      }),
      write: ({ lineStyles, gutterColumns }) => {
        this.syncScheduled = false;
        this.applyLineStyles(lineStyles, gutterColumns);
      },
    });
  }

  private applyLineStyles(
    lineStyles: VisibleLineStyle[],
    gutterColumns: MeasuredGutterElement[][],
  ) {
    for (const gutterElements of gutterColumns) {
      for (const gutterElement of gutterElements) {
        const lineStyle = findMatchingLineStyle(gutterElement, lineStyles);

        if (!lineStyle) {
          gutterElement.element.style.removeProperty("line-height");
          gutterElement.element.style.removeProperty("padding-top");
          continue;
        }

        if (gutterElement.element.style.lineHeight !== lineStyle.lineHeight) {
          gutterElement.element.style.lineHeight = lineStyle.lineHeight;
        }

        if (gutterElement.element.style.paddingTop !== lineStyle.paddingTop) {
          gutterElement.element.style.paddingTop = lineStyle.paddingTop;
        }
      }
    }
  }
}

export function gutterLineStyleSyncExtension(): Extension {
  return ViewPlugin.fromClass(GutterLineStyleSyncPlugin);
}
