<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { Input } from "@lapismd/design-core/shadcn/input";

  let {
    open = true,
    targetLabel,
    targetValue,
    titlePlaceholder,
    targetEditable = false,
    portalProps,
    onCancel,
    onConfirm,
  }: {
    open?: boolean;
    targetLabel: string;
    targetValue: string;
    titlePlaceholder: string;
    targetEditable?: boolean;
    portalProps: { to: HTMLElement };
    onCancel: () => void;
    onConfirm: (title: string, targetValue: string) => void;
  } = $props();

  let title = $state("");
  let editedTarget = $state("");

  function submit(): void {
    const nextTarget = (targetEditable ? editedTarget : targetValue).trim();
    if (targetEditable && !nextTarget) return;
    onConfirm(title.trim(), nextTarget);
  }
</script>

<Dialog.Root
  {open}
  onOpenChange={(next) => {
    if (!next) onCancel();
  }}
>
  <Dialog.Content {portalProps} class="bookmarks-add-dialog">
    <Dialog.Header>
      <Dialog.Title>Add bookmark</Dialog.Title>
      <Dialog.Description>
        Optional title defaults to the {targetLabel.toLowerCase()}.
      </Dialog.Description>
    </Dialog.Header>
    <div class="bookmarks-add-dialog__fields">
      <label class="bookmarks-add-dialog__field">
        <span>{targetLabel}</span>
        {#if targetEditable}
          <Input bind:value={editedTarget} placeholder={titlePlaceholder} />
        {:else}
          <Input value={targetValue} readonly />
        {/if}
      </label>
      <label class="bookmarks-add-dialog__field">
        <span>Title</span>
        <Input bind:value={title} placeholder={titlePlaceholder} />
      </label>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={onCancel}>Cancel</Button>
      <Button onclick={submit}>Continue</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  .bookmarks-add-dialog__fields {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .bookmarks-add-dialog__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.75rem;
  }
</style>
