<script lang="ts">
  import { cn, type App } from "@lapis-notes/api";
  import Autocomplete from "./components/autocomplete.svelte";
  import ChipAutocomplete from "@lapismd/design-core/forms/ChipAutocomplete.svelte";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { DateTime } from "luxon";
  import {
    collectMetadataSuggestions,
    metadataPropertyKey,
  } from "./cell-editor-options";

  let {
    app,
    type,
    name,
    value = $bindable(),
    class: className,
    onValueChange,
  }: {
    app: App;
    type: string;
    name: string;
    value: any;
    class?: string;
    onValueChange?: (name: string, value: any) => void;
  } = $props();

  function fileOptions() {
    return app.vault.getFiles().map((f) => {
      return { label: f.path, value: f.path };
    });
  }

  function folderOptions() {
    return app.vault.getAllFolders().map((f) => {
      return { label: f.path || "/", value: f.path || "/" };
    });
  }

  function onChange(event: FocusEvent) {
    const target = event.target as HTMLInputElement;
    if (target.type === "checkbox") {
      value = target.checked;
    } else if (target.type === "number") {
      const trimmed = target.value.trim();
      value = trimmed === "" ? null : +trimmed;
    } else {
      value = target.value;
    }
    onValueChange?.(name, value);
  }

  function onDateChange(event: Event) {
    value = (event.target as HTMLInputElement).value;
    if (value) {
      onValueChange?.(name, value);
    } else {
      onValueChange?.(name, null);
    }
  }

  function metadataSuggestions(key: string, splitDelimited = false) {
    return collectMetadataSuggestions(
      app.metadataTypeManager.getValues(metadataPropertyKey(key)),
      splitDelimited,
    );
  }

  function metadataOptions(key: string) {
    return metadataSuggestions(key).map((suggestion) => ({
      label: suggestion,
      value: suggestion,
    }));
  }

  function currentTagValues() {
    return collectMetadataSuggestions([value], true);
  }

  function onTagsChange(values: string[]) {
    value = values;
    onValueChange?.(name, values);
  }

  function toDateTime(value: unknown) {
    if (value instanceof DateTime) {
      return value.toISO()?.substring(0, 16);
    } else if (value instanceof Date) {
      return value.toISOString().substring(0, 16);
    } else if (typeof value === "number") {
      return DateTime.fromMillis(value)?.toISO()?.substring(0, 16);
    }
    return value;
  }

  function toDate(value: unknown) {
    if (value instanceof DateTime) {
      return value.toISODate();
    } else if (value instanceof Date) {
      return DateTime.fromJSDate(value).toISODate();
    } else if (typeof value === "number") {
      return DateTime.fromMillis(value).toISODate();
    }
    return value;
  }

  const editorLabel = $derived(
    name.startsWith("note.") ? name.slice("note.".length) : name,
  );
</script>

<div
  class="bases-cell-editor"
  data-ui-component="bases-cell-editor"
  data-ui-part="root"
  data-type={type}
>
  {#if type === "file"}
    <Autocomplete
      placeholder="—"
      aria-label={editorLabel}
      bind:value
      options={fileOptions()}
      class={className}
      onSelect={(selectedValue) => onValueChange?.(name, selectedValue)}
    />
  {:else if type === "folder"}
    <Autocomplete
      placeholder="—"
      aria-label={editorLabel}
      bind:value
      options={folderOptions()}
      class={className}
      onSelect={(selectedValue) => onValueChange?.(name, selectedValue)}
    />
  {:else if type === "none"}
    <span class="bases-cell-editor__empty"></span>
  {:else if type === "datetime"}
    <Input
      type="datetime-local"
      placeholder="—"
      aria-label={editorLabel}
      value={toDateTime(value)}
      onblur={(evt) => onDateChange(evt)}
      onchange={(evt) => onDateChange(evt)}
      class={cn("bases-cell-editor__control", className)}
      data-ui-part="control"
    />
  {:else if type === "date"}
    <Input
      type="date"
      placeholder="—"
      aria-label={editorLabel}
      value={toDate(value)}
      onblur={(evt) => onDateChange(evt)}
      onchange={(evt) => onDateChange(evt)}
      class={cn("bases-cell-editor__control", className)}
      data-ui-part="control"
    />
  {:else if type === "number"}
    <Input
      type="number"
      placeholder="—"
      aria-label={editorLabel}
      {value}
      onblur={(evt) => onChange(evt)}
      class={cn("bases-cell-editor__control", className)}
      data-ui-part="control"
    />
  {:else if type === "checkbox"}
    <span class="bases-cell-editor__checkbox-wrap">
      <input
        type="checkbox"
        placeholder="—"
        aria-label={editorLabel}
        data-indeterminate={value === null ||
          value === undefined ||
          value === ""}
        bind:checked={value}
        onblur={(evt) => onChange(evt)}
        class={cn("metadata-input-checkbox bases-cell-editor__checkbox", className)}
        data-ui-part="checkbox"
      />
    </span>
  {:else if type === "multitext" || type === "tags"}
    <ChipAutocomplete
      placeholder="—"
      label={editorLabel}
      showLabel={false}
      embedded
      uppercase={false}
      value={currentTagValues()}
      suggestions={metadataSuggestions(name, true)}
      onChange={onTagsChange}
    />
  {:else}
    <Autocomplete
      onSelect={(value) => onValueChange?.(name, value)}
      placeholder=""
      aria-label={editorLabel}
      class={cn("bases-cell-editor__control", className)}
      bind:value
      options={metadataOptions(name)}
    />
  {/if}
</div>
