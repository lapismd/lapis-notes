<script lang="ts">
  import { Input } from "@lapismd/design-core/shadcn/input";
  import type { ObjectMapOption } from "./object-map-setting.svelte";
  import { filterComboboxOptions } from "./object-array-utils";
  import "./configuration.css";

  let {
    value = $bindable(""),
    options = [],
    placeholder = "Enter or select a value",
    onValueChange,
    onQueryChange,
  }: {
    value?: string;
    options?: ObjectMapOption[];
    placeholder?: string;
    onValueChange?: (value: string) => void;
    onQueryChange?: (query: string) => void;
  } = $props();

  let draft = $state("");
  let filterQuery = $state("");
  let open = $state(false);
  let queryTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    draft = value;
    if (!open) {
      filterQuery = "";
    }
  });

  const visibleOptions = $derived.by(() =>
    filterComboboxOptions(options, draft, filterQuery),
  );

  function emit(next: string): void {
    value = next;
    draft = next;
    filterQuery = "";
    onValueChange?.(next);
  }

  function scheduleQueryChange(nextQuery: string): void {
    if (queryTimer) {
      clearTimeout(queryTimer);
    }
    queryTimer = setTimeout(() => {
      onQueryChange?.(nextQuery);
    }, 200);
  }

  function handleInput(event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    draft = target.value;
    filterQuery = draft;
    open = true;
    scheduleQueryChange(filterQuery);
  }

  function handleFocus(): void {
    open = true;
    filterQuery = "";
    scheduleQueryChange("");
  }

  function handleBlur(): void {
    setTimeout(() => {
      open = false;
      filterQuery = "";
      if (draft !== value) {
        emit(draft.trim());
      }
    }, 150);
  }

  function selectOption(optionValue: string): void {
    emit(optionValue);
    open = false;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.currentTarget instanceof HTMLInputElement &&
        event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      open = false;
      filterQuery = "";
    }
  }
</script>

<div data-ui-component="configuration" data-ui-part="combobox">
  <Input
    type="text"
    class="configuration-combobox-input"
    {placeholder}
    value={draft}
    oninput={handleInput}
    onfocus={handleFocus}
    onblur={handleBlur}
    onkeydown={handleKeydown}
    role="combobox"
    aria-expanded={open}
    aria-autocomplete="list"
  />
  {#if open && visibleOptions.length > 0}
    <ul
      data-ui-component="configuration"
      data-ui-part="combobox-list"
      role="listbox"
    >
      {#each visibleOptions as option (option.value)}
        <li role="presentation">
          <button
            type="button"
            data-ui-component="configuration"
            data-ui-part="combobox-option"
            disabled={option.disabled}
            onclick={() => selectOption(option.value)}
          >
            {option.label}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
