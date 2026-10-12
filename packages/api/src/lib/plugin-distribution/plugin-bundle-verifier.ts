import { sha256Hex, verifySha256 } from "./hashes";
import { assertSafePluginRelativePath } from "./path-safety";
import {
  PLUGIN_BUNDLE_RELEASE_MANIFEST_PATH,
  parsePluginBundle,
  parsePluginPayload,
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
  nostrProof?: {
    authorizationEventId: string;
    releaseEventId: string;
    decisionEventId: string;
    manifestSha256: string;
    artifactSha256: string;
    artifactSize: number;
    requiresRelayRefresh: boolean;
  };
}

export interface VerifiedNostrReleaseProofResult {
  pluginId: string;
  version: string;
  authorizationEventId: string;
  releaseEventId: string;
  decisionEventId: string;
  manifestSha256: string;
  artifactSha256: string;
  artifactSize: number;
  requiresRelayRefresh: true;
  manifest: {
    release: {
      metadata: Record<string, unknown>;
    };
  };
}

export type NostrReleaseProofVerifier = (
  proof: unknown,
  options: {
    artifact: Uint8Array | { sha256: string; size: number };
    trustedCuratorPubkeys: ReadonlySet<string>;
  },
) => VerifiedNostrReleaseProofResult | Promise<VerifiedNostrReleaseProofResult>;

export interface VerifyNostrPluginPayloadOptions {
  artifact: ArrayBuffer | Uint8Array;
  proof: unknown;
  trustedCuratorPubkeys: ReadonlySet<string>;
  verifyReleaseProof: NostrReleaseProofVerifier;
  signal?: AbortSignal;
  onProgress?: (event: PluginBundleVerificationProgressEvent) => void;
  /** True only when a live source reached its configured install quorum. */
  relayFresh?: boolean;
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

export const verifyNostrPluginPayload = async (
  options: VerifyNostrPluginPayloadOptions,
): Promise<VerifiedPluginBundlePayload> => {
  throwIfAborted(options.signal);
  const artifact = toUint8(options.artifact);
  options.onProgress?.({
    phase: "verifying-bundle",
    message: "Verifying Nostr release proof",
  });
  const verified = await options.verifyReleaseProof(options.proof, {
    artifact,
    trustedCuratorPubkeys: options.trustedCuratorPubkeys,
  });
  const releaseManifest = parsePluginDistributionMetadata(
    pluginReleaseManifestSchema,
    verified.manifest.release.metadata.lapisRelease,
  );
  if (
    releaseManifest.pluginId !== verified.pluginId ||
    releaseManifest.version !== verified.version
  ) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Nostr proof release coordinates do not match the plugin payload manifest.",
    );
  }

  const bundledFiles = parsePluginPayload(artifact, {
    onProgress: options.onProgress,
  });
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
        `Plugin payload is missing curated file: ${file.path}`,
      );
    }
    if (bytes.byteLength !== file.size) {
      throw new PluginDistributionError(
        "hash-mismatch",
        `Plugin file ${file.path} size mismatch: expected ${file.size}, got ${bytes.byteLength}.`,
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
    (path) => !expectedPaths.has(path),
  );
  if (extraPaths.length) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin payload includes files that are not listed in the curated release manifest.",
      { details: { paths: extraPaths } },
    );
  }

  return {
    releaseEnvelope: { signed: releaseManifest, signatures: [] },
    releaseManifest,
    releaseManifestSha256: verified.manifestSha256,
    files,
    nostrProof: {
      authorizationEventId: verified.authorizationEventId,
      releaseEventId: verified.releaseEventId,
      decisionEventId: verified.decisionEventId,
      manifestSha256: verified.manifestSha256,
      artifactSha256: verified.artifactSha256,
      artifactSize: verified.artifactSize,
      requiresRelayRefresh: options.relayFresh !== true,
    },
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
