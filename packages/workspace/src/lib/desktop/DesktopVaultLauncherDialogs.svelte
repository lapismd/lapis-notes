<script lang="ts">
  import Search from "@lucide/svelte/icons/search";
  import type { VaultProfile } from "@lapis-notes/api";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as Input from "@lapismd/design-core/shadcn/input";
  import { desktopAppearanceOptions } from "./desktop-vault-launcher";
  import type { DesktopVaultLauncherState } from "./desktop-vault-launcher.svelte";
  let {
    model,
    onOpenRecent,
  }: {
    model: DesktopVaultLauncherState;
    onOpenRecent(profile: VaultProfile): Promise<void>;
  } = $props();
  $effect(() => {
    if (!model.recentVaultDialogOpen) model.recentVaultQuery = "";
  });
  $effect(() => {
    if (!model.renameDialogOpen) {
      model.renameTarget = null;
      model.renameDialogName = "";
    }
  });
</script>

<Dialog.Root bind:open={model.settingsOpen}>
  <Dialog.Content class="desktop-launcher__settings">
    <Dialog.Header>
      <Dialog.Title>Desktop Settings</Dialog.Title>
      <Dialog.Description
        >Choose how the vault chooser follows light and dark mode.</Dialog.Description
      >
    </Dialog.Header>
    <div class="desktop-launcher__options">
      {#each desktopAppearanceOptions as option (option.value)}
        <Button.Root
          variant={model.appearanceMode === option.value
            ? "default"
            : "outline"}
          class={`desktop-launcher__option${model.appearanceMode === option.value ? "" : " desktop-launcher__outline"}`}
          onclick={() => void model.updateAppearance(option.value)}
        >
          <span class="desktop-launcher__option-copy">
            <span class="desktop-launcher__label">{option.label}</span>
            <span class="desktop-launcher__hint">{option.description}</span>
          </span>
        </Button.Root>
      {/each}
    </div>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={model.recentVaultDialogOpen}>
  <Dialog.Content class="desktop-launcher__command" showCloseButton={false}>
    <Dialog.Header class="sr-only">
      <Dialog.Title>Recent Projects</Dialog.Title>
      <Dialog.Description>Search and open a recent vault</Dialog.Description>
    </Dialog.Header>
    <CommandView.Root shouldFilter={false} label="Search recent vaults">
      <CommandView.Input
        bind:value={model.recentVaultQuery}
        placeholder="Search recent vaults..."
        aria-label="Search recent vaults"
        autocomplete="off"
        spellcheck="false"
      />
      <CommandView.List aria-label="Recent projects">
        <CommandView.Empty>No matching recent vaults</CommandView.Empty>
        {#if model.filteredRecentVaults.length > 0}
          <CommandView.Group>
            {#each model.filteredRecentVaults as entry (entry.profile.id)}
              <CommandView.Item
                value={`${entry.name} ${entry.location}`}
                onSelect={() =>
                  void model.invoke(() => onOpenRecent(entry.profile))}
              >
                <CommandView.ItemIcon>
                  <Search />
                </CommandView.ItemIcon>
                <CommandView.ItemLabel>{entry.name}</CommandView.ItemLabel>
                <CommandView.ItemDescription>
                  {entry.location}
                </CommandView.ItemDescription>
              </CommandView.Item>
            {/each}
          </CommandView.Group>
        {/if}
      </CommandView.List>
    </CommandView.Root>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={model.renameDialogOpen}>
  <Dialog.Content class="desktop-launcher__rename">
    <Dialog.Header>
      <Dialog.Title>Rename vault</Dialog.Title>
      <Dialog.Description
        >Update the stored vault name used in recent projects and app URLs.</Dialog.Description
      >
    </Dialog.Header>
    <form
      class="desktop-launcher__form"
      onsubmit={(event) => {
        event.preventDefault();
        void model.submitRename();
      }}
    >
      <label class="desktop-launcher__field">
        <span>Name</span>
        <Input.Root
          bind:value={model.renameDialogName}
          autocomplete="off"
          autofocus
        />
      </label>
      <Dialog.Footer>
        <Button.Root
          type="button"
          variant="ghost"
          onclick={() => (model.renameDialogOpen = false)}
        >
          Cancel
        </Button.Root>
        <Button.Root
          type="submit"
          disabled={!model.renameDialogName.trim() ||
            model.activeActionId === model.renameTarget?.id}
        >
          Save
        </Button.Root>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
