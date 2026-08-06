<script lang="ts">
  import DateSetting from "../../packages/api/src/lib/components/configuration/date-setting.svelte";

  let dateValue = $state("");
  let timeValue = $state("12:00");
  /** Legacy `datetime-local` string; date-setting normalizes to `YYYY-MM-DD`. */
  let legacyDateValue = $state("2026-01-15T14:30");

  const status = $derived(
    `date: ${dateValue || "(empty)"}; time: ${timeValue || "(empty)"}; legacy: ${legacyDateValue || "(empty)"}`,
  );
</script>

<div class="flex max-w-md flex-col gap-4 p-4">
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium">Date</span>
    <DateSetting bind:value={dateValue} format="date" />
  </div>
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium">Time</span>
    <DateSetting bind:value={timeValue} format="time" />
  </div>
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium">Legacy datetime-local (date)</span>
    <DateSetting bind:value={legacyDateValue} format="date" />
  </div>
  <p data-testid="api-ui-status">{status}</p>
</div>
