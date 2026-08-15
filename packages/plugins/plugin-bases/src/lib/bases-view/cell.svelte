<script lang="ts">
  import { DateTime } from "luxon";
  import { type DType } from "peaql";
  import type { HTMLAttributes } from "svelte/elements";
  import DatetimeWidget from "./components/datetime.svelte";
  import { cn, TFile, type App, type MetadataType } from "@lapis-notes/api";
  import { normalizeMetadataValue } from "@lapis-notes/api/metadata-value";
  import CellEditor from "./cell-editor.svelte";
  import { set, unset } from "lodash-es";
  import { untrack } from "svelte";
  import { Icon } from "./functions";
  import { Icon as IconComponent } from "@lapis-notes/api/icon";
  import File from "./components/file.svelte";
  import Tag from "./components/tag-chip.svelte";
  import type { Value } from "@lapis-notes/api";
  let {
    app,
    file,
    type,
    name,
    value: cellValue,
    readOnly = false,
    class: className,
    meta,
    ...rest
  }: HTMLAttributes<HTMLDivElement> & {
    name: string;
    app: App;
    type: string | DType;
    value: Value | null | unknown;
    file: TFile;
    readOnly?: boolean;
    meta?: unknown;
  } = $props();

  let displayType = $derived(String(type ?? ""));
  let value = $derived(
    cellValue instanceof Object && "value" in cellValue
      ? (cellValue as Value).value
      : (cellValue ?? ""),
  );

  function focusElement(evt: Event) {
    const target = evt.target;
    if (!(target instanceof HTMLElement) || target.closest("button")) return;
    const cell = evt.currentTarget;
    if (!(cell instanceof HTMLElement)) return;
    cell.querySelector("input")?.focus();
  }

  function metadataTypeFromDisplayType(displayType: string): MetadataType {
    switch (displayType.toLowerCase()) {
      case "boolean":
      case "checkbox":
        return "checkbox";
      case "number":
        return "number";
      case "date":
        return "date";
      case "datetime":
      case "timestamp":
        return "datetime";
      case "multitext":
        return "multitext";
      case "tags":
        return "tags";
      case "aliases":
        return "aliases";
      case "array":
        return "array";
      case "object":
        return "object";
      default:
        return "text";
    }
  }

  function onValueChange(name: string, value: any) {
    if (name.startsWith("file.") || name.startsWith("formula.")) return;
    untrack(() => {
      if (file) {
        const id = name.startsWith("note.") ? name.substring(5) : name;
        const declaredType =
          app.metadataTypeManager.types[id]?.type ??
          metadataTypeFromDisplayType(displayType);
        const normalized = normalizeMetadataValue(declaredType, value);
        const existing =
          cellValue instanceof Object && "value" in cellValue
            ? (cellValue as Value).value
            : "";
        if (existing === normalized) return;
        app.fileManager.processFrontMatter(file, (data) => {
          if (normalized === null || normalized === undefined) {
            unset(data, id);
          } else {
            set(data, id, normalized);
          }
        });
      }
    });
  }
</script>

<div
  {...rest}
  class={cn("bases-style-h-full-668b21 bases-style-w-full-6da6a3", className)}
  onclick={(evt) => focusElement(evt)}
  data-ui-component="bases-cell"
  data-ui-part="root"
  data-type={displayType}
  data-property={name}
>
  {#if !readOnly && !(name.startsWith("file.") || name.startsWith("formula.") || name === "file")}
    <CellEditor {app} {onValueChange} {value} {name} type={displayType} />
  {:else if file && name === "file.name"}
    <File {app} {file} />
  {:else if name === "file.tags"}
    <div class="markdown-rendered bases-style-flex-60fbb7 bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-gap-2-77a2a2">
      {#each Array.isArray(value) ? value : [] as tag}
        <Tag name={tag} />
      {/each}
    </div>
  {:else if value instanceof TFile}
    <File {app} file={value} />
  {:else if value instanceof DateTime}
    <DatetimeWidget {value} />
  {:else if value instanceof Icon}
    <IconComponent name={[value.name, "circle-question-mark"]} />
  {:else}
    <div class="bases-style-h-full-668b21 bases-style-w-full-6da6a3">{value}</div>
  {/if}
</div>
