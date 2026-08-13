<script lang="ts">
  import dmSansItalicFontUrl from "@fontsource-variable/dm-sans/files/dm-sans-latin-wght-italic.woff2?url";
  import dmSansNormalFontUrl from "@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url";
  import { withHtmlPreviewFonts } from "$lib/cv/compiler/html-preview";
  import {
    previewPageStackWide,
    previewWidthStyle,
    type CvPreviewMode,
  } from "$lib/cv/cv-options";
  import { artifactObjectUrl, type TypstPreviewFormat, type WorkerArtifact } from "$lib/cv/web-artifacts";
  import CvMarkdownArtifact from "./cv-markdown-artifact.svelte";

  let {
    html = "",
    typst = "",
    markdown = "",
    artifacts = [],
    error = null,
    mode = "rendercv",
    previewFormat = "svg",
    zoom = 1,
    pending = false,
    markdownMode = "preview",
  }: {
    html?: string;
    typst?: string;
    markdown?: string;
    artifacts?: WorkerArtifact[];
    error?: string | null;
    mode?: CvPreviewMode;
    previewFormat?: TypstPreviewFormat;
    zoom?: number;
    pending?: boolean;
    markdownMode?: "source" | "preview";
  } = $props();

  const pageArtifacts = $derived(
    artifacts.filter((artifact) => artifact.preview && artifact.extension === previewFormat),
  );
  const documentStyle = $derived(previewWidthStyle(zoom));
  const stackWide = $derived(previewPageStackWide(zoom));
  const htmlSrcdoc = $derived(
    withHtmlPreviewFonts(html, {
      normal: dmSansNormalFontUrl,
      italic: dmSansItalicFontUrl,
    }),
  );
  const showHtmlFallback = $derived(
    mode === "rendercv" && Boolean(error) && !pending && pageArtifacts.length === 0,
  );
  const previewText = $derived(typst);

  let pageUrls = $state<Array<{ id: string; src: string; alt: string; format: string }>>([]);

  $effect(() => {
    const pages = pageArtifacts;
    const next = pages.map((page, index) => {
      const format = page.metadata?.previewFormat ?? page.extension;
      if (page.extension === "png") {
        return {
          id: page.id,
          src: artifactObjectUrl(page),
          alt: page.label || `CV page ${index + 1}`,
          format,
          revoke: true,
        };
      }
      return {
        id: page.id,
        src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(String(page.content))}`,
        alt: page.label || `CV page ${index + 1}`,
        format,
        revoke: false,
      };
    });
    pageUrls = next.map(({ id, src, alt, format }) => ({ id, src, alt, format }));
    return () => {
      for (const page of next) {
        if (page.revoke) URL.revokeObjectURL(page.src);
      }
    };
  });
</script>

<section
  class="cv-preview"
  data-ui-component="cv-preview"
  data-testid="cv-preview"
  data-preview-mode={mode}
>
  {#if error}
    <p class="cv-preview__error" role="alert" data-testid="cv-preview-error">{error}</p>
  {/if}

  {#if mode === "rendercv"}
    {#if pageUrls.length}
      <div
        class="cv-preview__pages"
        data-testid="cv-preview-pages"
        data-zoom-wide={stackWide ? "" : undefined}
      >
        {#each pageUrls as page (page.id)}
          <img
            class="cv-preview__page"
            style={documentStyle}
            src={page.src}
            alt={page.alt}
            data-testid="cv-preview-document"
            data-preview-format={page.format}
          />
        {/each}
      </div>
    {:else if pending}
      <div class="cv-preview__pending" data-testid="cv-preview-pending">
        Preparing Typst preview...
      </div>
    {:else if showHtmlFallback}
      <div class="cv-preview__html-frame" style={documentStyle} data-testid="cv-preview-document">
        <iframe
          class="cv-preview__html"
          title="CV HTML preview fallback"
          sandbox="allow-popups allow-same-origin"
          srcdoc={htmlSrcdoc}
          data-testid="cv-preview-html"
        ></iframe>
      </div>
    {:else}
      <div class="cv-preview__pending" data-testid="cv-preview-empty">
        No Typst preview found.
      </div>
    {/if}
  {:else if mode === "rendercv-html"}
    <div class="cv-preview__html-frame" style={documentStyle} data-testid="cv-preview-document">
      <iframe
        class="cv-preview__html"
        title="CV HTML preview"
        sandbox="allow-popups allow-same-origin"
        srcdoc={htmlSrcdoc}
        data-testid="cv-preview-html"
      ></iframe>
    </div>
  {:else if mode === "rendercv-md"}
    <div
      class="cv-preview__markdown-frame"
      style={documentStyle}
      data-testid="cv-preview-document"
    >
      <CvMarkdownArtifact value={markdown} mode={markdownMode} />
    </div>
  {:else}
    <pre
      class="cv-preview__text"
      style={documentStyle}
      data-testid="preview-text"
    >{previewText}</pre>
  {/if}
</section>

<style>
  .cv-preview {
    display: flex;
    min-width: 0;
    min-height: 100%;
    flex-direction: column;
    background: var(--ui-workspace-view-background, var(--background));
    color: var(--ui-workspace-view-foreground, var(--foreground));
  }

  .cv-preview[data-preview-mode="rendercv-md"] {
    height: 100%;
    min-height: 22.5rem;
  }

  .cv-preview__markdown-frame {
    display: flex;
    min-height: 100%;
    flex: 1 0 auto;
    align-self: center;
  }

  .cv-preview__error {
    margin: 0;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
    color: var(--destructive);
  }

  .cv-preview__pending {
    display: grid;
    min-height: 100%;
    place-items: center;
    padding: 2rem 1rem;
    color: var(--muted-foreground, var(--foreground));
  }

  .cv-preview__html-frame {
    margin-inline: auto;
  }

  .cv-preview__html {
    display: block;
    width: 100%;
    height: 64rem;
    border: 0;
    background: white;
  }

  .cv-preview__pages {
    display: flex;
    min-height: 100%;
    min-width: 100%;
    width: 100%;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .cv-preview__pages[data-zoom-wide] {
    width: max-content;
  }

  .cv-preview__page {
    display: block;
    height: auto;
    max-width: none;
    background: white;
    box-shadow: none;
  }

  .cv-preview__text {
    margin: 0 auto;
    min-height: 100%;
    padding: 1.5rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--text-sm, 0.875rem);
    white-space: pre-wrap;
  }
</style>
