<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import InternalBasesView from "./bases-view/view.svelte";
  import type { BasesViewRegistration } from "./bases-view/bases.svelte";
  import type { BasesDocument } from "./bases-view/models";

  let {
    app,
    document,
    onChange,
    readOnly = false,
    showHeader = true,
    registrations,
  }: {
    app: App;
    document: BasesDocument;
    onChange?: (document: BasesDocument) => void;
    readOnly?: boolean;
    showHeader?: boolean;
    registrations?: ReadonlyMap<string, BasesViewRegistration>;
  } = $props();
</script>

<InternalBasesView
  {app}
  {document}
  {onChange}
  {readOnly}
  {showHeader}
  {registrations}
/>
