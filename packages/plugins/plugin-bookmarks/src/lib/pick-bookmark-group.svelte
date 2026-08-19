<script lang="ts">
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";

  let {
    open = true,
    groups,
    portalProps,
    onCancel,
    onSelect,
  }: {
    open?: boolean;
    groups: Array<{ ctime: number | null; label: string; description?: string }>;
    portalProps: { to: HTMLElement };
    onCancel: () => void;
    onSelect: (ctime: number | null, createTitle?: string) => void;
  } = $props();

  let query = $state("");

  const trimmed = $derived(query.trim());
  const filtered = $derived.by(() => {
    if (!trimmed) return groups;
    const needle = trimmed.toLocaleLowerCase();
    return groups.filter((group) =>
      `${group.label} ${group.description ?? ""}`
        .toLocaleLowerCase()
        .includes(needle),
    );
  });
  const createCandidate = $derived.by(() => {
    if (!trimmed) return null;
    const exists = groups.some(
      (group) => group.label.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
    );
    return exists ? null : trimmed;
  });
</script>

<Dialog.Root
  {open}
  onOpenChange={(next) => {
    if (!next) onCancel();
  }}
>
  <Dialog.Content {portalProps} class="bookmarks-group-picker" showCloseButton={false}>
    <Dialog.Header class="sr-only">
      <Dialog.Title>Bookmark group</Dialog.Title>
      <Dialog.Description>Choose an existing group or create one</Dialog.Description>
    </Dialog.Header>
    <CommandView.Root shouldFilter={false}>
      <CommandView.Input
        bind:value={query}
        placeholder="Search bookmark groups…"
      />
      <CommandView.List aria-label="Bookmark groups">
        {#if createCandidate}
          <CommandView.Item
            onSelect={() => onSelect(null, createCandidate)}
          >
            <CommandView.ItemLabel>Create “{createCandidate}”</CommandView.ItemLabel>
          </CommandView.Item>
        {/if}
        {#each filtered as group (String(group.ctime) + group.label)}
          <CommandView.Item onSelect={() => onSelect(group.ctime)}>
            <CommandView.ItemLabel>{group.label}</CommandView.ItemLabel>
            {#if group.description}
              <CommandView.ItemDescription>{group.description}</CommandView.ItemDescription>
            {/if}
          </CommandView.Item>
        {/each}
        <CommandView.Empty>No bookmark groups</CommandView.Empty>
      </CommandView.List>
    </CommandView.Root>
  </Dialog.Content>
</Dialog.Root>
