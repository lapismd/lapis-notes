<script lang="ts">
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import RotateCw from "@lucide/svelte/icons/rotate-cw";
  import Settings from "@lucide/svelte/icons/settings";
  import * as Badge from "@lapismd/design-core/shadcn/badge";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Switch from "@lapismd/design-core/shadcn/switch";

  let {
    pluginId,
    name,
    description,
    version,
    provenance,
    status,
    error,
    enabled,
    required = false,
    restartRequired = false,
    expanded = $bindable(false),
    hasOptions = false,
    diagnostics = [],
    onOptions,
    onRestart,
    onToggle,
  }: {
    pluginId: string;
    name: string;
    description?: string;
    version?: string;
    provenance?: string;
    status?: string;
    error?: string;
    enabled: boolean;
    required?: boolean;
    restartRequired?: boolean;
    expanded?: boolean;
    hasOptions?: boolean;
    diagnostics?: readonly { label: string; value: string }[];
    onOptions?(): void;
    onRestart?(): void | Promise<void>;
    onToggle?(enabled: boolean): void | Promise<void>;
  } = $props();

  let busy = $state(false);

  async function toggle(next: boolean): Promise<void> {
    if (!onToggle || busy || required) return;
    busy = true;
    try {
      await onToggle(next);
    } finally {
      busy = false;
    }
  }

  async function restart(): Promise<void> {
    if (!onRestart || busy) return;
    busy = true;
    try {
      await onRestart();
    } finally {
      busy = false;
    }
  }
</script>

<Collapsible.Root bind:open={expanded}>
  <article
    class="lapis-plugin-settings-row"
    data-ui-component="lapis-plugin-settings-row"
    data-settings-plugin-id={pluginId}
    data-settings-search-target="plugin-row"
  >
    <Collapsible.Trigger
      class="lapis-plugin-settings-row__disclosure"
      aria-label={`${expanded ? "Collapse" : "Expand"} ${name} details`}
    >
      <ChevronRight class="lapis-plugin-management__icon" aria-hidden="true" />
    </Collapsible.Trigger>

    <div class="lapis-plugin-settings-row__content">
      <div class="lapis-plugin-settings-row__title-line">
        <h2>{name}</h2>
        {#if required}<Badge.Badge variant="outline">Required</Badge.Badge>{/if}
        {#if restartRequired}
          <Badge.Badge variant="outline">Restart required</Badge.Badge>
        {/if}
      </div>
      {#if description}
        <p class="lapis-plugin-settings-row__description">{description}</p>
      {/if}
      <div class="lapis-plugin-settings-row__summary">
        <span>ID {pluginId}</span>
        {#if version}<span>Version {version}</span>{/if}
        {#if provenance}<span>{provenance}</span>{/if}
        {#if status}<span>{status}</span>{/if}
      </div>
    </div>

    <div class="lapis-plugin-settings-row__actions">
      {#if hasOptions && onOptions}
        <Button.Root
          variant="ghost"
          size="icon"
          aria-label={`Options for ${name}`}
          title="Options"
          onclick={onOptions}
        >
          <Settings class="lapis-plugin-management__icon" />
        </Button.Root>
      {/if}
      {#if onRestart}
        <Button.Root
          variant="ghost"
          size="icon"
          aria-label={`Restart ${name}`}
          title="Restart"
          disabled={busy}
          onclick={() => void restart()}
        >
          <RotateCw class="lapis-plugin-management__icon" />
        </Button.Root>
      {/if}
      <Switch.Root
        checked={enabled}
        disabled={required || busy || !onToggle}
        aria-label={`${enabled ? "Disable" : "Enable"} ${name}`}
        onCheckedChange={(checked) => void toggle(checked)}
      />
    </div>

    <Collapsible.Content class="lapis-plugin-settings-row__details">
      {#if error}
        <p class="lapis-plugin-settings-row__error">{error}</p>
      {/if}
      {#if diagnostics.length}
        <dl>
          {#each diagnostics as diagnostic}
            <div>
              <dt>{diagnostic.label}</dt>
              <dd>{diagnostic.value}</dd>
            </div>
          {/each}
        </dl>
      {:else if !error}
        <p>No additional diagnostics reported.</p>
      {/if}
    </Collapsible.Content>
  </article>
</Collapsible.Root>
