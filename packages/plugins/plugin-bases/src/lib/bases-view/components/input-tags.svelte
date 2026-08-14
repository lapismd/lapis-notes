<script lang="ts">
  import { cn } from "@lapis-notes/api";
  import type { HTMLInputAttributes } from "svelte/elements";
  import X from "@lucide/svelte/icons/x";
  import Autocomplete from "./autocomplete.svelte";
  import throttle from "lodash-es/throttle";

  type Options = { label: string; value: string; icon?: string };
  let {
    values = $bindable(),
    onChange,
    options,
    class: className,
    ...rest
  }: HTMLInputAttributes & {
    values: Array<string>;
    options?: Array<Options> | (() => Array<Options>);
    onChange?: (values: Array<string>) => void;
  } = $props();
  let tags: Array<string> = $state(split(values));

  const handleChange = throttle(() => {
    tags = split(values);
  }, 100);

  $effect(() => {
    if (tags !== values) {
      handleChange();
    }
  });

  let completeValue: string = $state("");

  function split(value: string | Array<string>) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    const values = (value || "")
      .split(/[,;]+/u)
      .map((v) => v.trim())
      .filter(Boolean);
    return [...new Set(values)];
  }

  function handleKeyDown(evt: KeyboardEvent) {
    const target = evt.currentTarget as HTMLInputElement;
    const parts = split(target.value);
    if (parts.length) {
      if ([",", ";", "Enter"].includes(evt.key)) {
        evt.preventDefault();
        values = [...new Set([...tags, ...parts])];
        target.value = "";
        onChange?.(values);
      }
    } else if (evt.key === "Backspace" && tags.length) {
      evt.preventDefault();
      const updated = [...tags];
      updated.slice(0, -1);
      values = updated;
      onChange?.(values);
    }
  }

  function handleBlur(evt: FocusEvent) {
    const target = evt.currentTarget as HTMLInputElement;
    const parts = split(target.value);
    if (parts.length) {
      values = [...new Set([...tags, ...parts])];
      onChange?.(values);
      target.value = "";
    }
  }

  function handleSelect(value: string) {
    const parts = split(value);
    if (parts.length) {
      values = [...new Set([...tags, ...parts])];
      onChange?.(values);
      completeValue = "";
    }
  }

  function completeOptions() {
    if (!options) return [];
    const opts = Array.isArray(options) ? options : options();
    return opts.filter((it) => !tags.includes(it.value));
  }

  function removeTag(index: number) {
    const updated = [...tags];
    updated.splice(index, 1);
    values = updated;
    onChange?.(values);
  }
</script>

<div
  class={cn(
    "relative bases-style-flex-60fbb7 bases-style-w-full-6da6a3 bases-style-flex-wrap-1eb5c6 bases-style-items-center-3960ff bases-style-gap-3px-7a9385 bases-style-bg-transparent-7f19cd bases-style-p-1-eb6a3c bases-style-text-sm-fc7473 bases-style-transition-color-box-shadow-c8598b bases-style-disabled-cursor-not-allowed-5f533b bases-style-disabled-opacity-50-b29d8a",
    className,
  )}
>
  {#each tags as t, i (t)}
    <p
      class="bases-style-bg-muted-2ef11f bases-style-hover-bg-input-0ddf8c bases-style-flex-60fbb7 bases-style-h-7-d0a52b bases-style-items-center-3960ff bases-style-gap-0-5-a38992 bases-style-rounded-full-ac204c bases-style-pr-1-5-3edc47 bases-style-pl-3-81976f bases-style-transition-all-0fe7d7 bases-style-duration-300-789055"
    >
      <span class="bases-style-mb-px-ccb0a6">{t}</span>
      <X
        class="bases-style-text-muted-foreground-bfa603 bases-style-hover-bg-background-047b7e bases-style-hover-text-destructive-51e950 bases-style-ml-0-5-b45ce4 bases-style-size-4-f7b5fa bases-style-cursor-pointer-345168 bases-style-rounded-full-ac204c stroke-1 bases-style-p-0-5-de8350 bases-style-transition-all-0fe7d7 bases-style-duration-300-789055 hover:scale-110 hover:stroke-2 active:scale-75"
        onclick={() => removeTag(i)}
      />
    </p>
  {/each}
  {#if options}
    <Autocomplete
      options={completeOptions}
      bind:value={completeValue}
      rootClass="w-auto"
      placeholder={tags.length ? "" : "—"}
      class="bases-style-peer-2b974b bases-style-data-slot-command-input-wrapper-p-0-a95879 bases-style-data-slot-command-input-wrapper-svg-hidden-a990ff bases-style-data-slot-command-input-wrapper-svg-h-auto-0dda33"
      onkeydown={(evt) => handleKeyDown(evt)}
      onblur={(evt) => handleBlur(evt)}
      onSelect={(value) => handleSelect(value)}
    />
  {:else}
    <input
      class={cn(
        "bases-style-peer-2b974b bases-style-placeholder-text-muted-foreground-9c24ab bases-style-ml-1-f58b02 bases-style-w-0-d1465a bases-style-flex-1-36e579 bases-style-border-none-4a5f0e bases-style-ring-0-866dcc bases-style-outline-none-df37b1 placeholder:capitalize",
        values.length ? "bases-style-placeholder-opacity-0-6bfa2c" : "bases-style-pl-1-6ad214",
      )}
      onkeydown={(evt) => handleKeyDown(evt)}
      onblur={(evt) => handleBlur(evt)}
      {...rest}
    />
  {/if}
</div>
