<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import Check from "@lucide/svelte/icons/check";
  import Package from "@lucide/svelte/icons/package";
  import type { PluginCatalogEntry } from "@lapis-notes/api";
  import RegistryPluginIcon from "./RegistryPluginIcon.svelte";

  export type PluginBulkActionItem = {
    id: string;
    name: string;
    description: string;
    version?: string;
    plugin?: PluginCatalogEntry;
  };

  let {
    open = $bindable(false),
    title,
    description,
    verb,
    items,
    selectedIds = $bindable([]),
    onconfirm,
  }: {
    open?: boolean;
    title: string;
    description: string;
    verb: "Install" | "Update";
    items: readonly PluginBulkActionItem[];
    selectedIds?: string[];
    onconfirm: (ids: readonly string[]) => void | Promise<void>;
  } = $props();

  let submitting = $state(false);
  const selectedCount = $derived(selectedIds.length);

  function toggle(id: string): void {
    selectedIds = selectedIds.includes(id)
      ? selectedIds.filter((candidate) => candidate !== id)
      : [...selectedIds, id];
  }

  async function confirm(): Promise<void> {
    if (!selectedCount || submitting) return;
    submitting = true;
    try {
      await onconfirm(selectedIds);
      open = false;
    } finally {
      submitting = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="plugin-bulk-action-dialog"
    data-ui-component="plugin-bulk-action-dialog"
  >
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
    </Dialog.Header>

    <CommandView.Root label={title}>
      <CommandView.Input
        placeholder="Search plugins…"
        aria-label="Search plugins"
        autocomplete="off"
        spellcheck="false"
      />
      <CommandView.List aria-label={title}>
        <CommandView.Empty>No eligible plugins match.</CommandView.Empty>
        <CommandView.Group heading="Eligible plugins">
          {#each items as item (item.id)}
            {@const selected = selectedIds.includes(item.id)}
            <CommandView.Item
              value={`${item.name} ${item.id} ${item.description}`}
              aria-label={`${item.name}, ${selected ? "selected" : "not selected"}`}
              data-bulk-selected={selected}
              onSelect={() => toggle(item.id)}
            >
              <CommandView.ItemIcon>
                {#if item.plugin}
                  <RegistryPluginIcon plugin={item.plugin} loading="eager" />
                {:else}
                  <span
                    class="plugin-bulk-action-dialog__fallback-icon"
                    data-ui-part="registry-plugin-icon"
                    data-plugin-id={item.id}
                    aria-hidden="true"><Package /></span
                  >
                {/if}
              </CommandView.ItemIcon>
              <CommandView.ItemLabel>{item.name}</CommandView.ItemLabel>
              <CommandView.ItemDescription>
                {item.description}{item.version ? ` · ${item.version}` : ""}
              </CommandView.ItemDescription>
              <CommandView.Shortcut>
                <span
                  class="plugin-bulk-action-dialog__selection-mark"
                  data-selected={selected || undefined}
                  aria-hidden="true"
                  >{#if selected}<Check />{/if}</span
                >
              </CommandView.Shortcut>
            </CommandView.Item>
          {/each}
        </CommandView.Group>
      </CommandView.List>
      <CommandView.Footer>
        <span aria-live="polite">
          {selectedCount} of {items.length} selected
        </span>
        <span class="plugin-bulk-action-dialog__selection-actions">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onclick={() => (selectedIds = items.map((item) => item.id))}
            >Select all</Button
          >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!selectedCount}
            onclick={() => (selectedIds = [])}>Clear</Button
          >
        </span>
      </CommandView.Footer>
    </CommandView.Root>

    <Dialog.Footer>
      <Button type="button" variant="outline" onclick={() => (open = false)}>
        Cancel
      </Button>
      <Button
        type="button"
        disabled={!selectedCount || submitting}
        aria-busy={submitting}
        onclick={() => void confirm()}
      >
        <Check data-icon="inline-start" aria-hidden="true" />
        {submitting
          ? `${verb}ing…`
          : `${verb} ${selectedCount} plugin${selectedCount === 1 ? "" : "s"}`}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  :global(.plugin-bulk-action-dialog) {
    width: min(34rem, calc(100vw - 2rem));
    max-height: min(42rem, calc(100vh - 2rem));
    overflow: hidden;
  }

  :global(
      .plugin-bulk-action-dialog
        [data-ui-component="command-view"][data-ui-part="root"]
    ) {
    --ui-command-view-list-max-height: min(20rem, 42vh);
    border: 1px solid var(--border);
  }

  :global(.plugin-bulk-action-dialog [data-ui-part="item-icon"]) {
    width: 2rem;
    height: 2rem;
  }

  :global(.plugin-bulk-action-dialog [data-ui-part="registry-plugin-icon"]) {
    width: 2rem;
    height: 2rem;
    border-radius: calc(var(--radius) * 0.8);
  }

  :global(
      .plugin-bulk-action-dialog [data-ui-part="registry-plugin-icon"] svg
    ) {
    width: 1rem;
    height: 1rem;
  }

  .plugin-bulk-action-dialog__fallback-icon {
    display: grid;
    width: 2rem;
    height: 2rem;
    place-items: center;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) * 0.8);
    color: var(--muted-foreground);
    background: var(--muted);
  }

  .plugin-bulk-action-dialog__selection-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-inline-start: auto;
  }

  .plugin-bulk-action-dialog__selection-mark {
    display: grid;
    width: 1rem;
    height: 1rem;
    place-items: center;
    border: 0;
    border-radius: calc(var(--radius) * 0.45);
    color: var(--primary-foreground);
    background: var(--background);
  }

  .plugin-bulk-action-dialog__selection-mark[data-selected] {
    background: var(--primary);
  }

  .plugin-bulk-action-dialog__selection-mark :global(svg) {
    width: 0.75rem;
    height: 0.75rem;
  }
</style>
