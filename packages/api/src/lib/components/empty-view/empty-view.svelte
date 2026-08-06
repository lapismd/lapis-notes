<script lang="ts">
  import { useLocale } from "$lib/localization-manager.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  const { t } = useLocale('base/empty-view');
 
  let {
    onClose,
  }: {
    onClose: (evt: MouseEvent) => void;
  } = $props();
</script>

<div
  class="bg-background absolute top-0 flex h-full w-full flex-col items-center justify-center overflow-auto"
>
  <div class="m-5 max-h-[280px] max-w-[480px] text-center">
    <div class="my-5 text-xl font-semibold">{t('No file is open')}</div>
    <div class="flex flex-col gap-1">
      <Button variant="ghost" onclick={() => app.commands.executeCommand('app:go-to-file')}>{t('Go to file ({{key}})', {key: "⌘ O"})}</Button>
      <Button variant="ghost" onclick={() => app.commands.executeCommand('app:go-to-file')}>{t('See recent files ({{key}})', {key: "⌘ O"})}</Button>
      <Button variant="ghost" onclick={(evt) => onClose(evt)}>{t('Close')}</Button>
    </div>
  </div>
</div>
