<script lang="ts">
  import { onMount } from "svelte";
  import {
    type App,
    type EmbedViewHandle,
    type MarkdownPostProcessorContext,
    type MarkdownRenderChild,
  } from "@lapis-notes/api";
  import { bootBasesEditorShellDemo } from "./shell/create-shell-demo";

  let status = $state("booting");
  let error = $state("");
  let root = $state<HTMLDivElement>();
  let fileEmbed = $state<HTMLDivElement>();
  let fencedEmbed = $state<HTMLDivElement>();
  let invalidEmbed = $state<HTMLDivElement>();

  onMount(() => {
    let disposed = false;
    let embedHandle: EmbedViewHandle | void;
    const children: MarkdownRenderChild[] = [];
    let runtime: Awaited<ReturnType<typeof bootBasesEditorShellDemo>> | null = null;

    const cleanupRenders = () => {
      void embedHandle?.destroy?.();
      embedHandle = undefined;
      for (const child of children.splice(0)) child.unload();
      fileEmbed?.replaceChildren();
      fencedEmbed?.replaceChildren();
      invalidEmbed?.replaceChildren();
    };

    const runtimePromise = bootBasesEditorShellDemo();
    void runtimePromise
      .then((readyRuntime) => {
        if (disposed) return readyRuntime.dispose();
        runtime = readyRuntime;
        const app = readyRuntime.app;
        const file = app.vault.getFileByPath("Bases/Projects.base");
        const renderer = app.embedRegistry.get("base");
        if (!file || !renderer) throw new Error("Bases embed renderer is unavailable");
        embedHandle = renderer({ app, containerEl: fileEmbed, state: { file } });

        const renderFence = (
          language: "base" | "bases",
          source: string,
          containerEl: HTMLElement,
        ) => {
          const processor = app.mardownCodeBlockPostProcessor[language]?.[0];
          if (!processor) throw new Error(`Missing ${language} fenced renderer`);
          const fenced = `\`\`\`${language}\n${source}\n\`\`\`\n`;
          const context: MarkdownPostProcessorContext = {
            docId: `bases-${language}`,
            sourcePath: "Notes/Bases embeds.md",
            frontmatter: null,
            addChild: (child) => children.push(child),
            getSectionInfo: () => ({ text: fenced, lineStart: 0, lineEnd: 2 }),
          };
          processor(containerEl, context);
        };
        renderFence("bases", "views:\n  - type: list\n    name: Embedded list", fencedEmbed);
        renderFence("base", "views: [", invalidEmbed);

        const ownedRoot = root as HTMLDivElement & {
          __lapisApp?: App;
          __cleanupBasesEmbeds?: () => void;
        };
        ownedRoot.__lapisApp = app;
        ownedRoot.__cleanupBasesEmbeds = cleanupRenders;
        status = "ready";
      })
      .catch((reason) => {
        if (disposed) return;
        status = "failed";
        error = reason instanceof Error ? reason.message : String(reason);
      });

    return () => {
      disposed = true;
      cleanupRenders();
      if (root) {
        delete (root as HTMLDivElement & { __lapisApp?: App }).__lapisApp;
        delete (root as HTMLDivElement & { __cleanupBasesEmbeds?: () => void })
          .__cleanupBasesEmbeds;
      }
      void (runtime ? runtime.dispose() : runtimePromise.then((value) => value.dispose()));
    };
  });
</script>

<div bind:this={root} class="bases-embeds-demo" data-testid="bases-embeds-demo">
  <output data-testid="bases-embeds-status">{status}</output>
  {#if error}<div role="alert">{error}</div>{/if}
  <section>
    <h2>Base file embed</h2>
    <div bind:this={fileEmbed} data-testid="bases-file-embed"></div>
  </section>
  <section>
    <h2>Fenced Bases block</h2>
    <div bind:this={fencedEmbed} data-testid="bases-fenced-embed"></div>
  </section>
  <section>
    <h2>Invalid fenced YAML</h2>
    <div bind:this={invalidEmbed} data-testid="bases-invalid-embed"></div>
  </section>
</div>

<style>
  .bases-embeds-demo {
    box-sizing: border-box;
    display: grid;
    gap: 1rem;
    min-height: 700px;
    padding: 1rem;
    overflow: auto;
    color: var(--ui-workspace-foreground);
    background: var(--ui-workspace-background);
  }

  .bases-embeds-demo > output {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .bases-embeds-demo section {
    min-height: 10rem;
    padding: 1rem;
    border: 1px solid var(--ui-workspace-border);
    border-radius: 0.5rem;
  }

  .bases-embeds-demo h2 {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
  }
</style>
