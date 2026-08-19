const NO_DRAG = '[data-desktop-drag-region="false"]';
const DRAG =
  '[data-desktop-drag-region]:not([data-desktop-drag-region="false"])';

export function isDesktopDragEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest(NO_DRAG)) return false;
  return Boolean(target.closest(DRAG));
}

export function installDesktopWindowDrag(
  invoke: (command: string, payload?: Record<string, unknown>) => Promise<unknown>,
): () => void {
  let dragging = false;

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !isDesktopDragEventTarget(event.target)) return;
    dragging = true;
    event.preventDefault();
    document.documentElement.setPointerCapture?.(event.pointerId);
    void invoke("desktop_window_drag_begin", {
      screenX: event.screenX,
      screenY: event.screenY,
    });
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return;
    void invoke("desktop_window_drag_move", {
      screenX: event.screenX,
      screenY: event.screenY,
    });
  };

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    void invoke("desktop_window_drag_end");
  };

  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointermove", onPointerMove, true);
  document.addEventListener("pointerup", endDrag, true);
  document.addEventListener("pointercancel", endDrag, true);
  return () => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", endDrag, true);
    document.removeEventListener("pointercancel", endDrag, true);
  };
}
