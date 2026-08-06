import { sha256Hex, verifySha256 } from "./hashes";
import { assertSafePluginRelativePath } from "./path-safety";
import {
  PLUGIN_BUNDLE_RELEASE_MANIFEST_PATH,
  parsePluginBundle,
} from "./plugin-bundle";
import {
  parsePluginDistributionMetadata,
  pluginReleaseManifestSchema,
  signedEnvelopeSchema,
} from "./schemas";
import { verifySignedEnvelope } from "./signing";
import { PluginDistributionError } from "./errors";
import type {
  PluginReleaseManifest,
  RemoteFileReference,
  SignedEnvelope,
  TrustedSigningKey,
} from "./types";

export type PluginBundleVerificationProgressPhase =
  | "verifying-bundle"
  | "extracting-files"
  | "verifying-files";

export interface PluginBundleVerificationProgressEvent {
  phase: PluginBundleVerificationProgressPhase;
  message?: string;
  filePath?: string;
  fileIndex?: number;
  fileCount?: number;
  processedBytes?: number;
  totalBytes?: number;
}

export interface VerifyPluginBundlePayloadOptions {
  bundle: ArrayBuffer | Uint8Array;
  trustedKeys: TrustedSigningKey[];
  expectedBundle?: RemoteFileReference;
  signal?: AbortSignal;
  onProgress?: (event: PluginBundleVerificationProgressEvent) => void;
}

export interface VerifiedPluginBundlePayload {
  releaseEnvelope: SignedEnvelope<PluginReleaseManifest>;
  releaseManifest: PluginReleaseManifest;
  releaseManifestSha256: string;
  files: Map<string, Uint8Array>;
}

export const verifyPluginBundlePayload = async (
  options: VerifyPluginBundlePayloadOptions,
): Promise<VerifiedPluginBundlePayload> => {
  throwIfAborted(options.signal);
  const bundle = toUint8(options.bundle);
  options.onProgress?.({
    phase: "verifying-bundle",
    message: "Verifying plugin bundle",
  });

  if (
    typeof options.expectedBundle?.size === "number" &&
    bundle.byteLength !== options.expectedBundle.size
  ) {
    throw new PluginDistributionError(
      "hash-mismatch",
      `Plugin bundle size mismatch: expected ${options.expectedBundle.size}, got ${bundle.byteLength}.`,
      {
        details: {
          expectedSize: options.expectedBundle.size,
          actualSize: bundle.byteLength,
        },
      },
    );
  }
  if (options.expectedBundle?.sha256) {
    await verifySha256(bundle, options.expectedBundle.sha256);
  }

  throwIfAborted(options.signal);
  const bundledFiles = parsePluginBundle(bundle, {
    onProgress: options.onProgress,
  });
  const signedReleaseBytes = bundledFiles.get(
    PLUGIN_BUNDLE_RELEASE_MANIFEST_PATH,
  );
  if (!signedReleaseBytes) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin bundle is missing release.signed.json.",
    );
  }
  const releaseEnvelope = parsePluginDistributionMetadata(
    signedEnvelopeSchema(pluginReleaseManifestSchema),
    JSON.parse(new TextDecoder().decode(signedReleaseBytes)),
  );
  const releaseManifest = await verifySignedEnvelope(
    releaseEnvelope,
    options.trustedKeys,
  );
  const files = new Map<string, Uint8Array>();
  const expectedPaths = new Set<string>();
  const fileCount = releaseManifest.files.length;
  for (const [index, file] of releaseManifest.files.entries()) {
    throwIfAborted(options.signal);
    assertSafePluginRelativePath(file.path);
    expectedPaths.add(file.path);
    const bytes = bundledFiles.get(file.path);
    if (!bytes) {
      throw new PluginDistributionError(
        "metadata-invalid",
        `Plugin bundle is missing signed file: ${file.path}`,
        { details: { path: file.path } },
      );
    }
    if (bytes.byteLength !== file.size) {
      throw new PluginDistributionError(
        "hash-mismatch",
        `Plugin file ${file.path} size mismatch: expected ${file.size}, got ${bytes.byteLength}.`,
        {
          details: {
            path: file.path,
            expectedSize: file.size,
            actualSize: bytes.byteLength,
          },
        },
      );
    }
    options.onProgress?.({
      phase: "verifying-files",
      message: `Verifying ${file.path}`,
      filePath: file.path,
      fileIndex: index + 1,
      fileCount,
    });
    await verifySha256(bytes, file.sha256);
    files.set(file.path, bytes);
  }

  const extraPaths = [...bundledFiles.keys()].filter(
    (path) =>
      path !== PLUGIN_BUNDLE_RELEASE_MANIFEST_PATH && !expectedPaths.has(path),
  );
  if (extraPaths.length) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin bundle includes files that are not listed in the signed release manifest.",
      { details: { paths: extraPaths } },
    );
  }

  return {
    releaseEnvelope,
    releaseManifest,
    releaseManifestSha256: await sha256Hex(signedReleaseBytes),
    files,
  };
};

export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (!signal?.aborted) {
    return;
  }
  throw createAbortError();
}

export function createAbortError(): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException("Operation cancelled", "AbortError");
  }
  const error = new Error("Operation cancelled");
  error.name = "AbortError";
  return error;
}

export function exactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

const toUint8 = (input: ArrayBuffer | Uint8Array): Uint8Array =>
  input instanceof Uint8Array ? input : new Uint8Array(input);
