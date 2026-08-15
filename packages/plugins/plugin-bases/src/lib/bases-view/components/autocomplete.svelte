<script lang="ts">
  import { cn } from "@lapis-notes/api";
  import AutocompleteInput from "@lapismd/design-core/forms/AutocompleteInput.svelte";

  type Options = { label: string; value: string; icon?: string };

  let {
    value = $bindable(""),
    options,
    placeholder = "Find or create",
    class: className,
    onSelect,
    id,
    "aria-label": ariaLabel,
  }: {
    value: string;
    options: Array<Options> | (() => Array<Options>);
    placeholder?: string;
    class?: string;
    onSelect?: (value: string) => void;
    id?: string;
    "aria-label"?: string;
  } = $props();

  let suggestions = $derived.by(() => {
    const opts = Array.isArray(options) ? options : options();
    return [...new Set(opts.map((option) => option.value).filter(Boolean))];
  });
</script>

<div
  class={cn("bases-autocomplete", className)}
  data-ui-component="bases-autocomplete"
  data-ui-part="root"
>
  <AutocompleteInput
    {id}
    bind:value
    {suggestions}
    {placeholder}
    ariaLabel={ariaLabel ?? placeholder ?? "Autocomplete"}
    commitOnBlur
    onCommit={(committedValue) => onSelect?.(committedValue)}
  />
</div>
