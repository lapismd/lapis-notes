<script lang="ts">
  import type { BasesView } from "../bases.svelte";
  import SummaryStrip from "../components/summary-strip.svelte";

  let {
    view,
  }: {
    view: BasesView;
  } = $props();
</script>

<div
  class="bases-style-flex-60fbb7 bases-style-h-full-668b21 bases-style-flex-col-8dddea bases-style-gap-3-1004c0 bases-style-border-t-b950dd bases-style-px-4-f0faeb bases-style-py-5-c9b99c bases-style-text-sm-fc7473"
  data-layout="map"
  data-ui-component="bases-map-view"
  data-ui-part="unavailable"
>
  <SummaryStrip {view} />
  <div class="bases-style-font-medium-2689f3">Map view is not available in this runtime yet.</div>
  <p class="bases-style-text-muted-foreground-bfa603">
    This Base can keep a `map` layout in its config, but the current runtime
    only provides an explicit fallback state until map capability is
    implemented.
  </p>
  <p class="bases-style-text-muted-foreground-bfa603">
    Current result count: {view.data.data.length}
  </p>
</div>
