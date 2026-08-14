<script lang="ts">
  import { TFile, type App } from "@lapis-notes/api";
  import { loadBasesResourceUrl } from "../resource-url";

  const IMAGE_EXTENSIONS = new Set([
    "apng",
    "avif",
    "bmp",
    "gif",
    "ico",
    "jpeg",
    "jpg",
    "png",
    "svg",
    "tif",
    "tiff",
    "webp",
  ]);

  let {
    app,
    value,
    sourceFile = null,
    height,
    fit = "contain",
  }: {
    app: App;
    value: unknown;
    sourceFile?: TFile | null;
    height: number;
    fit?: string;
  } = $props();

  let resourceUrl = $state("");
  let imageFile = $derived(resolveImageFile(value, sourceFile));

  function unwrapValue(value: unknown): unknown {
    if (value instanceof TFile) {
      return value;
    }

    if (value && typeof value === "object") {
      const candidate = value as { file?: unknown; value?: unknown };
      if (candidate.file instanceof TFile) {
        return candidate.file;
      }

      if ("value" in candidate) {
        return candidate.value;
      }
    }

    return value;
  }

  function imagePathFromText(value: string): string {
    const trimmed = value.trim();
    const embedMatch = /^!?\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/u.exec(trimmed);
    if (embedMatch) {
      return embedMatch[1].trim();
    }

    const markdownImageMatch = /^!\[[^\]]*\]\(([^)]+)\)$/u.exec(trimmed);
    if (markdownImageMatch) {
      return markdownImageMatch[1].trim();
    }

    return trimmed;
  }

  function isImagePath(path: string): boolean {
    const extensionIndex = path.lastIndexOf(".");
    if (extensionIndex === -1) {
      return false;
    }
    return IMAGE_EXTENSIONS.has(path.slice(extensionIndex + 1).toLowerCase());
  }

  function resolveImageFile(
    value: unknown,
    sourceFile: TFile | null,
  ): TFile | null {
    const unwrapped = unwrapValue(value);
    if (unwrapped instanceof TFile) {
      return isImagePath(unwrapped.path) ? unwrapped : null;
    }

    if (typeof unwrapped !== "string") {
      return null;
    }

    const imagePath = imagePathFromText(unwrapped);
    if (!isImagePath(imagePath)) {
      return null;
    }

    return (
      app.metadataCache.getFirstLinkpathDest(
        imagePath,
        sourceFile?.path ?? "",
      ) ?? app.vault.getFileByPath(imagePath)
    );
  }

  $effect(() => {
    resourceUrl = "";

    if (!imageFile) {
      return;
    }

    return loadBasesResourceUrl(app, imageFile, (url) => {
      resourceUrl = url;
    });
  });
</script>

<div
  class="bases-card__image bases-style-rounded-t-lg-bc0d7f"
  style={`height: ${height}px; background-size: ${fit}; background-image: ${resourceUrl ? `url("${resourceUrl}")` : "none"}; background-position: center; background-repeat: no-repeat;`}
></div>
