import type { Diagnostic } from "@codemirror/lint";
import { forEachDiagnostic } from "@codemirror/lint";
import { type Extension } from "@codemirror/state";
import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import {
  getLapisLintTooltipPayload,
  type LapisLintTooltipPayload,
} from "./lapis-lint-diagnostic";
import { showInlineProblem } from "./lapis-lint-inline-widget";
import { mountLintMessageDom } from "./mount-lint-tooltip";

type FoundDiagnostic = {
  diagnostic: Diagnostic;
  from: number;
  to: number;
  payload: LapisLintTooltipPayload;
  anchor?: RectLike;
};

const TOOLTIP_GAP_PX = 6;
const TOOLTIP_VIEWPORT_MARGIN_PX = 12;
const TOOLTIP_HIDE_DELAY_MS = 350;
const TOOLTIP_HANDOFF_MARGIN_PX = 10;

type RectLike = Pick<DOMRect, "left" | "right" | "top" | "bottom">;
type PointLike = { x: number; y: number };

export function pointerWithinLintTooltipHandoff(
  point: PointLike,
  trigger: RectLike,
  tooltip: RectLike,
  margin = TOOLTIP_HANDOFF_MARGIN_PX,
): boolean {
  const left = Math.min(trigger.left, tooltip.left) - margin;
  const right = Math.max(trigger.right, tooltip.right) + margin;
  const top = Math.min(trigger.top, tooltip.top) - margin;
  const bottom = Math.max(trigger.bottom, tooltip.bottom) + margin;
  return (
    point.x >= left && point.x <= right && point.y >= top && point.y <= bottom
  );
}

export function lapisLintHoverTooltip(): Extension[] {
  return [lapisLintTooltipPlugin];
}

const lapisLintTooltipPlugin = ViewPlugin.fromClass(
  class {
    private tooltip: HTMLElement | null = null;
    private activeDiagnostic: FoundDiagnostic | null = null;
    private hideTimer: ReturnType<typeof setTimeout> | null = null;

    private readonly handleMouseMove = (event: MouseEvent) => {
      this.withEditorLayout(() => {
        if (eventTargetIsInsideLapisTooltip(event.target)) {
          this.cancelScheduledHide();
          return;
        }

        const found =
          lintMarkerFromEvent(event) != null
            ? findDiagnosticNearPointer(this.view, event)
            : findDiagnosticFromLintRange(this.view, event);

        if (found && this.isActiveDiagnostic(found)) {
          this.cancelScheduledHide();
          return;
        }
        if (this.isPointerInHandoff(event)) {
          this.cancelScheduledHide();
          return;
        }
        if (!found) {
          this.scheduleHideTooltip();
          return;
        }
        this.showTooltip(found);
      });
    };

    private readonly handleClick = (event: MouseEvent) => {
      this.withEditorLayout(() => {
        const marker = lintMarkerFromEvent(event);
        if (!marker) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const found = findDiagnosticNearPointer(this.view, event);
        if (found) {
          this.showTooltip(found);
        }
      });
    };

    private readonly handleMouseLeave = (event: MouseEvent) => {
      this.withEditorLayout(() => {
        if (eventTargetIsInsideLapisTooltip(event.relatedTarget)) {
          return;
        }
        if (this.isPointerInHandoff(event)) {
          this.cancelScheduledHide();
        } else {
          this.scheduleHideTooltip();
        }
      });
    };

    private readonly handleDocumentMouseMove = (event: MouseEvent) => {
      this.withEditorLayout(() => {
        if (
          eventTargetIsInsideLapisTooltip(event.target) ||
          eventTargetIsInside(this.view.dom, event.target)
        ) {
          return;
        }
        if (this.isPointerInHandoff(event)) {
          this.cancelScheduledHide();
        } else {
          this.scheduleHideTooltip();
        }
      });
    };

    private readonly handleTooltipMouseEnter = () => {
      this.cancelScheduledHide();
    };

    private readonly handleTooltipMouseLeave = (event: MouseEvent) => {
      this.withEditorLayout(() => {
        if (
          eventTargetIsInside(this.view.dom, event.relatedTarget) ||
          this.isPointerInHandoff(event)
        ) {
          this.cancelScheduledHide();
        } else {
          this.scheduleHideTooltip();
        }
      });
    };

    private get viewDocument(): Document {
      return this.view.dom.ownerDocument;
    }

    private get viewWindow(): Window {
      return this.viewDocument.defaultView ?? window;
    }

    constructor(readonly view: EditorView) {
      view.dom.addEventListener("mousemove", this.handleMouseMove);
      view.dom.addEventListener("mouseover", this.handleMouseMove);
      view.dom.addEventListener("click", this.handleClick);
      view.dom.addEventListener("mouseleave", this.handleMouseLeave);
      this.viewDocument.addEventListener(
        "mousemove",
        this.handleDocumentMouseMove,
      );
    }

    update(update: ViewUpdate) {
      if (
        update.transactions.some((transaction) =>
          transaction.effects.some((effect) => effect.is(showInlineProblem)),
        )
      ) {
        this.hideTooltip();
      }
      if (this.activeDiagnostic && update.docChanged) {
        const from = update.changes.mapPos(this.activeDiagnostic.from, 1);
        const to = update.changes.mapPos(this.activeDiagnostic.to, -1);
        if (from > to || from > update.state.doc.length) {
          this.hideTooltip();
        } else {
          this.activeDiagnostic = { ...this.activeDiagnostic, from, to };
        }
      }
      if (!this.tooltip || !this.activeDiagnostic) {
        return;
      }
      if (
        update.docChanged ||
        update.geometryChanged ||
        update.viewportChanged
      ) {
        this.schedulePositionTooltip();
      }
    }

    destroy() {
      this.view.dom.removeEventListener("mousemove", this.handleMouseMove);
      this.view.dom.removeEventListener("mouseover", this.handleMouseMove);
      this.view.dom.removeEventListener("click", this.handleClick);
      this.view.dom.removeEventListener("mouseleave", this.handleMouseLeave);
      this.viewDocument.removeEventListener(
        "mousemove",
        this.handleDocumentMouseMove,
      );
      this.hideTooltip();
    }

    private showTooltip(found: FoundDiagnostic): void {
      this.cancelScheduledHide();
      if (this.isActiveDiagnostic(found)) {
        return;
      }

      this.hideTooltip();
      this.activeDiagnostic = found;
      this.tooltip = mountLintTooltipForDiagnostic(this.view, found, () =>
        this.hideTooltip(),
      );
      this.tooltip.addEventListener("mouseenter", this.handleTooltipMouseEnter);
      this.tooltip.addEventListener("mouseleave", this.handleTooltipMouseLeave);
      this.tooltip.style.position = "fixed";
      this.tooltip.style.zIndex = "500";
      this.tooltip.style.top = "-10000px";
      this.tooltip.style.left = "0";
      this.viewDocument.body?.appendChild(this.tooltip);
      this.schedulePositionTooltip();
    }

    private scheduleHideTooltip(): void {
      if (!this.tooltip || this.hideTimer) {
        return;
      }
      this.hideTimer = setTimeout(() => {
        this.hideTimer = null;
        this.hideTooltip();
      }, TOOLTIP_HIDE_DELAY_MS);
    }

    private cancelScheduledHide(): void {
      if (!this.hideTimer) {
        return;
      }
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    private hideTooltip(): void {
      this.cancelScheduledHide();
      this.tooltip?.removeEventListener(
        "mouseenter",
        this.handleTooltipMouseEnter,
      );
      this.tooltip?.removeEventListener(
        "mouseleave",
        this.handleTooltipMouseLeave,
      );
      this.tooltip?.remove();
      this.tooltip = null;
      this.activeDiagnostic = null;
    }

    private isActiveDiagnostic(found: FoundDiagnostic): boolean {
      return Boolean(
        this.activeDiagnostic &&
          this.activeDiagnostic.diagnostic === found.diagnostic &&
          this.activeDiagnostic.from === found.from &&
          this.activeDiagnostic.to === found.to,
      );
    }

    private isPointerInHandoff(event: MouseEvent): boolean {
      const tooltip = this.tooltip;
      const diagnostic = this.activeDiagnostic;
      if (!tooltip || !diagnostic) {
        return false;
      }
      const trigger = this.diagnosticRect(diagnostic);
      if (!trigger) {
        return false;
      }
      return pointerWithinLintTooltipHandoff(
        { x: event.clientX, y: event.clientY },
        trigger,
        tooltip.getBoundingClientRect(),
      );
    }

    private diagnosticRect(found: FoundDiagnostic): RectLike | null {
      const start = this.view.coordsAtPos(found.from);
      const end = this.view.coordsAtPos(Math.max(found.from, found.to));
      if (!start || !end) {
        return found.anchor ?? null;
      }
      return {
        left: Math.min(start.left, end.left, found.anchor?.left ?? Infinity),
        right: Math.max(
          start.right,
          end.right,
          start.left + 1,
          found.anchor?.right ?? -Infinity,
        ),
        top: Math.min(start.top, end.top, found.anchor?.top ?? Infinity),
        bottom: Math.max(
          start.bottom,
          end.bottom,
          found.anchor?.bottom ?? -Infinity,
        ),
      };
    }

    private withEditorLayout(run: () => void): void {
      try {
        run();
      } catch (error) {
        if (!isEditorLayoutReadError(error)) {
          throw error;
        }
      }
    }

    private schedulePositionTooltip(): void {
      this.view.requestMeasure({
        key: this,
        read: (view) => {
          const found = this.activeDiagnostic;
          const tooltip = this.tooltip;
          if (!found || !tooltip) {
            return null;
          }
          return {
            coords: view.coordsAtPos(found.from) ?? found.anchor ?? null,
            tooltipRect: tooltip.getBoundingClientRect(),
          };
        },
        write: (measure) => {
          if (!this.tooltip) {
            return;
          }
          if (!measure?.coords) {
            this.hideTooltip();
            return;
          }
          this.applyTooltipPosition(measure.coords, measure.tooltipRect);
        },
      });
    }

    private applyTooltipPosition(
      coords: RectLike,
      tooltipRect: Pick<DOMRect, "width" | "height">,
    ): void {
      const tooltip = this.tooltip;
      if (!tooltip) {
        return;
      }

      const maxLeft =
        this.viewWindow.innerWidth -
        tooltipRect.width -
        TOOLTIP_VIEWPORT_MARGIN_PX;
      const left = Math.max(
        TOOLTIP_VIEWPORT_MARGIN_PX,
        Math.min(coords.left, maxLeft),
      );
      const top =
        coords.top - tooltipRect.height - TOOLTIP_GAP_PX >
        TOOLTIP_VIEWPORT_MARGIN_PX
          ? coords.top - tooltipRect.height - TOOLTIP_GAP_PX
          : coords.bottom + TOOLTIP_GAP_PX;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    }
  },
);

function isEditorLayoutReadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes(
      "Reading the editor layout isn't allowed during an update",
    )
  );
}

function findDiagnosticAt(
  view: EditorView,
  pos: number,
  side: -1 | 0 | 1,
): FoundDiagnostic | null {
  let found: FoundDiagnostic | null = null;

  forEachDiagnostic(view.state, (diagnostic, from, to) => {
    if (found) {
      return;
    }

    const start = from - (side < 0 ? 1 : 0);
    const end = to + (side > 0 ? 1 : 0);
    const covers =
      from === to ? pos === from : pos >= start && pos <= Math.max(start, end);
    if (!covers) {
      return;
    }

    const payload = getLapisLintTooltipPayload(diagnostic);
    if (!payload) {
      return;
    }

    found = {
      diagnostic,
      from,
      to,
      payload,
    };
  });

  return found;
}

function mountLintTooltipForDiagnostic(
  view: EditorView,
  found: FoundDiagnostic,
  onAction: () => void,
): HTMLElement {
  const dom = mountLintMessageDom(
    found.diagnostic.message,
    found.payload.meta,
    found.payload.includeCopy,
    {
      view,
      from: found.from,
      to: found.to,
      actions: found.payload.actions,
      onAction,
    },
  );
  dom.classList.add("cm-lapis-tooltip");
  return dom;
}

function lintMarkerFromEvent(event: MouseEvent): Element | null {
  return closestEventTarget(event.target, ".cm-lint-marker");
}

function eventTargetIsInsideLapisTooltip(target: EventTarget | null): boolean {
  return Boolean(
    closestEventTarget(target, ".cm-lapis-tooltip") ||
      closestEventTarget(target, "[data-lint-quick-fix-menu]"),
  );
}

function closestEventTarget(
  target: EventTarget | null,
  selector: string,
): Element | null {
  if (!target || typeof (target as Element).closest !== "function") {
    return null;
  }
  return (target as Element).closest(selector);
}

function eventTargetIsInside(
  container: HTMLElement,
  target: EventTarget | null,
): boolean {
  return Boolean(
    target &&
      typeof (target as Node).nodeType === "number" &&
      container.contains(target as Node),
  );
}

function findDiagnosticFromLintRange(
  view: EditorView,
  event: MouseEvent,
): FoundDiagnostic | null {
  const range = closestEventTarget(event.target, ".cm-lintRange");
  if (!range) {
    return null;
  }
  try {
    const from = view.posAtDOM(range, 0);
    const to = view.posAtDOM(range, range.childNodes.length);
    const found =
      findDiagnosticAt(view, from, 1) ?? findDiagnosticAt(view, to, -1);
    return found ? { ...found, anchor: range.getBoundingClientRect() } : null;
  } catch {
    return null;
  }
}

function findDiagnosticNearPointer(
  view: EditorView,
  event: MouseEvent,
): FoundDiagnostic | null {
  const contentRect = view.contentDOM.getBoundingClientRect();
  const pos = view.posAtCoords(
    {
      x: contentRect.left + 1,
      y: event.clientY,
    },
    false,
  );
  const line = view.state.doc.lineAt(pos);
  let found: FoundDiagnostic | null = null;

  forEachDiagnostic(view.state, (diagnostic, from, to) => {
    if (found || to < line.from || from > line.to) {
      return;
    }
    const payload = getLapisLintTooltipPayload(diagnostic);
    if (!payload) {
      return;
    }
    found = {
      diagnostic,
      from,
      to,
      payload,
      anchor: lintMarkerFromEvent(event)?.getBoundingClientRect(),
    };
  });

  return found;
}
