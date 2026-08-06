<script lang="ts">
  import { DatePicker, TimePicker } from "@lapismd/design-core/forms";

  let {
    value = $bindable(""),
    format = "date",
    onValueChange,
  }: {
    value?: string;
    format?: "date" | "time";
    onValueChange?: (value: string) => void;
  } = $props();

  /**
   * Normalize stored settings strings for the pickers.
   * Legacy `datetime-local` values look like `YYYY-MM-DDTHH:mm` (optional seconds).
   */
  function normalizeInbound(
    raw: string | undefined,
    fmt: "date" | "time",
  ): string | undefined {
    const trimmed = (raw ?? "").trim();
    if (!trimmed) return undefined;

    if (trimmed.includes("T")) {
      const [datePart, timePart = ""] = trimmed.split("T");
      if (fmt === "date") {
        return datePart || undefined;
      }
      const match = /^(\d{2}):(\d{2})/.exec(timePart);
      return match ? `${match[1]}:${match[2]}` : timePart || undefined;
    }

    if (fmt === "date") {
      // Accept bare `YYYY-MM-DD` (or longer ISO prefixes).
      const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
      return match?.[1] ?? trimmed;
    }

    const match = /^(\d{2}):(\d{2})/.exec(trimmed);
    return match ? `${match[1]}:${match[2]}` : trimmed;
  }

  function emit(next: string | undefined): void {
    const out = next ?? "";
    value = out;
    onValueChange?.(out);
  }
</script>

{#if format === "time"}
  <TimePicker
    bind:value={
      () => normalizeInbound(value, "time"),
      (next) => emit(next)
    }
    clearable
    ariaLabel="Choose time"
    placeholder="Pick time"
  />
{:else}
  <DatePicker
    bind:value={
      () => normalizeInbound(value, "date"),
      (next) => emit(next)
    }
    clearable
    ariaLabel="Choose date"
    placeholder="Pick date"
  />
{/if}
