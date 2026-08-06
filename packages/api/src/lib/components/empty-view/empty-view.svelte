<script lang="ts">
  import { useLocale } from "$lib/localization-manager.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import "./empty-view.css";
  const { t } = useLocale('base/empty-view');
 
  let {
    onClose,
  }: {
    onClose: (evt: MouseEvent) => void;
  } = $props();
</script>

<div data-ui-component="empty-view" data-ui-part="root">
  <div data-ui-component="empty-view" data-ui-part="panel">
    <div data-ui-component="empty-view" data-ui-part="title">{t('No file is open')}</div>
    <div data-ui-component="empty-view" data-ui-part="actions">
      <Button variant="ghost" onclick={() => app.commands.executeCommand('app:go-to-file')}>{t('Go to file ({{key}})', {key: "⌘ O"})}</Button>
      <Button variant="ghost" onclick={() => app.commands.executeCommand('app:go-to-file')}>{t('See recent files ({{key}})', {key: "⌘ O"})}</Button>
      <Button variant="ghost" onclick={(evt) => onClose(evt)}>{t('Close')}</Button>
    </div>
  </div>
</div>
