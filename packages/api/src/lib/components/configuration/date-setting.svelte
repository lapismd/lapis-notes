<script lang="ts">
  import { Button } from "@lapis-notes/ui/button";
  import { DateTimePickerDialog } from "@lapis-notes/ui/date-time-picker-dialog";

  let {
    value = $bindable(""),
    format = "date",
    onValueChange,
  }: {
    value?: string;
    format?: "date" | "time";
    onValueChange?: (value: string) => void;
  } = $props();

  let open = $state(false);

  function emit(next: string): void {
    value = next;
    onValueChange?.(next);
  }

  const label = $derived(
    value.trim().length > 0 ? value : format === "time" ? "Pick time" : "Pick date",
  );
</script>

<Button variant="outline" size="sm" class="h-8" onclick={() => (open = true)}>
  {label}
</Button>

<DateTimePickerDialog
  bind:open
  bind:value
  title={format === "time" ? "Pick time" : "Pick date"}
  description={format === "time" ? "Choose a time value." : "Choose a date value."}
  onConfirm={(next) => emit(next ?? "")}
  onClear={() => emit("")}
/>
