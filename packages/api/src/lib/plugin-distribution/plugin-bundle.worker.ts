import {
  type PluginBundleWorkerResponse,
  type PluginBundleWorkerVerifyRequest,
  serializeWorkerError,
} from "./plugin-bundle-worker";
import { verifyPluginBundlePayload } from "./plugin-bundle-verifier";

interface PluginBundleWorkerGlobal {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<PluginBundleWorkerVerifyRequest>) => void,
  ): void;
  postMessage(
    message: PluginBundleWorkerResponse,
    transfer?: Transferable[],
  ): void;
}

const worker = self as unknown as PluginBundleWorkerGlobal;

worker.addEventListener(
  "message",
  async (event: MessageEvent<PluginBundleWorkerVerifyRequest>) => {
    if (event.data.type !== "verify") {
      return;
    }
    try {
      const payload = await verifyPluginBundlePayload({
        bundle: event.data.bundle,
        trustedKeys: event.data.trustedKeys,
        expectedBundle: event.data.expectedBundle,
        onProgress: (progress) => {
          worker.postMessage({
            type: "progress",
            progress,
          } satisfies PluginBundleWorkerResponse);
        },
      });
      const files = [...payload.files.entries()];
      worker.postMessage(
        {
          type: "result",
          payload: {
            releaseEnvelope: payload.releaseEnvelope,
            releaseManifest: payload.releaseManifest,
            releaseManifestSha256: payload.releaseManifestSha256,
            files,
          },
        } satisfies PluginBundleWorkerResponse,
        files.map(([, bytes]) => bytes.buffer as ArrayBuffer),
      );
    } catch (error) {
      worker.postMessage({
        type: "error",
        error: serializeWorkerError(error),
      } satisfies PluginBundleWorkerResponse);
    }
  },
);

export {};
