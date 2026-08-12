import type {
  LanguageServiceWorkerMessage,
  LanguageServiceWorkerRequest,
  LanguageServiceWorkerResponse,
  LanguageServiceWorkerResult,
} from "@lapis-notes/api/language-service";

type WorkerHandlers = {
  [K in LanguageServiceWorkerRequest["type"]]: (
    request: Extract<LanguageServiceWorkerRequest, { type: K }>,
  ) =>
    | Promise<Extract<LanguageServiceWorkerResponse, { type: K }>>
    | Extract<LanguageServiceWorkerResponse, { type: K }>;
};

export function registerLanguageServiceWorker(
  handlers: Partial<WorkerHandlers>,
): void {
  self.onmessage = async (
    event: MessageEvent<LanguageServiceWorkerMessage>,
  ) => {
    const { id, payload } = event.data;
    try {
      const handler = handlers[payload.type];
      if (!handler)
        throw new Error(
          `Unknown language service worker request: ${payload.type}`,
        );
      const workerHandler = handler as (
        request: LanguageServiceWorkerRequest,
      ) =>
        | Promise<LanguageServiceWorkerResponse>
        | LanguageServiceWorkerResponse;
      postMessage({
        id,
        ok: true,
        payload: await workerHandler(payload),
      } satisfies LanguageServiceWorkerResult);
    } catch (error) {
      postMessage({
        id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      } satisfies LanguageServiceWorkerResult);
    }
  };
}
