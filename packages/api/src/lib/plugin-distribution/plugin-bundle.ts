import { Unzip, UnzipInflate } from "fflate";
import { PluginDistributionError } from "./errors";
import { assertSafePluginRelativePath } from "./path-safety";

export const PLUGIN_BUNDLE_RELEASE_MANIFEST_PATH = "release.signed.json";
export const PLUGIN_BUNDLE_STORED_METHOD = 0;
export const PLUGIN_BUNDLE_DEFLATE_METHOD = 8;

interface PluginBundleEntryMetadata {
  path: string;
  compressionMethod: number;
  localHeaderOffset: number;
  uncompressedSize: number;
}

export interface ParsePluginBundleProgressEvent {
  phase: "extracting-files";
  message?: string;
  filePath?: string;
  fileIndex?: number;
  fileCount?: number;
  processedBytes?: number;
  totalBytes?: number;
}

export interface ParsePluginBundleOptions {
  onProgress?: (event: ParsePluginBundleProgressEvent) => void;
}

export const parsePluginBundle = (
  input: ArrayBuffer | Uint8Array,
  options: ParsePluginBundleOptions = {},
): Map<string, Uint8Array> => {
  const bytes = toUint8(input);
  const expectedEntries = inspectPluginBundleMetadata(bytes);
  const entries = new Map<string, Uint8Array>();
  let seenFileCount = 0;
  let processedBytes = 0;
  const fileCount = expectedEntries.length;
  const totalBytes = expectedEntries.reduce(
    (sum, entry) => sum + entry.uncompressedSize,
    0,
  );
  let firstError: PluginDistributionError | null = null;

  const unzip = new Unzip((file) => {
    if (firstError) {
      return;
    }
    try {
      const expectedEntry = expectedEntries[seenFileCount];
      const fileIndex = seenFileCount + 1;
      seenFileCount += 1;
      if (!expectedEntry) {
        throw invalidBundle(
          `Unexpected file in .lapis-plugin bundle: ${file.name}`,
        );
      }
      if (
        file.name !== expectedEntry.path ||
        file.compression !== expectedEntry.compressionMethod
      ) {
        throw invalidBundle(
          `Plugin bundle local entry order or method is invalid: ${file.name}`,
        );
      }
      assertBundlePath(file.name);
      if (entries.has(file.name)) {
        throw invalidBundle(
          `Duplicate file in .lapis-plugin bundle: ${file.name}`,
        );
      }
      if (!isSupportedCompressionMethod(file.compression)) {
        throw invalidBundle(
          `Unsupported plugin bundle compression method ${file.compression}: ${file.name}`,
        );
      }

      const chunks: Uint8Array[] = [];
      let byteLength = 0;
      file.ondata = (error, chunk, final) => {
        if (error) {
          firstError = invalidBundle(
            `Unable to extract plugin bundle file: ${file.name}`,
            error,
          );
          return;
        }
        chunks.push(chunk);
        byteLength += chunk.byteLength;
        processedBytes += chunk.byteLength;
        options.onProgress?.({
          phase: "extracting-files",
          message: `Extracting ${file.name}`,
          filePath: file.name,
          fileIndex,
          fileCount,
          processedBytes,
          totalBytes,
        });
        if (final) {
          entries.set(file.name, concatChunks(chunks, byteLength));
        }
      };
      file.start();
    } catch (error) {
      firstError = toInvalidBundleError(error);
    }
  });
  unzip.register(UnzipInflate);

  try {
    unzip.push(bytes, true);
  } catch (error) {
    firstError = toInvalidBundleError(error);
  }

  if (firstError) {
    throw firstError;
  }
  if (seenFileCount !== expectedEntries.length) {
    throw invalidBundle(".lapis-plugin bundle entry count is invalid.");
  }
  for (const expectedEntry of expectedEntries) {
    if (!entries.has(expectedEntry.path)) {
      throw invalidBundle(
        `.lapis-plugin bundle did not extract ${expectedEntry.path}.`,
      );
    }
  }
  if (!entries.has(PLUGIN_BUNDLE_RELEASE_MANIFEST_PATH)) {
    throw invalidBundle(".lapis-plugin bundle is missing release.signed.json.");
  }
  return entries;
};

const inspectPluginBundleMetadata = (
  bytes: Uint8Array,
): PluginBundleEntryMetadata[] => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(view);
  const totalEntries = readUint16(view, eocdOffset + 10);
  const centralDirectorySize = readUint32(view, eocdOffset + 12);
  const centralDirectoryOffset = readUint32(view, eocdOffset + 16);

  if (
    readUint16(view, eocdOffset + 4) !== 0 ||
    readUint16(view, eocdOffset + 6) !== 0 ||
    readUint16(view, eocdOffset + 8) !== totalEntries
  ) {
    throw invalidBundle("Multi-disk .lapis-plugin bundles are not supported.");
  }
  if (
    totalEntries === 0xffff ||
    centralDirectorySize === 0xffffffff ||
    centralDirectoryOffset === 0xffffffff
  ) {
    throw invalidBundle("ZIP64 .lapis-plugin bundles are not supported.");
  }
  assertRange(
    centralDirectoryOffset,
    centralDirectorySize,
    bytes.byteLength,
    "central directory",
  );

  const decoder = new TextDecoder();
  const entries: PluginBundleEntryMetadata[] = [];
  const seenPaths = new Set<string>();
  let offset = centralDirectoryOffset;
  for (let index = 0; index < totalEntries; index += 1) {
    assertSignature(view, offset, 0x02014b50, "central directory entry");
    const flags = readUint16(view, offset + 8);
    const compressionMethod = readUint16(view, offset + 10);
    const compressedSize = readUint32(view, offset + 20);
    const uncompressedSize = readUint32(view, offset + 24);
    const nameLength = readUint16(view, offset + 28);
    const extraLength = readUint16(view, offset + 30);
    const commentLength = readUint16(view, offset + 32);
    const localHeaderOffset = readUint32(view, offset + 42);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    assertRange(nameStart, nameLength, bytes.byteLength, "entry name");
    const path = decoder.decode(bytes.subarray(nameStart, nameEnd));

    assertBundlePath(path);
    if (seenPaths.has(path)) {
      throw invalidBundle(`Duplicate file in .lapis-plugin bundle: ${path}`);
    }
    seenPaths.add(path);
    if ((flags & 0x41) !== 0) {
      throw invalidBundle(
        `Encrypted plugin bundle file is not supported: ${path}`,
      );
    }
    if (!isSupportedCompressionMethod(compressionMethod)) {
      throw invalidBundle(
        `Unsupported plugin bundle compression method ${compressionMethod}: ${path}`,
      );
    }
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw invalidBundle(
        `ZIP64 plugin bundle file metadata is not supported: ${path}`,
      );
    }
    entries.push({
      ...inspectLocalEntry({
        bytes,
        view,
        decoder,
        path,
        localHeaderOffset,
        compressionMethod,
        flags,
      }),
      uncompressedSize,
    });

    offset += 46 + nameLength + extraLength + commentLength;
  }

  if (offset !== centralDirectoryOffset + centralDirectorySize) {
    throw invalidBundle(".lapis-plugin central directory size is invalid.");
  }

  const localOrder = [...entries].sort(
    (left, right) => left.localHeaderOffset - right.localHeaderOffset,
  );
  const firstEntry = localOrder[0];
  if (firstEntry?.path !== PLUGIN_BUNDLE_RELEASE_MANIFEST_PATH) {
    throw invalidBundle(
      ".lapis-plugin bundle must store release.signed.json as the first entry.",
    );
  }
  if (firstEntry.compressionMethod !== PLUGIN_BUNDLE_STORED_METHOD) {
    throw invalidBundle(
      ".lapis-plugin release.signed.json entry must be stored.",
    );
  }
  if (!seenPaths.has(PLUGIN_BUNDLE_RELEASE_MANIFEST_PATH)) {
    throw invalidBundle(".lapis-plugin bundle is missing release.signed.json.");
  }
  return localOrder;
};

const inspectLocalEntry = ({
  bytes,
  view,
  decoder,
  path,
  localHeaderOffset,
  compressionMethod,
  flags,
}: {
  bytes: Uint8Array;
  view: DataView;
  decoder: TextDecoder;
  path: string;
  localHeaderOffset: number;
  compressionMethod: number;
  flags: number;
}): Omit<PluginBundleEntryMetadata, "uncompressedSize"> => {
  assertSignature(view, localHeaderOffset, 0x04034b50, "local file header");
  const localFlags = readUint16(view, localHeaderOffset + 6);
  const localCompressionMethod = readUint16(view, localHeaderOffset + 8);
  const nameLength = readUint16(view, localHeaderOffset + 26);
  const extraLength = readUint16(view, localHeaderOffset + 28);
  const nameStart = localHeaderOffset + 30;
  const nameEnd = nameStart + nameLength;
  assertRange(nameStart, nameLength, bytes.byteLength, "local entry name");
  assertRange(nameEnd, extraLength, bytes.byteLength, "local entry extra");
  const localPath = decoder.decode(bytes.subarray(nameStart, nameEnd));
  if (
    localPath !== path ||
    localFlags !== flags ||
    localCompressionMethod !== compressionMethod
  ) {
    throw invalidBundle(`Plugin bundle local header mismatch: ${path}`);
  }
  return { path, compressionMethod, localHeaderOffset };
};

const assertBundlePath = (path: string): void => {
  if (path.endsWith("/")) {
    throw invalidBundle(`Plugin bundle directories are not supported: ${path}`);
  }
  if (path === PLUGIN_BUNDLE_RELEASE_MANIFEST_PATH) {
    return;
  }
  assertSafePluginRelativePath(path);
};

const isSupportedCompressionMethod = (compressionMethod: number): boolean =>
  compressionMethod === PLUGIN_BUNDLE_STORED_METHOD ||
  compressionMethod === PLUGIN_BUNDLE_DEFLATE_METHOD;

const findEndOfCentralDirectory = (view: DataView): number => {
  const minimumSize = 22;
  const minOffset = Math.max(0, view.byteLength - 0xffff - minimumSize);
  for (
    let offset = view.byteLength - minimumSize;
    offset >= minOffset;
    offset -= 1
  ) {
    if (readUint32(view, offset) !== 0x06054b50) {
      continue;
    }
    const commentLength = readUint16(view, offset + 20);
    if (offset + minimumSize + commentLength === view.byteLength) {
      return offset;
    }
  }
  throw invalidBundle(".lapis-plugin bundle is not a ZIP-compatible archive.");
};

const assertSignature = (
  view: DataView,
  offset: number,
  expected: number,
  label: string,
): void => {
  assertRange(offset, 4, view.byteLength, label);
  if (readUint32(view, offset) !== expected) {
    throw invalidBundle(`Invalid .lapis-plugin ${label}.`);
  }
};

const assertRange = (
  offset: number,
  length: number,
  totalLength: number,
  label: string,
): void => {
  if (
    !Number.isInteger(offset) ||
    !Number.isInteger(length) ||
    offset < 0 ||
    length < 0 ||
    offset + length > totalLength
  ) {
    throw invalidBundle(`Invalid .lapis-plugin ${label} range.`);
  }
};

const readUint16 = (view: DataView, offset: number): number =>
  view.getUint16(offset, true);

const readUint32 = (view: DataView, offset: number): number =>
  view.getUint32(offset, true);

const toUint8 = (input: ArrayBuffer | Uint8Array): Uint8Array =>
  input instanceof Uint8Array ? input : new Uint8Array(input);

const concatChunks = (chunks: Uint8Array[], byteLength: number): Uint8Array => {
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
};

const toInvalidBundleError = (error: unknown): PluginDistributionError =>
  error instanceof PluginDistributionError
    ? error
    : invalidBundle(
        error instanceof Error
          ? error.message
          : ".lapis-plugin bundle is invalid.",
        error,
      );

const invalidBundle = (
  message: string,
  cause?: unknown,
): PluginDistributionError =>
  new PluginDistributionError("metadata-invalid", message, { cause });
