import type { Action } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";
import { mount, unmount } from "svelte";
import type { LapisLintDiagnosticMeta } from "./lapis-lint-diagnostic-helpers";
import LapisLintTooltip from "./lapis-lint-tooltip.svelte";

export interface MountLintMessageDomOptions {
  view?: EditorView;
  from?: number;
  to?: number;
  actions?: Action[];
}

function observeUnmountWhenDetached(
  host: HTMLElement,
  destroy: () => void,
  targetDocument: Document,
): void {
  if (typeof MutationObserver === "undefined" || !targetDocument.body) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (host.isConnected) {
      return;
    }
    observer.disconnect();
    destroy();
  });

  observer.observe(targetDocument.body, { childList: true, subtree: true });
}

function ruleLabel(meta: LapisLintDiagnosticMeta): string | undefined {
  const label = meta.ruleId ?? meta.code;
  return label == null ? undefined : String(label);
}

/**
 * Mount the Lapis lint tooltip Svelte component into a container for CodeMirror
 * `renderMessage`. Unmounts when the tooltip node is removed from the
 * document.
 */
export function mountLintMessageDom(
  message: string,
  meta: LapisLintDiagnosticMeta = {},
  includeCopy = true,
  options: MountLintMessageDomOptions = {},
): HTMLElement {
  const { view, from, to, actions = [] } = options;
  const targetDocument = view?.dom?.ownerDocument ?? document;
  const root = targetDocument.createElement("div");

  const label = ruleLabel(meta);
  const href = meta.ruleUrl;
  const showRule = label != null && href != null;

  const tooltipActions =
    actions.length > 0 && view != null && from != null && to != null
      ? actions.map((action) => ({
          name: action.name,
          onClick: (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            action.apply(view, from, to);
          },
        }))
      : [];

  const component = mount(LapisLintTooltip, {
    target: root,
    props: {
      message,
      ruleId: showRule ? label : undefined,
      ruleUrl: showRule ? href : undefined,
      sourceLabel: meta.sourceLabel,
      includeCopy,
      actions: tooltipActions,
    },
  });

  observeUnmountWhenDetached(root, () => unmount(component), targetDocument);
  return root;
}
