import type {
  App,
  MarkdownPostProcessorContext,
  MarkdownPostProcessor,
  MarkdownRenderChild,
  MarkdownSurfaceContext,
} from "@lapis-notes/api";
import type { MiraExtension, MiraMarkdownPostProcessor } from "@lapismd/mira/extensions";

type MarkdownNode = {
  type?: string;
  depth?: number;
  position?: {
    start?: { line?: number; offset?: number };
    end?: { line?: number; offset?: number };
  };
};

export type RegisteredMarkdownMiraExtensionOptions = {
  sourcePath: string;
  mode: "source" | "live-preview" | "reading" | "embed";
  surface: MarkdownSurfaceContext;
  markdown?: string | (() => string | Promise<string>);
};

function sourceSection(markdown: string, node: MarkdownNode) {
  const start = node.position?.start?.offset;
  const nodeEnd = node.position?.end?.offset;
  if (typeof start !== "number" || typeof nodeEnd !== "number") {
    return null;
  }

  let end = nodeEnd;
  if (node.type === "heading" && typeof node.depth === "number") {
    const following = markdown.slice(nodeEnd);
    const heading = /^ {0,3}(#{1,6})\s+/gm;
    for (const match of following.matchAll(heading)) {
      if ((match[1]?.length ?? 7) <= node.depth) {
        end = nodeEnd + (match.index ?? 0);
        break;
      }
    }
    if (end === nodeEnd) end = markdown.length;
  }

  const before = markdown.slice(0, start);
  const text = markdown.slice(start, end).replace(/\n+$/, "");
  return {
    text,
    lineStart: before.split("\n").length - 1,
    lineEnd: before.split("\n").length - 1 + text.split("\n").length - 1,
  };
}

function markdownSource(
  app: App,
  options: RegisteredMarkdownMiraExtensionOptions,
): () => Promise<string> {
  let pending: Promise<string> | null = null;
  return () => {
    if (!pending) {
      pending = Promise.resolve(
        typeof options.markdown === "function"
          ? options.markdown()
          : options.markdown ??
              (() => {
                const file = app.vault.getFileByPath(options.sourcePath);
                return file ? app.vault.read(file) : "";
              })(),
      );
    }
    return pending;
  };
}

function adaptPostProcessor(
  app: App,
  processor: MarkdownPostProcessor,
  options: RegisteredMarkdownMiraExtensionOptions,
): MiraMarkdownPostProcessor {
  const loadSource = markdownSource(app, options);
  return (el, node) => {
    let disposed = false;
    const children: MarkdownRenderChild[] = [];
    void loadSource().then(async (markdown) => {
      if (disposed) return;
      const typedNode = (node ?? {}) as MarkdownNode;
      const metadata = await app.metadataCache.getFileCacheAsync(
        options.sourcePath,
      );
      if (disposed) return;
      const context: MarkdownPostProcessorContext = {
        docId: options.sourcePath,
        sourcePath: options.sourcePath,
        frontmatter: metadata?.frontmatter ?? null,
        mode: options.mode,
        surface: options.surface,
        addChild(child) {
          children.push(child);
          child.load();
        },
        getSectionInfo(target) {
          return target === el ? sourceSection(markdown, typedNode) : null;
        },
      };
      await processor(el, context);
    });

    return () => {
      disposed = true;
      for (const child of children.splice(0).reverse()) child.unload();
    };
  };
}

export function resolveRegisteredMarkdownMiraExtensions(
  app: App,
  options: RegisteredMarkdownMiraExtensionOptions,
): MiraExtension[] {
  return app.markdownExtensions.getAll().map((contribution) => ({
    name: `${contribution.pluginId}:${contribution.id}`,
    codeMirror: contribution.codeMirror
      ? ({ mode }) => {
          if (mode !== "source" && mode !== "live-preview") return null;
          const extension = contribution.codeMirror?.({
            app,
            mode,
            sourcePath: options.sourcePath,
            surface: options.surface,
          });
          return extension ? [...[extension].flat()] : null;
        }
      : undefined,
    postProcessors: contribution.postProcessor
      ? [adaptPostProcessor(app, contribution.postProcessor, options)]
      : undefined,
  }));
}
