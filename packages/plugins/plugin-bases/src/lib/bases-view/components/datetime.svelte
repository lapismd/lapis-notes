<script lang="ts">
  import { DateTime } from "luxon";
  import { parseDateTime } from "peaql";

  let {
    value,
  }: {
    value: number | DateTime | string;
  } = $props();

  let date = $derived.by(() => {
    if (typeof value === "number") {
      return DateTime.fromMillis(value).toISO()?.substring(0, 16);
    } else if (typeof value === "string") {
      const dt = parseDateTime(value);
      if (dt) {
        return dt.toISO()?.substring(0, 16);
      }
      return value.substring(0, 16);
    } else if (value instanceof DateTime) {
      return value.toISO()?.substring(0, 16);
    }
    return value;
  });
</script>

<div class="bases-table-cell bases-rendered-value">
  <input
    class="metadata-input metadata-input-text mod-datetime !static !ps-0"
    value={date}
    step="any"
    disabled={true}
    type="datetime-local"
  />
</div>
