import type { App, TAbstractFile, TFile } from "@lapis-notes/api";
import type {
  MiraFileAdapter,
  MiraFileRef,
  MiraFileTarget,
} from "@lapismd/mira/extensions";

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

function isMarkdown(file: TFile): boolean {
  return file.extension === "md" || file.extension === "markdown";
}

export function toMiraFileRef(file: TFile): MiraFileRef {
  return {
    path: file.path,
    name: file.name,
    extension: file.extension,
    kind: isMarkdown(file)
      ? "markdown"
      : IMAGE_EXTENSIONS.has(file.extension.toLocaleLowerCase())
        ? "image"
        : "unknown",
  };
}

function fileFromRef(app: App, file: MiraFileRef): TFile | null {
  return app.vault.getFileByPath(file.path);
}

function resolveFile(app: App, target: MiraFileTarget): TFile | null {
  if (!target.path && target.sourcePath) {
    return app.vault.getFileByPath(target.sourcePath);
  }
  return app.metadataCache.getFirstLinkpathDest(
    target.path,
    target.sourcePath ?? "",
  );
}

function isSameFile(candidate: TAbstractFile, path: string): boolean {
  return isFile(candidate) && candidate.path === path;
}

function isFile(candidate: TAbstractFile): candidate is TFile {
  return "stat" in candidate && !("children" in candidate);
}

const adapters = new WeakMap<App, MiraFileAdapter>();

export function createLapisMiraFileAdapter(app: App): MiraFileAdapter {
  const existing = adapters.get(app);
  if (existing) return existing;

  const adapter: MiraFileAdapter = {
    resolveLink(target) {
      const file = resolveFile(app, target);
      return file ? toMiraFileRef(file) : null;
    },

    async readMarkdown(file) {
      const resolved = fileFromRef(app, file);
      return resolved && isMarkdown(resolved)
        ? app.vault.cachedRead(resolved)
        : null;
    },

    async writeMarkdown(file, value) {
      const resolved = fileFromRef(app, file);
      if (!resolved) {
        throw new Error(`Markdown file not found: ${file.path}`);
      }
      if (!isMarkdown(resolved)) {
        throw new Error(`Cannot write non-Markdown file: ${file.path}`);
      }
      await app.vault.modify(resolved, value);
    },

    openFile(file) {
      const resolved = fileFromRef(app, file);
      return resolved ? app.openFile(resolved) : undefined;
    },

    renderEmbed(target, element) {
      const file = fileFromRef(app, target.file);
      if (!file) return false;

      if (IMAGE_EXTENSIONS.has(file.extension.toLocaleLowerCase())) {
        let disposed = false;
        let resourceUrl: string | null = null;
        const image = document.createElement("img");
        image.alt = target.label || file.name;
        if (target.width) image.width = target.width;
        if (target.height) image.height = target.height;
        element.replaceChildren(image);
        void app.vault.getResourceUrl(file).then((url) => {
          if (disposed) {
            app.vault.revokeResourceUrl(url);
            return;
          }
          resourceUrl = url;
          image.src = url;
        });
        return () => {
          disposed = true;
          image.remove();
          if (resourceUrl) app.vault.revokeResourceUrl(resourceUrl);
        };
      }

      const renderer = app.embedRegistry.get(file.extension);
      if (!renderer) return false;
      const handle = renderer({
        app,
        containerEl: element,
        state: {
          file,
          id: target.href,
          text: target.label,
          sourcePath: target.sourcePath,
        },
      });
      return () => {
        void handle?.destroy?.();
        element.replaceChildren();
      };
    },

    listFiles() {
      return app.vault.getAllLoadedFiles().filter(isFile).map(toMiraFileRef);
    },

    getHeadings(file) {
      const resolved = fileFromRef(app, file);
      if (!resolved) return [];
      return (app.metadataCache.getFileCache(resolved)?.headings ?? []).map(
        (heading) => ({
          id: heading.heading,
          text: heading.heading,
          level: heading.level,
        }),
      );
    },

    watchFile(file, callback) {
      const changed = app.metadataCache.on("changed", (candidate) => {
        if (candidate.path === file.path) callback();
      });
      const deleted = app.metadataCache.on("deleted", (candidate) => {
        if (candidate.path === file.path) callback();
      });
      const modified = app.vault.on("modify", (candidate) => {
        if (isSameFile(candidate, file.path)) callback();
      });
      const renamed = app.vault.on("rename", (candidate, oldPath) => {
        if (oldPath === file.path || isSameFile(candidate, file.path))
          callback();
      });
      return () => {
        app.metadataCache.offref(changed);
        app.metadataCache.offref(deleted);
        app.vault.offref(modified);
        app.vault.offref(renamed);
      };
    },

    watchTarget(_target, callback) {
      const loaded = app.metadataCache.on("loaded", callback);
      const created = app.vault.on("create", callback);
      const deleted = app.vault.on("delete", callback);
      const renamed = app.vault.on("rename", callback);
      return () => {
        app.metadataCache.offref(loaded);
        app.vault.offref(created);
        app.vault.offref(deleted);
        app.vault.offref(renamed);
      };
    },
  };
  adapters.set(app, adapter);
  return adapter;
}
