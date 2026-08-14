<script lang="ts">
  import { cn, type App } from "@lapis-notes/api";
  import Autocomplete from "./components/autocomplete.svelte";
  import InputTags from "./components/input-tags.svelte";
  import { DateTime } from "luxon";

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

  function metadataOptions(key: string) {
    const tags = new Set<string>();
    app.metadataTypeManager.getValues(key).map((f) => {
      if (Array.isArray(f)) {
        f.filter(Boolean).forEach((it) => tags.add(it));
      } else if (f) {
        tags.add(f.toString());
      }
    });
    return [...tags].map((f) => {
      return { label: f, value: f };
    });
  }

  function multilineOptions(key: string) {
    const tags = new Set<string>();
    app.metadataTypeManager.getValues(key).map((f) => {
      if (Array.isArray(f)) {
        f.filter((it) => it).forEach((it) => tags.add(it));
      } else if (f) {
        const values = f
          .toString()
          .split(/[,;]+/u)
          .map((v) => v.trim())
          .filter(Boolean);
        values.forEach((tag) => tags.add(tag));
      }
    });
    return [...tags].map((f) => {
      return { label: f, value: f };
    });
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
</script>

<div class="bases-style-group-64292b bases-style-h-full-668b21 bases-style-w-full-6da6a3">
  {#if type === "file"}
    <Autocomplete
      placeholder="—"
      rootClass="w-full h-full"
      bind:value
      options={fileOptions()}
      class={className}
    />
  {:else if type === "folder"}
    <Autocomplete
      placeholder="—"
      rootClass="w-full h-full"
      bind:value
      options={folderOptions()}
      class={className}
    />
  {:else if type === "none"}
    <span class="grow"></span>
  {:else if type === "datetime"}
    <input
      type="datetime-local"
      placeholder="—"
      value={toDateTime(value)}
      onblur={(evt) => onDateChange(evt)}
      onchange={(evt) => onDateChange(evt)}
      class={cn("bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-border-none-4a5f0e bases-style-outline-none-df37b1", {
        "invisible group-hover:visible": !value,
      })}
    />
  {:else if type === "date"}
    <input
      type="date"
      placeholder="—"
      value={toDate(value)}
      onblur={(evt) => onDateChange(evt)}
      onchange={(evt) => onDateChange(evt)}
      class={cn("bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-border-none-4a5f0e bases-style-outline-none-df37b1", className, {
        "invisible group-hover:visible": !value,
      })}
    />
  {:else if type === "number"}
    <input
      type="number"
      placeholder="—"
      {value}
      onblur={(evt) => onChange(evt)}
      class={cn(
        "bases-style-hover-bg-accent-0557b8 bases-style-focus-within-bg-accent-2d7ab0 bases-style-focus-within-text-accent-foreground-b70724 bases-style-dark-bg-input-30-afcf46 bases-style-dark-focus-within-bg-input-50-4a2c4b bases-style-h-full-668b21 grow bases-style-border-none-4a5f0e bases-style-pl-1-6ad214 bases-style-outline-none-df37b1",
        className,
      )}
    />
  {:else if type === "checkbox"}
    <span class="grow">
      <input
        type="checkbox"
        placeholder="—"
        data-indeterminate={value === null ||
          value === undefined ||
          value === ""}
        bind:checked={value}
        onblur={(evt) => onChange(evt)}
        class={cn(
          "metadata-input-checkbox bases-style-flex-60fbb7 bases-style-items-center-3960ff bases-style-outline-none-df37b1",
          className,
        )}
      />
    </span>
  {:else if type === "multitext" || type === "tags"}
    <InputTags
      placeholder="—"
      bind:values={value}
      onChange={(values) => onValueChange?.(name, values)}
      class="bases-style-whitespace-nowrap-e82ae8 bases-style-focus-within-h-fit-9fd2b3"
      options={multilineOptions(name)}
    />
  {:else}
    <Autocomplete
      onSelect={(value) => onValueChange?.(name, value)}
      placeholder=""
      class={cn(
        "bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-bg-transparent-7f19cd bases-style-hover-bg-transparent-de520d bases-style-data-slot-command-input-wrapper-svg-hidden-a990ff",
        className,
      )}
      bind:value
      options={metadataOptions(name)}
    />
  {/if}
</div>
