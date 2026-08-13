<script lang="ts">
  import { Mira } from "@lapismd/mira";
  import "@lapismd/mira/styles.css";
  import "@lapismd/mira/themes/obsidian.css";

  let {
    value = "",
    mode = "preview",
  }: {
    value?: string;
    mode?: "source" | "preview";
  } = $props();
</script>

<section
  class="cv-markdown-artifact"
  data-ui-component="cv-markdown-artifact"
  data-testid="cv-markdown-artifact"
  data-markdown-mode={mode}
>
  <div class="cv-markdown-artifact__body">
    <Mira
      {value}
      {mode}
      readonly
      toolbar={false}
      theme="obsidian"
      colorMode="inherit"
      spellcheck={false}
      blockControls={false}
      class="cv-markdown-artifact__surface"
    />
  </div>
</section>

<style>
  .cv-markdown-artifact {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: 22.5rem;
    flex: 1 1 auto;
    flex-direction: column;
    overflow: hidden;
    background: var(--ui-workspace-view-background, var(--background));
    color: var(--ui-workspace-view-foreground, var(--foreground));
  }

  .cv-markdown-artifact__body {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
  }

  .cv-markdown-artifact__body :global(.mira.cv-markdown-artifact__surface) {
    --file-line-width: 100%;
    --file-margins-x: 1rem;
    --mira-preview-padding: 1rem;
    --mira-preview-bottom-padding: 1rem;

    width: 100%;
    min-width: 0;
    min-height: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
</style>
