import ConfirmDialog from "@lapis-notes/ui/confirm-dialog";
import type { ButtonVariant } from "@lapis-notes/ui/button";
import { mountComponent } from "$lib/hooks/mountComponent.svelte";
import { dialogPortalPropsForDocument } from "./dialog-portal";

export interface PromptConfirmOptions {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
}

export function promptConfirm(
  hostDocument: Document,
  options: PromptConfirmOptions,
): Promise<boolean> {
  return new Promise((resolve) => {
    const container = hostDocument.createElement("div");
    hostDocument.body.appendChild(container);

    let settled = false;
    const settle = (confirmed: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      mounted.destroy();
      container.remove();
      resolve(confirmed);
    };

    const mounted = mountComponent(ConfirmDialog, {
      target: container,
      props: {
        open: true,
        title: options.title ?? "Confirm",
        description: options.description,
        confirmLabel: options.confirmLabel ?? "Continue",
        cancelLabel: options.cancelLabel ?? "Cancel",
        confirmVariant: options.confirmVariant ?? "default",
        portalProps: dialogPortalPropsForDocument(hostDocument),
        onConfirm: () => settle(true),
        onCancel: () => settle(false),
      },
    });
  });
}
