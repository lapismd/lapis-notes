<script lang="ts">
  import {
    Button,
    type ButtonVariant,
  } from "@lapismd/design-core/shadcn/button";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import "./confirm-dialog.css";

  let {
    open = $bindable(false),
    title = "Confirm",
    description = "",
    confirmLabel = "Continue",
    cancelLabel = "Cancel",
    confirmVariant = "default" as ButtonVariant,
    class: className,
    portalProps,
    onConfirm,
    onCancel,
  }: {
    open?: boolean;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: ButtonVariant;
    class?: string;
    portalProps?: DialogPrimitive.PortalProps;
    onConfirm?: () => void;
    onCancel?: () => void;
  } = $props();

  let confirming = $state(false);
  let opened = $state(false);

  function handleOpenChange(nextOpen: boolean): void {
    if (nextOpen) {
      opened = true;
      open = true;
      return;
    }

    if (!opened) {
      open = false;
      return;
    }

    if (confirming) {
      confirming = false;
      open = false;
      return;
    }

    open = false;
    onCancel?.();
  }

  function handleCancel(): void {
    open = false;
    onCancel?.();
  }

  function handleConfirm(): void {
    confirming = true;
    onConfirm?.();
    open = false;
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content
    class={cn(className)}
    {portalProps}
    data-ui-confirm-dialog=""
  >
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
      {#if description}
        <Dialog.Description>{description}</Dialog.Description>
      {/if}
    </Dialog.Header>

    <Dialog.Footer>
      <Button onclick={handleCancel} type="button" variant="outline">
        {cancelLabel}
      </Button>
      <Button onclick={handleConfirm} type="button" variant={confirmVariant}>
        {confirmLabel}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
