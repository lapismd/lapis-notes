import type { SearchDocumentRecord } from "./app-database";

export interface TokenHashSearchEmbeddingProviderConfig {
  kind: "token-hash";
  modelId?: string;
  modelVersion?: string;
  dimensions?: number;
}

export interface TransformersJsSearchEmbeddingProviderConfig {
  kind: "transformers-js";
  modelId: string;
  modelVersion?: string;
  revision?: string;
  dtype?: string;
  device?: "wasm" | "webgpu";
  dimensions?: number;
  pooling?: "mean";
  normalize?: boolean;
  allowRemoteModels?: boolean;
  localModelPath?: string;
  wasmPaths?: string;
}

export type SearchEmbeddingProviderConfig =
  | TokenHashSearchEmbeddingProviderConfig
  | TransformersJsSearchEmbeddingProviderConfig;

export type SearchEmbeddingRuntimePhase =
  | "ready"
  | "downloading"
  | "embedding"
  | "error";

export interface SearchEmbeddingRuntimeStatus {
  providerKind: SearchEmbeddingProviderConfig["kind"];
  phase: SearchEmbeddingRuntimePhase;
  modelId?: string;
  message?: string;
  progress?: number;
  file?: string;
  loadedBytes?: number;
  totalBytes?: number;
  updatedAt: number;
}

export interface SearchEmbeddingChunkVector {
  chunkId: string;
  vector: number[];
  fingerprint: string;
}

export interface SearchEmbeddingProvider {
  readonly config: SearchEmbeddingProviderConfig;
  ready(): Promise<boolean>;
  embedDocument(
    document: SearchDocumentRecord,
  ): Promise<SearchEmbeddingChunkVector[]>;
  embedQuery(query: string): Promise<number[] | null>;
  getRuntimeStatus(): SearchEmbeddingRuntimeStatus;
  dispose?(): Promise<void> | void;
}

type SearchEmbeddingWorkerMethod = "ready" | "embedDocument" | "embedQuery";

type SearchEmbeddingWorkerResponse =
  | {
      type: "search-embedding-status";
      status: SearchEmbeddingRuntimeStatus;
    }
  | {
      type: "search-embedding-response";
      requestId: string;
      success: boolean;
      result?: unknown;
      error?: string;
      status?: SearchEmbeddingRuntimeStatus;
    };

type TransformersFeatureExtractionResult = {
  tolist(): unknown;
};

type TransformersFeatureExtractor = (
  input: string | string[],
  options?: Record<string, unknown>,
) => Promise<TransformersFeatureExtractionResult>;

type TransformersRuntime = {
  env: {
    allowLocalModels?: boolean;
    allowRemoteModels?: boolean;
    useBrowserCache?: boolean;
    useFSCache?: boolean;
    remoteHost?: string;
    remotePathTemplate?: string;
    localModelPath?: string;
    backends?: {
      onnx?: {
        wasm?: {
          wasmPaths?: string;
        };
      };
    };
  };
  pipeline(
    task: "feature-extraction",
    model: string,
    options?: Record<string, unknown>,
  ): Promise<TransformersFeatureExtractor>;
};

type TransformersProgressEvent = {
  status?: string;
  file?: string;
  name?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

async function defaultTransformersRuntimeLoader(): Promise<TransformersRuntime> {
  return (await import("@huggingface/transformers")) as TransformersRuntime;
}

let transformersRuntimeLoader: () => Promise<TransformersRuntime> =
  defaultTransformersRuntimeLoader;

const DEFAULT_DIMENSIONS = 48;
const DEFAULT_REMOTE_HOST = "https://huggingface.co/";
const DEFAULT_REMOTE_PATH_TEMPLATE = "{model}/resolve/{revision}/";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function featureTerms(value: string): string[] {
  const normalized = normalizeText(value);
  if (!normalized.length) {
    return [];
  }

  const features: string[] = [];
  for (const token of normalized.match(/[\p{L}\p{N}_-]+/gu) ?? []) {
    features.push(`tok:${token}`);
    if (token.length >= 3) {
      for (let index = 0; index <= token.length - 3; index += 1) {
        features.push(`tri:${token.slice(index, index + 3)}`);
      }
    }
  }

  return [...new Set(features)];
}

function normalizeVector(values: number[]): number[] {
  const magnitude = Math.sqrt(
    values.reduce((total, value) => total + value * value, 0),
  );
  if (!magnitude) {
    return values;
  }
  return values.map((value) => value / magnitude);
}

function embedText(text: string, dimensions: number): number[] {
  const vector = new Array<number>(dimensions).fill(0);
  for (const feature of featureTerms(text)) {
    const hash = hashString(feature);
    const index = hash % dimensions;
    const sign = (hash & 1) === 0 ? 1 : -1;
    vector[index] += sign;
  }
  return normalizeVector(vector);
}

function fingerprint(text: string): string {
  return hashString(normalizeText(text)).toString(16);
}

function trimModelPath(path?: string): string | undefined {
  const normalized = path?.trim();
  return normalized?.length ? normalized : undefined;
}

function normalizeEmbeddingRows(value: unknown): number[][] {
  if (!Array.isArray(value)) {
    return [];
  }
  if (value.length > 0 && value.every((entry) => typeof entry === "number")) {
    return [value as number[]];
  }
  return value
    .filter(Array.isArray)
    .map((entry) =>
      (entry as unknown[])
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item)),
    )
    .filter((entry) => entry.length > 0);
}

function cloneRuntimeStatus(
  value: SearchEmbeddingRuntimeStatus,
): SearchEmbeddingRuntimeStatus {
  return { ...value };
}

function normalizeProgress(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
}

function runtimeMessage(event: TransformersProgressEvent): string | undefined {
  const parts = [event.status, event.name ?? event.file].filter(Boolean);
  return parts.length ? parts.join(": ") : undefined;
}

class TokenHashSearchEmbeddingProvider implements SearchEmbeddingProvider {
  readonly config: TokenHashSearchEmbeddingProviderConfig;
  private readonly runtimeStatus: SearchEmbeddingRuntimeStatus;

  constructor(config: TokenHashSearchEmbeddingProviderConfig) {
    this.config = {
      ...config,
      modelId: config.modelId ?? "lapis/token-hash-v0",
      modelVersion: config.modelVersion ?? "0",
      dimensions: config.dimensions ?? DEFAULT_DIMENSIONS,
    };
    this.runtimeStatus = {
      providerKind: "token-hash",
      phase: "ready",
      modelId: this.config.modelId,
      message: "Token-hash fallback is ready",
      progress: 1,
      updatedAt: Date.now(),
    };
  }

  async ready(): Promise<boolean> {
    return true;
  }

  async embedDocument(
    document: SearchDocumentRecord,
  ): Promise<SearchEmbeddingChunkVector[]> {
    const dimensions = this.config.dimensions ?? DEFAULT_DIMENSIONS;
    return (document.chunks ?? [])
      .filter((chunk) => chunk.text.trim().length)
      .map((chunk) => ({
        chunkId: chunk.id,
        vector: embedText(chunk.text, dimensions),
        fingerprint: fingerprint(chunk.text),
      }));
  }

  async embedQuery(query: string): Promise<number[] | null> {
    if (!featureTerms(query).length) {
      return null;
    }
    return embedText(query, this.config.dimensions ?? DEFAULT_DIMENSIONS);
  }

  getRuntimeStatus(): SearchEmbeddingRuntimeStatus {
    return cloneRuntimeStatus(this.runtimeStatus);
  }
}

const EMBEDDING_WORKER_TIMEOUT_MS = 5 * 60_000;
let browserSearchEmbeddingWorkerFactory: (() => Worker) | null = null;

function canUseBrowserEmbeddingWorker(): boolean {
  return (
    typeof window !== "undefined" &&
    browserSearchEmbeddingWorkerFactory !== null
  );
}

export function setBrowserSearchEmbeddingWorkerFactory(
  factory: (() => Worker) | null,
): void {
  browserSearchEmbeddingWorkerFactory = factory;
}

function createEmbeddingWorkerRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `embedding-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

class BrowserWorkerSearchEmbeddingProvider
  implements SearchEmbeddingProvider
{
  readonly config: TransformersJsSearchEmbeddingProviderConfig;
  private worker: Worker | null = null;
  private runtimeStatus: SearchEmbeddingRuntimeStatus;
  private pending = new Map<
    string,
    {
      resolve(value: unknown): void;
      reject(error: Error): void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  >();

  constructor(config: TransformersJsSearchEmbeddingProviderConfig) {
    this.config = { ...config };
    this.runtimeStatus = {
      providerKind: "transformers-js",
      phase: "downloading",
      modelId: config.modelId,
      message: "Waiting to initialize embedding worker",
      progress: 0,
      updatedAt: Date.now(),
    };
  }

  ready(): Promise<boolean> {
    return this.invoke<boolean>("ready");
  }

  embedDocument(
    document: SearchDocumentRecord,
  ): Promise<SearchEmbeddingChunkVector[]> {
    return this.invoke<SearchEmbeddingChunkVector[]>("embedDocument", document);
  }

  embedQuery(query: string): Promise<number[] | null> {
    return this.invoke<number[] | null>("embedQuery", query);
  }

  getRuntimeStatus(): SearchEmbeddingRuntimeStatus {
    return cloneRuntimeStatus(this.runtimeStatus);
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    for (const request of this.pending.values()) {
      clearTimeout(request.timeoutId);
      request.reject(new Error("Embedding worker disposed"));
    }
    this.pending.clear();
  }

  private invoke<T>(
    method: SearchEmbeddingWorkerMethod,
    argument?: unknown,
  ): Promise<T> {
    const worker = this.ensureWorker();
    const requestId = createEmbeddingWorkerRequestId();
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Embedding worker request timed out: ${method}`));
      }, EMBEDDING_WORKER_TIMEOUT_MS);
      this.pending.set(requestId, {
        resolve: (value) => resolve(value as T),
        reject,
        timeoutId,
      });
      worker.postMessage({
        type: "search-embedding-request",
        requestId,
        method,
        config: this.config,
        argument,
      });
    });
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    if (!browserSearchEmbeddingWorkerFactory) {
      throw new Error("Embedding worker factory is unavailable");
    }
    const worker = browserSearchEmbeddingWorkerFactory();
    worker.addEventListener("message", (event: MessageEvent<unknown>) => {
      const message = event.data as SearchEmbeddingWorkerResponse | undefined;
      if (message?.type === "search-embedding-status") {
        this.runtimeStatus = cloneRuntimeStatus(message.status);
        return;
      }
      if (message?.type !== "search-embedding-response") return;
      const request = this.pending.get(message.requestId);
      if (!request) return;
      if (message.status) {
        this.runtimeStatus = cloneRuntimeStatus(message.status);
      }
      clearTimeout(request.timeoutId);
      this.pending.delete(message.requestId);
      if (message.success) request.resolve(message.result);
      else request.reject(new Error(message.error ?? "Embedding worker failed"));
    });
    worker.addEventListener("error", (event) => {
      const error = new Error(event.message || "Embedding worker crashed");
      this.runtimeStatus = {
        ...this.runtimeStatus,
        phase: "error",
        message: error.message,
        updatedAt: Date.now(),
      };
      for (const request of this.pending.values()) {
        clearTimeout(request.timeoutId);
        request.reject(error);
      }
      this.pending.clear();
      worker.terminate();
      if (this.worker === worker) this.worker = null;
    });
    this.worker = worker;
    return worker;
  }
}

class TransformersJsSearchEmbeddingProvider implements SearchEmbeddingProvider {
  readonly config: TransformersJsSearchEmbeddingProviderConfig;
  private extractorPromise: Promise<TransformersFeatureExtractor> | null = null;
  private runtimeStatus: SearchEmbeddingRuntimeStatus;
  private sawDownloadProgress = false;

  constructor(config: TransformersJsSearchEmbeddingProviderConfig) {
    this.config = {
      ...config,
      modelVersion: config.modelVersion ?? config.revision,
      device: config.device ?? "wasm",
      pooling: config.pooling ?? "mean",
      normalize: config.normalize ?? true,
      allowRemoteModels: config.allowRemoteModels ?? true,
      localModelPath: trimModelPath(config.localModelPath),
      wasmPaths: trimModelPath(config.wasmPaths),
    };
    this.runtimeStatus = {
      providerKind: "transformers-js",
      phase: "downloading",
      modelId: this.config.modelId,
      message: "Waiting to initialize embedding runtime",
      progress: 0,
      updatedAt: Date.now(),
    };
  }

  async ready(): Promise<boolean> {
    await this.getExtractor();
    return true;
  }

  async embedDocument(
    document: SearchDocumentRecord,
  ): Promise<SearchEmbeddingChunkVector[]> {
    const chunks = (document.chunks ?? []).filter(
      (chunk) => chunk.text.trim().length,
    );
    if (!chunks.length) {
      return [];
    }

    const vectors = await this.embedTexts(chunks.map((chunk) => chunk.text));
    return chunks
      .map((chunk, index) => {
        const vector = vectors[index];
        if (!vector?.length) {
          return null;
        }

        return {
          chunkId: chunk.id,
          vector,
          fingerprint: fingerprint(chunk.text),
        };
      })
      .filter((entry): entry is SearchEmbeddingChunkVector => Boolean(entry));
  }

  async embedQuery(query: string): Promise<number[] | null> {
    if (!query.trim().length) {
      return null;
    }

    const [vector] = await this.embedTexts([query]);
    return vector?.length ? vector : null;
  }

  getRuntimeStatus(): SearchEmbeddingRuntimeStatus {
    return cloneRuntimeStatus(this.runtimeStatus);
  }

  private async embedTexts(texts: string[]): Promise<number[][]> {
    const extractor = await this.getExtractor();
    this.updateRuntimeStatus({
      phase: "embedding",
      message: `Embedding ${texts.length} item${texts.length === 1 ? "" : "s"}`,
      progress: 1,
    });
    try {
      const output = await extractor(texts, {
        pooling: this.config.pooling,
        normalize: this.config.normalize,
      });
      return normalizeEmbeddingRows(output.tolist());
    } finally {
      this.updateRuntimeStatus({
        phase: "ready",
        message: this.readyMessage(),
        progress: 1,
        file: undefined,
        loadedBytes: undefined,
        totalBytes: undefined,
      });
    }
  }

  private async getExtractor(): Promise<TransformersFeatureExtractor> {
    if (!this.extractorPromise) {
      this.extractorPromise = this.loadExtractor().catch((error) => {
        this.extractorPromise = null;
        this.updateRuntimeStatus({
          phase: "error",
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      });
    }
    return this.extractorPromise;
  }

  private async loadExtractor(): Promise<TransformersFeatureExtractor> {
    const runtime = await transformersRuntimeLoader();
    const hasExplicitLocalModelPath = Boolean(this.config.localModelPath);

    runtime.env.allowLocalModels = hasExplicitLocalModelPath;
    runtime.env.allowRemoteModels = this.config.allowRemoteModels ?? true;
    runtime.env.remoteHost ||= DEFAULT_REMOTE_HOST;
    runtime.env.remotePathTemplate ||= DEFAULT_REMOTE_PATH_TEMPLATE;
    if (hasExplicitLocalModelPath) {
      runtime.env.localModelPath = this.config.localModelPath;
    }
    if (this.config.wasmPaths) {
      runtime.env.backends ??= {};
      runtime.env.backends.onnx ??= {};
      runtime.env.backends.onnx.wasm ??= {};
      runtime.env.backends.onnx.wasm.wasmPaths = this.config.wasmPaths;
    }

    this.updateRuntimeStatus({
      phase: "downloading",
      message: "Initializing embedding runtime",
      progress: 0,
    });

    const extractor = await runtime.pipeline(
      "feature-extraction",
      this.config.modelId,
      {
        revision: this.config.revision,
        dtype: this.config.dtype,
        device: this.config.device,
        progress_callback: (event: TransformersProgressEvent) => {
          this.sawDownloadProgress = true;
          this.updateRuntimeStatus({
            phase: "downloading",
            message: runtimeMessage(event) ?? "Downloading embedding model",
            progress:
              normalizeProgress(event.progress) ?? this.runtimeStatus.progress,
            file: event.file ?? event.name,
            loadedBytes:
              typeof event.loaded === "number" ? event.loaded : undefined,
            totalBytes:
              typeof event.total === "number" ? event.total : undefined,
          });
        },
      },
    );
    this.updateRuntimeStatus({
      phase: "ready",
      message: this.readyMessage(),
      progress: 1,
      file: undefined,
      loadedBytes: undefined,
      totalBytes: undefined,
    });
    return extractor;
  }

  private updateRuntimeStatus(
    patch: Partial<SearchEmbeddingRuntimeStatus>,
  ): void {
    this.runtimeStatus = {
      ...this.runtimeStatus,
      ...patch,
      providerKind: "transformers-js",
      modelId:
        patch.modelId ?? this.runtimeStatus.modelId ?? this.config.modelId,
      updatedAt: Date.now(),
    };
  }

  private readyMessage(): string {
    if (this.sawDownloadProgress) {
      return "Embedding model downloaded and cached in browser";
    }
    if (this.config.allowRemoteModels === false && this.config.localModelPath) {
      return `Embedding model loaded from ${this.config.localModelPath}`;
    }
    if (this.config.allowRemoteModels === false) {
      return "Embedding model loaded without remote downloads";
    }
    return "Embedding model ready from browser cache or existing local files";
  }
}

export function createSearchEmbeddingProvider(
  config: SearchEmbeddingProviderConfig | null,
): SearchEmbeddingProvider | null {
  if (!config) {
    return null;
  }

  switch (config.kind) {
    case "token-hash":
      return new TokenHashSearchEmbeddingProvider(config);
    case "transformers-js":
      return canUseBrowserEmbeddingWorker()
        ? new BrowserWorkerSearchEmbeddingProvider(config)
        : new TransformersJsSearchEmbeddingProvider(config);
    default:
      return null;
  }
}

export function setSearchEmbeddingProviderRuntimeLoaderForTests(
  loader: (() => Promise<TransformersRuntime>) | null,
): void {
  transformersRuntimeLoader = loader ?? defaultTransformersRuntimeLoader;
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (!left.length || left.length !== right.length) {
    return 0;
  }

  let score = 0;
  for (let index = 0; index < left.length; index += 1) {
    score += left[index] * right[index];
  }

  return score;
}
