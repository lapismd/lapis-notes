<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  let {
    app,
    file,
  }: {
    app: App;
    file: TFile;
  } = $props();

  function openFile(evt: MouseEvent) {
    if (evt.metaKey || evt.ctrlKey) {
      const leaf = app.workspace.getLeaf("tab");
      leaf.openFile(file).then(() => {
        app.workspace.revealLeaf(leaf);
        app.workspace.requestSaveLayout();
      });

      evt.preventDefault();
      return;
    }
    app.openFile(file).then(() => app.workspace.requestSaveLayout());
    evt.preventDefault();
  }
</script>

<a
  href="#/"
  class="bases-style-text-var-text-accent-69c994 underline"
  onclick={(evt) => openFile(evt)}>{file.name}</a
>
