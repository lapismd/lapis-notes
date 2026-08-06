import { PluginDistributionError } from "./errors";
import {
  createAbortError,
  exactArrayBuffer,
  type PluginBundleVerificationProgressEvent,
  type VerifiedPluginBundlePayload,
  type VerifyPluginBundlePayloadOptions,
} from "./plugin-bundle-verifier";
import type {
  PluginReleaseManifest,
  RemoteFileReference,
  SignedEnvelope,
  TrustedSigningKey,
} from "./types";

export type PluginBundleVerificationMode = "auto" | "worker" | "main-thread";

export interface PluginBundleWorkerVerifyRequest {
  type: "verify";
  bundle: ArrayBuffer;
  trustedKeys: TrustedSigningKey[];
  expectedBundle?: RemoteFileReference;
}

export type PluginBundleWorkerResponse =
  | {
      type: "progress";
      progress: PluginBundleVerificationProgressEvent;
    }
  | {
      type: "result";
      payload: SerializedVerifiedPluginBundlePayload;
    }
  | {
      type: "error";
      error: SerializedPluginBundleWorkerError;
    };

export interface SerializedVerifiedPluginBundlePayload {
  releaseEnvelope: SignedEnvelope<PluginReleaseManifest>;
  releaseManifest: PluginReleaseManifest;
  releaseManifestSha256: string;
  files: Array<[string, Uint8Array]>;
}

export interface SerializedPluginBundleWorkerError {
  name: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export const canUsePluginBundleWorker = (): boolean =>
  typeof Worker !== "undefined";

export const verifyPluginBundlePayloadInWorker = async (
  options: VerifyPluginBundlePayloadOptions,
): Promise<VerifiedPluginBundlePayload> => {
  if (!canUsePluginBundleWorker()) {
    throw new Error("Plugin bundle worker is not available.");
  }
  const bundle = exactArrayBuffer(toUint8(options.bundle));
  return new Promise((resolve, reject) => {
    let settled = false;
    let worker: Worker | null = null;

    const settle = (callback: () => void, abortListener?: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (abortListener) {
        options.signal?.removeEventListener("abort", abortListener);
      }
      worker?.terminate();
      callback();
    };

    const abortListener = (): void => {
      settle(() => reject(createAbortError()), abortListener);
    };

    try {
      worker = createPluginBundleWorker();
    } catch (error) {
      reject(error);
      return;
    }

    if (options.signal?.aborted) {
      worker.terminate();
      reject(createAbortError());
      return;
    }

    const activeWorker = worker;
    options.signal?.addEventListener("abort", abortListener, { once: true });
    activeWorker.addEventListener("message", (event) => {
      const message = event.data as PluginBundleWorkerResponse;
      if (message.type === "progress") {
        options.onProgress?.(message.progress);
        return;
      }
      if (message.type === "result") {
        settle(
          () => resolve(deserializeVerifiedPayload(message.payload)),
          abortListener,
        );
        return;
      }
      if (message.type === "error") {
        settle(
          () => reject(deserializeWorkerError(message.error)),
          abortListener,
        );
      }
    });
    activeWorker.addEventListener("error", (event) => {
      const message = (event as ErrorEvent).message;
      settle(
        () =>
          reject(
            new Error(message || "Plugin bundle worker verification failed."),
          ),
        abortListener,
      );
    });

    activeWorker.postMessage(
      {
        type: "verify",
        bundle,
        trustedKeys: options.trustedKeys,
        ...(options.expectedBundle
          ? { expectedBundle: options.expectedBundle }
          : {}),
      } satisfies PluginBundleWorkerVerifyRequest,
      [bundle],
    );
  });
};

export const serializeWorkerError = (
  error: unknown,
): SerializedPluginBundleWorkerError => {
  if (error instanceof PluginDistributionError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { name: "Error", message: String(error) };
};

const createPluginBundleWorker = (): Worker =>
  new Worker(new URL("./plugin-bundle.worker.js", import.meta.url), {
    type: "module",
  });

const deserializeVerifiedPayload = (
  payload: SerializedVerifiedPluginBundlePayload,
): VerifiedPluginBundlePayload => ({
  releaseEnvelope: payload.releaseEnvelope,
  releaseManifest: payload.releaseManifest,
  releaseManifestSha256: payload.releaseManifestSha256,
  files: new Map(payload.files),
});

const deserializeWorkerError = (
  error: SerializedPluginBundleWorkerError,
): Error => {
  if (error.code) {
    return new PluginDistributionError(
      error.code as PluginDistributionError["code"],
      error.message,
      { details: error.details },
    );
  }
  const deserialized = new Error(error.message);
  deserialized.name = error.name;
  return deserialized;
};

const toUint8 = (input: ArrayBuffer | Uint8Array): Uint8Array =>
  input instanceof Uint8Array ? input : new Uint8Array(input);
