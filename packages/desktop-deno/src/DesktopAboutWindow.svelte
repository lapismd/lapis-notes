<script lang="ts">
  import {
    WorkspaceAboutDialog,
    type AppShellApplicationInfo,
  } from "@lapismd/design-core/workspace";

  let {
    info,
    onClose,
  }: {
    info: AppShellApplicationInfo;
    onClose: () => void;
  } = $props();

  let open = $state(true);
  let copyStatus = $state("");

  function handleOpenChange(next: boolean): void {
    open = next;
    if (!next) onClose();
  }
</script>

<main class="desktop-about-window" data-ui-component="desktop-about-window">
  <WorkspaceAboutDialog
    {info}
    {open}
    onOpenChange={handleOpenChange}
    onCopyResult={(success, value) => {
      const label = value === "version" ? "Version" : "Commit hash";
      copyStatus = success
        ? `${label} copied`
        : `Failed to copy ${label.toLowerCase()}`;
    }}
  />
  <p class="desktop-about-window__status" aria-live="polite">{copyStatus}</p>
</main>
