import type { EditorView } from "@codemirror/view";

const insetProperty = "--ui-editor-inline-title-inset";

/** Keep the sibling filename aligned with CodeMirror's unindented text column. */
export function syncInlineTitleAlignment(view: EditorView, host: HTMLElement) {
  const sizer = host.parentElement!;
  const key = {};
  let active = true;

  function schedule() {
    if (!active) return;
    view.requestMeasure({
      key,
      read() {
        const bounds = host.getBoundingClientRect();
        const content = view.contentDOM.getBoundingClientRect();
        if (!host.isConnected || bounds.width <= 0 || content.width <= 0) {
          return null;
        }
        const style = view.dom.ownerDocument.defaultView!.getComputedStyle(
          view.contentDOM,
        );
        const rtl = style.direction === "rtl";
        const padding =
          parseFloat(rtl ? style.paddingRight : style.paddingLeft) || 0;
        return Math.max(
          0,
          (rtl ? bounds.right - content.right : content.left - bounds.left) +
            padding,
        );
      },
      write(inset) {
        if (!active || inset === null) return;
        const value = `${inset}px`;
        if (sizer.style.getPropertyValue(insetProperty) !== value) {
          sizer.style.setProperty(insetProperty, value);
        }
      },
    });
  }

  const resize = new ResizeObserver(schedule);
  resize.observe(host);
  resize.observe(view.dom);
  resize.observe(view.contentDOM);
  // Reconfiguration may replace gutter columns or change editor classes without
  // resizing the outer host. Writes land on the sibling sizer, outside this tree.
  const mutation = new MutationObserver(schedule);
  mutation.observe(view.dom, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  const fonts = host.ownerDocument.fonts;
  fonts?.addEventListener("loadingdone", schedule);
  schedule();

  return () => {
    active = false;
    resize.disconnect();
    mutation.disconnect();
    fonts?.removeEventListener("loadingdone", schedule);
    sizer.style.removeProperty(insetProperty);
  };
}
