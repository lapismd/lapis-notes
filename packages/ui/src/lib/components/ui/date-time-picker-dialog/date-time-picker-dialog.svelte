<script lang="ts">
  import { Button } from "@lapis-notes/ui/button";
  import * as Dialog from "@lapis-notes/ui/dialog";
  import { Input } from "@lapis-notes/ui/input";
  import { cn } from "$lib/utils";

  let {
    open = $bindable(false),
    value = $bindable(""),
    title = "Pick date & time",
    description = "Choose a date and time.",
    confirmLabel = "Apply",
    cancelLabel = "Cancel",
    clearLabel = "Clear",
    clearable = true,
    min,
    max,
    class: className,
    onConfirm,
    onClear,
  }: {
    open?: boolean;
    value?: string;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    clearLabel?: string;
    clearable?: boolean;
    min?: string;
    max?: string;
    class?: string;
    onConfirm?: (value: string | null) => void;
    onClear?: () => void;
  } = $props();

  let draftValue = $state(value);

  $effect(() => {
    if (open) {
      draftValue = value;
    }
  });

  function handleOpenChange(nextOpen: boolean): void {
    if (nextOpen) {
      draftValue = value;
    }
    open = nextOpen;
  }

  function handleCancel(): void {
    open = false;
  }

  function handleConfirm(): void {
    value = draftValue;
    onConfirm?.(draftValue.trim() ? draftValue : null);
    open = false;
  }

  function handleClear(): void {
    draftValue = "";
    value = "";
    onClear?.();
    open = false;
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class={cn("sm:max-w-md", className)}>
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
    </Dialog.Header>

    <form
      class="flex flex-col gap-4 pt-2"
      onsubmit={(event) => {
        event.preventDefault();
        handleConfirm();
      }}
    >
      <Input bind:value={draftValue} {max} {min} type="datetime-local" />

      <Dialog.Footer class="items-center gap-2 sm:justify-between">
        {#if clearable}
          <Button onclick={handleClear} type="button" variant="ghost"
            >{clearLabel}</Button
          >
        {/if}

        <div class="flex items-center gap-2">
          <Button onclick={handleCancel} type="button" variant="outline"
            >{cancelLabel}</Button
          >
          <Button type="submit">{confirmLabel}</Button>
        </div>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
