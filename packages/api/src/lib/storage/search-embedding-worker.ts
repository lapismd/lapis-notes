import type { SearchDocumentRecord } from "./app-database";
import {
  createSearchEmbeddingProvider,
  type SearchEmbeddingProvider,
  type TransformersJsSearchEmbeddingProviderConfig,
} from "./search-embedding-provider";

type SearchEmbeddingWorkerRequest = {
  type: "search-embedding-request";
  requestId: string;
  method: "ready" | "embedDocument" | "embedQuery";
  config: TransformersJsSearchEmbeddingProviderConfig;
  argument?: unknown;
};

const workerScope = globalThis as unknown as {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<SearchEmbeddingWorkerRequest>) => void,
  ): void;
  postMessage(message: unknown): void;
};

let activeConfig = "";
let provider: SearchEmbeddingProvider | null = null;

async function ensureProvider(
  config: TransformersJsSearchEmbeddingProviderConfig,
): Promise<SearchEmbeddingProvider> {
  const serialized = JSON.stringify(config);
  if (provider && serialized === activeConfig) return provider;
  await provider?.dispose?.();
  provider = createSearchEmbeddingProvider(config);
  activeConfig = serialized;
  if (!provider) throw new Error("Embedding provider is unavailable");
  return provider;
}

function publishStatus(current: SearchEmbeddingProvider): void {
  workerScope.postMessage({
    type: "search-embedding-status",
    status: current.getRuntimeStatus(),
  });
}

workerScope.addEventListener("message", (event) => {
  const request = event.data;
  if (!request || request.type !== "search-embedding-request") return;

  void (async () => {
    let current: SearchEmbeddingProvider | null = null;
    let statusTimer: ReturnType<typeof setInterval> | null = null;
    try {
      current = await ensureProvider(request.config);
      publishStatus(current);
      statusTimer = setInterval(() => publishStatus(current!), 100);
      const result =
        request.method === "ready"
          ? await current.ready()
          : request.method === "embedDocument"
            ? await current.embedDocument(request.argument as SearchDocumentRecord)
            : await current.embedQuery(String(request.argument ?? ""));
      publishStatus(current);
      workerScope.postMessage({
        type: "search-embedding-response",
        requestId: request.requestId,
        success: true,
        result,
        status: current.getRuntimeStatus(),
      });
    } catch (error) {
      if (current) publishStatus(current);
      workerScope.postMessage({
        type: "search-embedding-response",
        requestId: request.requestId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        status: current?.getRuntimeStatus(),
      });
    } finally {
      if (statusTimer) clearInterval(statusTimer);
    }
  })();
});
