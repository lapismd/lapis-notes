import { getFrontMatterInfo } from "./cache.svelte";
import type { App } from "./context.svelte";
import { TFile } from "./storage/fs";
import type { DataWriteOptions, TAbstractFile, TFolder } from "./storage/fs";
import { joinPath } from "./storage/path";
import {
  defaultLinkSettings,
  generateInternalLink,
  type LinkSettings,
  type VaultIndex,
} from "./links";
import { parseLinktext } from "./utils";

const FRONTMATTER_RETRY_ERROR = "__lapis_frontmatter_retry__";

/**
 * High-level helpers for vault file operations that need metadata-aware
 * follow-up work.
 *
 * @public
 */
export class FileManager {
  constructor(readonly app: App) {}

  private cloneFrontmatter(
    frontmatter: Record<string, unknown>,
  ): Record<string, unknown> {
    return JSON.parse(JSON.stringify(frontmatter));
  }

  private async readFrontmatterSeed(
    file: TFile,
    content?: string,
  ): Promise<Record<string, unknown>> {
    const cachedFrontmatter =
      this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (cachedFrontmatter && typeof cachedFrontmatter === "object") {
      return this.cloneFrontmatter(
        cachedFrontmatter as Record<string, unknown>,
      );
    }

    const fileContent = content ?? (await this.app.vault.read(file));
    const metadata = await this.app.metadataCache.read(fileContent, file);
    if (metadata?.frontmatter && typeof metadata.frontmatter === "object") {
      return this.cloneFrontmatter(
        metadata.frontmatter as Record<string, unknown>,
      );
    }

    return {};
  }

  private isFrontmatterEqual(
    left: Record<string, unknown>,
    right: Record<string, unknown>,
  ): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  private writeUpdatedFrontmatter(
    file: TFile,
    data: string,
    frontmatter: Record<string, unknown>,
  ): string {
    const info = getFrontMatterInfo(data);
    const hasEntries = Object.keys(frontmatter).length > 0;

    if (!hasEntries) {
      return info.exists ? data.slice(info.contentStart) : data;
    }

    const updated = this.app.metadataCache.writeFrontmatter(file, frontmatter);
    const block = `---\n${updated}\n---\n`;

    if (info.exists) {
      return `${data.slice(0, info.from)}${block}${data.slice(info.contentStart)}`;
    }

    return `${block}${data}`;
  }

  private getLinkSettings(): LinkSettings {
    const config = this.app.configuration.getConfiguration();
    return {
      newLinkFormat: config.get(
        "files.links.newLinkFormat",
        defaultLinkSettings.newLinkFormat,
      ),
      useWikilinks: config.get(
        "files.links.useWikilinks",
        defaultLinkSettings.useWikilinks,
      ),
      omitMarkdownExtension: config.get(
        "files.links.omitMarkdownExtension",
        defaultLinkSettings.omitMarkdownExtension,
      ),
      useShortestUniqueSuffix: config.get(
        "files.links.useShortestUniqueSuffix",
        defaultLinkSettings.useShortestUniqueSuffix,
      ),
    };
  }

  private buildVaultIndex(): VaultIndex {
    return {
      getFiles: () =>
        this.app.vault.getFiles().map((file) => ({
          path: file.path,
          basename: file.basename,
          extension: file.extension,
        })),
    };
  }

  private getReplacementLink(
    sourcePath: string,
    targetPath: string,
    originalLink: string,
    originalText: string,
  ): string {
    const parsed = parseLinktext(originalLink);
    const isEmbed = originalText.startsWith("!");
    const alias = this.extractAlias(originalText);

    return generateInternalLink({
      targetPath,
      sourcePath,
      alias,
      embed: isEmbed,
      heading: parsed.subpath?.startsWith("^") ? undefined : parsed.subpath,
      blockId: parsed.subpath?.startsWith("^")
        ? parsed.subpath.slice(1)
        : undefined,
      settings: this.getLinkSettings(),
      vaultIndex: this.buildVaultIndex(),
    });
  }

  private extractAlias(originalText: string): string | undefined {
    if (originalText.startsWith("[[") || originalText.startsWith("![[")) {
      const body = originalText.replace(/^!?\[\[/, "").replace(/\]\]$/, "");
      const separator = body.indexOf("|");
      if (separator === -1) {
        return undefined;
      }
      const alias = body.slice(separator + 1).trim();
      return alias.length ? alias : undefined;
    }

    const markdownMatch = /^!?\[(.*)]\((.*)\)$/.exec(originalText);
    if (!markdownMatch) {
      return undefined;
    }

    const alias = markdownMatch[1]?.trim();
    if (!alias.length) {
      return undefined;
    }

    return alias;
  }

  private collectRenameEdits(
    file: TFile,
    newPath: string,
  ): Array<{
    sourcePath: string;
    refs: Array<{
      start: number;
      end: number;
      link: string;
      original: string;
    }>;
  }> {
    const editsBySource = new Map<
      string,
      Array<{ start: number; end: number; link: string; original: string }>
    >();

    for (const [sourceFile, cache] of this.app.metadataCache.getAllItems()) {
      const refs = [...(cache.links ?? []), ...(cache.embeds ?? [])];
      for (const ref of refs) {
        const resolved = this.app.metadataCache.getFirstLinkpathDest(
          ref.link,
          sourceFile.path,
        );
        if (resolved?.path !== file.path) {
          continue;
        }

        const sourceEdits = editsBySource.get(sourceFile.path) ?? [];
        sourceEdits.push({
          start: ref.position.start.offset,
          end: ref.position.end.offset,
          link: ref.link,
          original: ref.original,
        });
        editsBySource.set(sourceFile.path, sourceEdits);
      }
    }

    return [...editsBySource.entries()].map(([sourcePath, refs]) => ({
      sourcePath,
      refs: refs.sort((left, right) => right.start - left.start),
    }));
  }

  /**
   * Gets the folder that new files should be saved to, given the user's
   * preferences.
   *
   * @param sourcePath - The path to the current open/focused file, used when
   *   the user wants new files to be created 'in the same folder'. Use an empty
   *   string if there is no active file.
   * @param newFilePath - The path to the file that will be newly created, used
   *   to infer what settings to use based on the path's extension.
   * @public
   */
  getNewFileParent(sourcePath: string, newFilePath?: string): TFolder {
    return this.app.vault.getRoot();
  }

  getAvailablePathForAttachment(filename: string, sourcePath?: string): string {
    const parent = this.getNewFileParent(sourcePath ?? "", filename);
    const extMatch = /(\.[^.]*)$/.exec(filename);
    const stem = extMatch ? filename.slice(0, -extMatch[1].length) : filename;
    const ext = extMatch?.[1] ?? "";
    let index = 0;
    let path = joinPath(parent.path, filename);
    while (this.app.vault.getAbstractFileByPath(path)) {
      index += 1;
      path = joinPath(parent.path, `${stem} ${index}${ext}`);
    }
    return path;
  }

  /**
   * Rename or move a file safely, and update all links to it depending on the
   * user's preferences.
   *
   * @param file - The file to rename
   * @param newPath - The new path for the file
   * @public
   */
  renameFile(file: TAbstractFile, newPath: string): Promise<void> {
    if (!(file instanceof TFile)) {
      return this.app.vault.rename(file, newPath);
    }

    const edits = this.collectRenameEdits(file, newPath);
    return this.app.vault.rename(file, newPath).then(async () => {
      for (const edit of edits) {
        const sourcePath =
          edit.sourcePath === file.path ? newPath : edit.sourcePath;
        const sourceFile = this.app.vault.getFileByPath(sourcePath);
        if (!sourceFile) {
          continue;
        }

        await this.app.vault.process(sourceFile, (data) => {
          let next = data;
          for (const ref of edit.refs) {
            const replacement = this.getReplacementLink(
              sourcePath,
              newPath,
              ref.link,
              ref.original,
            );
            next = next.slice(0, ref.start) + replacement + next.slice(ref.end);
          }
          return next;
        });
      }
    });
  }

  /**
   * Remove a file or a folder from the vault according the user's preferred
   * 'trash' options (either moving the file to .trash/ or the OS trash bin).
   *
   * @param file
   * @public
   */
  trashFile(file: TAbstractFile): Promise<void> {
    return this.app.vault.trash(file, true);
  }

  promptForDeletion(file: TAbstractFile): Promise<void> {
    return this.trashFile(file);
  }

  /**
   * Generate a Markdown link based on the user's preferences.
   *
   * @param file - The file to link to.
   * @param sourcePath - Where the link is stored in, used to compute relative
   *   links.
   * @param subpath - A subpath, starting with `#`, used for linking to headings
   *   or blocks.
   * @param alias - The display text if it's to be different than the file name.
   *   Pass empty string to use file name.
   * @public
   */
  generateMarkdownLink(
    file: TFile,
    sourcePath: string,
    subpath?: string,
    alias?: string,
  ): string {
    const normalizedSubpath = subpath?.trim() ?? "";

    return generateInternalLink({
      targetPath: file.path,
      sourcePath,
      alias,
      heading:
        normalizedSubpath.startsWith("#^") || !normalizedSubpath.length
          ? undefined
          : normalizedSubpath.replace(/^#/, ""),
      blockId: normalizedSubpath.startsWith("#^")
        ? normalizedSubpath.slice(2)
        : undefined,
      settings: this.getLinkSettings(),
      vaultIndex: this.buildVaultIndex(),
    });
  }

  /**
   * Atomically read, modify, and save the frontmatter of a note. The
   * frontmatter is passed in as a JS object, and should be mutated directly to
   * achieve the desired result.
   *
   * Remember to handle errors thrown by this method.
   *
   * @example
   *   ```ts
   *   app.fileManager.processFrontMatter(file, (frontmatter) => {
   *       frontmatter['key1'] = value;
   *       delete frontmatter['key2'];
   *   });
   *   ```;
   *
   * @param file - The file to be modified. Must be a Markdown file.
   * @param fn - A callback function which mutates the frontmatter object
   *   synchronously.
   * @param options - Write options.
   * @throws YAMLParseError if the YAML parsing fails
   * @throws Any errors that your callback function throws
   * @public
   */
  processFrontMatter(
    file: TFile,
    fn: (frontmatter: any) => void,
    options?: DataWriteOptions,
  ): Promise<void> {
    const attempt = async (): Promise<void> => {
      const snapshot = await this.app.vault.read(file);
      const seedFrontmatter = await this.readFrontmatterSeed(file, snapshot);
      const nextFrontmatter = this.cloneFrontmatter(seedFrontmatter);
      fn(nextFrontmatter);

      if (this.isFrontmatterEqual(seedFrontmatter, nextFrontmatter)) {
        return;
      }

      try {
        await this.app.vault.process(
          file,
          (data) => {
            if (data !== snapshot) {
              throw new Error(FRONTMATTER_RETRY_ERROR);
            }

            return this.writeUpdatedFrontmatter(file, data, nextFrontmatter);
          },
          options,
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === FRONTMATTER_RETRY_ERROR
        ) {
          return attempt();
        }
        throw error;
      }
    };

    return attempt();
  }
}
