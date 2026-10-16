import type { App } from "@lapis-notes/api";

const MAX_IMPORT_BYTES = 64 * 1024 * 1024;

/** Reuse the Explorer drop surface and App-owned exclusive new-file intent. */
export function importExplorerFiles(
  app: App,
  folder: string,
  files: readonly File[],
): Promise<void> {
  return app.fileEditingSessions.track(async () => {
    const imports = files.map((file) => {
      const name = file.name;
      if (!name || name === "." || name === ".." || /[\\/\0]/u.test(name))
        throw new Error("Import requires a single valid filename");
      if (
        !Number.isFinite(file.size) ||
        file.size < 0 ||
        file.size > MAX_IMPORT_BYTES
      )
        throw new Error("Imported files must be at most 64 MiB");
      return { file, path: folder ? `${folder}/${name}` : name };
    });
    for (const { file, path } of imports) {
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength > MAX_IMPORT_BYTES)
        throw new Error("Imported files must be at most 64 MiB");
      await app.fileManager.createFile(path, bytes, {
        mtime: file.lastModified,
      });
    }
  });
}
