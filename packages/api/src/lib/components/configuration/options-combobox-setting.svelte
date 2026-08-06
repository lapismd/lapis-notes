<script lang="ts">
  import { Input } from "@lapismd/design-core/shadcn/input";
  import type { ObjectMapOption } from "./object-map-setting.svelte";
  import { filterComboboxOptions } from "./object-array-utils";

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

<div class="relative w-full">
  <Input
    type="text"
    class="h-8 border-none w-full"
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
      class="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      role="listbox"
    >
      {#each visibleOptions as option (option.value)}
        <li role="presentation">
          <button
            type="button"
            class="flex w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
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
