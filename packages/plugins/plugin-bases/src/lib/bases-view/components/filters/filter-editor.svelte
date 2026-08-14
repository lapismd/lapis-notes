<script lang="ts">
  import Autocomplete from "../autocomplete.svelte";
  import FilterProperties from "./filter-properties.svelte";
  import InputTags from "../input-tags.svelte";
  import type { QueryController } from "../../bases.svelte";

  let {
    type,
    controller,
    value = $bindable(),
  }: {
    type: string;
    value: any;
    class?: string;
    controller: QueryController;
  } = $props();

  function fileOptions() {
    return controller.app.vault.getFiles().map((f) => {
      return { label: f.path, value: f.path };
    });
  }

  function folderOptions() {
    return controller.app.vault.getAllFolders().map((f) => {
      return { label: f.path || "/", value: f.path || "/" };
    });
  }

  function onChange(event: FocusEvent) {
    value = (event.target as HTMLInputElement).value;
  }
</script>

<div
  class="bases-style-min-h-inherit-05c993 bases-style-flex-column-a2a9e2 bases-style-bg-background-e6f9e3 bases-style-hover-bg-accent-0557b8 bases-style-focus-within-bg-accent-2d7ab0 bases-style-focus-within-text-accent-foreground-b70724 bases-style-flex-60fbb7 bases-style-h-auto-b8f0a0 grow bases-style-items-center-3960ff bases-style-self-stretch-18069a"
>
  {#if type === "file"}
    <Autocomplete bind:value options={fileOptions()} />
  {:else if type === "folder"}
    <Autocomplete bind:value options={folderOptions()} />
  {:else if type === "properties"}
    <FilterProperties bind:value {controller} />
  {:else if type === "none"}
    <span class="grow"></span>
  {:else if type === "datetime"}
    <input
      type="datetime-local"
      placeholder="Empty"
      {value}
      onblur={(evt) => onChange(evt)}
      class="bases-style-hover-bg-accent-0557b8 bases-style-focus-within-bg-accent-2d7ab0 bases-style-focus-within-text-accent-foreground-b70724 bases-style-dark-bg-input-30-afcf46 bases-style-dark-focus-within-bg-input-50-4a2c4b bases-style-h-full-668b21 grow bases-style-border-none-4a5f0e bases-style-pl-1-6ad214 bases-style-outline-none-df37b1"
    />
  {:else if type === "date"}
    <input
      type="date"
      placeholder="Empty"
      {value}
      onblur={(evt) => onChange(evt)}
      class="bases-style-hover-bg-accent-0557b8 bases-style-focus-within-bg-accent-2d7ab0 bases-style-focus-within-text-accent-foreground-b70724 bases-style-dark-bg-input-30-afcf46 bases-style-dark-focus-within-bg-input-50-4a2c4b bases-style-h-full-668b21 grow bases-style-border-none-4a5f0e bases-style-pl-1-6ad214 bases-style-outline-none-df37b1"
    />
  {:else if type === "number"}
    <input
      type="number"
      placeholder="Empty"
      {value}
      onblur={(evt) => onChange(evt)}
      class="bases-style-hover-bg-accent-0557b8 bases-style-focus-within-bg-accent-2d7ab0 bases-style-focus-within-text-accent-foreground-b70724 bases-style-dark-bg-input-30-afcf46 bases-style-dark-focus-within-bg-input-50-4a2c4b bases-style-h-full-668b21 grow bases-style-border-none-4a5f0e bases-style-pl-1-6ad214 bases-style-outline-none-df37b1"
    />
  {:else if type === "checkbox"}
    <span class="grow">
      <input
        type="checkbox"
        placeholder="Empty"
        data-indeterminate={value === null || value === undefined}
        bind:checked={value}
        class="metadata-input-checkbox bases-style-flex-60fbb7 bases-style-items-center-3960ff bases-style-outline-none-df37b1"
      />
    </span>
  {:else if type === "multitext"}
    <InputTags bind:values={value} class="grow" />
  {:else}
    <input
      type="text"
      placeholder="Empty"
      {value}
      onblur={(evt) => onChange(evt)}
      class="bases-style-hover-bg-accent-0557b8 bases-style-focus-within-bg-accent-2d7ab0 bases-style-focus-within-text-accent-foreground-b70724 bases-style-dark-bg-input-30-afcf46 bases-style-dark-focus-within-bg-input-50-4a2c4b bases-style-h-full-668b21 grow bases-style-border-none-4a5f0e bases-style-pl-1-6ad214 bases-style-outline-none-df37b1"
    />
  {/if}
</div>
