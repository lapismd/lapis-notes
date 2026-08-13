import { afterEach, describe, expect, it, vi } from "vitest";
import type { SearchDocumentRecord } from "./app-database";
import {
  createSearchEmbeddingProvider,
  setBrowserSearchEmbeddingWorkerFactory,
  setSearchEmbeddingProviderRuntimeLoaderForTests,
} from "./search-embedding-provider";

const document: SearchDocumentRecord = {
  path: "note.md",
  name: "note",
  extension: "md",
  checksum: "abc",
  content: "semantic search test",
  tags: [],
  tagParts: [],
  tagHierarchy: [],
  chunks: [
    {
      id: "note.md#chunk-1",
      text: "semantic search test",
      startOffset: 0,
      endOffset: 20,
      heading: "Note",
      kind: "paragraph",
    },
  ],
};

afterEach(() => {
  setSearchEmbeddingProviderRuntimeLoaderForTests(null);
  setBrowserSearchEmbeddingWorkerFactory(null);
  vi.unstubAllGlobals();
  delete (
    globalThis as {
      __LAPIS_NATIVE_DESKTOP__?: unknown;
    }
  ).__LAPIS_NATIVE_DESKTOP__;
});

describe("search embedding provider", () => {
  it("runs browser Transformers work in a lazy disposable worker", async () => {
    const workers: Array<{ terminated: boolean }> = [];
    class FakeWorker {
      terminated = false;
      private listeners = new Map<string, Set<(event: any) => void>>();

      constructor() {
        workers.push(this);
      }

      addEventListener(type: string, listener: (event: any) => void) {
        const listeners = this.listeners.get(type) ?? new Set();
        listeners.add(listener);
        this.listeners.set(type, listeners);
      }

      postMessage(message: any) {
        queueMicrotask(() => {
          const result =
            message.method === "ready"
              ? true
              : message.method === "embedQuery"
                ? [0.5, 0.25]
                : [];
          for (const listener of this.listeners.get("message") ?? []) {
            listener({
              data: {
                type: "search-embedding-response",
                requestId: message.requestId,
                success: true,
                result,
                status: {
                  providerKind: "transformers-js",
                  phase: "ready",
                  modelId: message.config.modelId,
                  updatedAt: Date.now(),
                },
              },
            });
          }
        });
      }

      terminate() {
        this.terminated = true;
      }
    }
    setBrowserSearchEmbeddingWorkerFactory(
      () => new FakeWorker() as unknown as Worker,
    );

    const provider = createSearchEmbeddingProvider({
      kind: "transformers-js",
      modelId: "Xenova/all-MiniLM-L6-v2",
    });

    expect(workers).toHaveLength(0);
    await expect(provider?.ready()).resolves.toBe(true);
    await expect(provider?.embedQuery("semantic search")).resolves.toEqual([
      0.5, 0.25,
    ]);
    expect(workers).toHaveLength(1);
    expect(provider?.getRuntimeStatus().phase).toBe("ready");
    await provider?.dispose?.();
    expect(workers[0]?.terminated).toBe(true);
  });

  it("creates a transformers provider that configures browser runtime loading", async () => {
    let progressCallback:
      | ((event: { progress?: number; file?: string; status?: string }) => void)
      | undefined;
    const runtime = {
      env: {},
      pipeline: async (
        _task: string,
        model: string,
        options?: Record<string, unknown>,
      ) => {
        expect(model).toBe("Xenova/all-MiniLM-L6-v2");
        expect(options).toMatchObject({
          device: "wasm",
        });
        progressCallback =
          options?.progress_callback as typeof progressCallback;
        progressCallback?.({
          status: "download",
          file: "model.onnx",
          progress: 50,
        });
        return async () => ({
          tolist: () => [[0.5, 0.25, 0.125]],
        });
      },
    };

    setSearchEmbeddingProviderRuntimeLoaderForTests(
      async () => runtime as never,
    );

    const provider = createSearchEmbeddingProvider({
      kind: "transformers-js",
      modelId: "Xenova/all-MiniLM-L6-v2",
      allowRemoteModels: false,
      localModelPath: "/models",
    });

    expect(provider?.getRuntimeStatus()).toMatchObject({
      phase: "downloading",
      modelId: "Xenova/all-MiniLM-L6-v2",
    });
    expect(await provider?.ready()).toBe(true);
    expect(runtime.env).toMatchObject({
      allowLocalModels: true,
      allowRemoteModels: false,
      remoteHost: "https://huggingface.co/",
      remotePathTemplate: "{model}/resolve/{revision}/",
      localModelPath: "/models",
    });
    expect(provider?.getRuntimeStatus()).toMatchObject({
      phase: "ready",
      progress: 1,
      message: "Embedding model downloaded and cached in browser",
    });
    await expect(provider?.embedDocument(document)).resolves.toMatchObject([
      {
        chunkId: "note.md#chunk-1",
        vector: [0.5, 0.25, 0.125],
      },
    ]);
    await expect(provider?.embedQuery("semantic search")).resolves.toEqual([
      0.5, 0.25, 0.125,
    ]);
  });

  it("preserves runtime defaults when no local model path is configured", async () => {
    const runtime: {
      env: {
        allowLocalModels?: boolean;
        localModelPath: string;
        remoteHost?: string;
        remotePathTemplate?: string;
      };
      pipeline: () => Promise<
        (input: string | string[]) => Promise<{
          tolist: () => number[][];
        }>
      >;
    } = {
      env: {
        localModelPath: "/default-cache",
      },
      pipeline: async () => {
        return async () => ({
          tolist: () => [[0.5, 0.25, 0.125]],
        });
      },
    };

    setSearchEmbeddingProviderRuntimeLoaderForTests(
      async () => runtime as never,
    );

    const provider = createSearchEmbeddingProvider({
      kind: "transformers-js",
      modelId: "Xenova/all-MiniLM-L6-v2",
      allowRemoteModels: true,
    });

    await expect(provider?.ready()).resolves.toBe(true);
    expect(runtime.env.allowLocalModels).toBe(false);
    expect(runtime.env.remoteHost).toBe("https://huggingface.co/");
    expect(runtime.env.remotePathTemplate).toBe("{model}/resolve/{revision}/");
    expect(runtime.env.localModelPath).toBe("/default-cache");
  });

  it("does not force a default local model path when none is configured", async () => {
    const runtime = {
      env: {},
      pipeline: async () => {
        return async () => ({
          tolist: () => [[0.5, 0.25, 0.125]],
        });
      },
    };

    setSearchEmbeddingProviderRuntimeLoaderForTests(
      async () => runtime as never,
    );

    const provider = createSearchEmbeddingProvider({
      kind: "transformers-js",
      modelId: "Xenova/all-MiniLM-L6-v2",
      allowRemoteModels: true,
    });

    await expect(provider?.ready()).resolves.toBe(true);
    expect(runtime.env).toMatchObject({
      allowLocalModels: false,
      remoteHost: "https://huggingface.co/",
      remotePathTemplate: "{model}/resolve/{revision}/",
    });
    expect("localModelPath" in runtime.env).toBe(false);
  });

  it("disables browser cache when running in a native desktop renderer", async () => {
    let progressCallback:
      | ((event: { progress?: number; file?: string; status?: string }) => void)
      | undefined;
    const runtime = {
      env: {
        useBrowserCache: true,
      },
      pipeline: async (
        _task: string,
        _model: string,
        options?: Record<string, unknown>,
      ) => {
        expect(options).toMatchObject({ device: "cpu" });
        progressCallback =
          options?.progress_callback as typeof progressCallback;
        progressCallback?.({
          status: "download",
          file: "model.onnx",
          progress: 50,
        });
        return async () => ({
          tolist: () => [[0.5, 0.25, 0.125]],
        });
      },
    };

    (
      globalThis as {
        __LAPIS_NATIVE_DESKTOP__?: {
          runtime: "electron-desktop";
        };
      }
    ).__LAPIS_NATIVE_DESKTOP__ = {
      runtime: "electron-desktop",
    };

    setSearchEmbeddingProviderRuntimeLoaderForTests(
      async () => runtime as never,
    );

    const provider = createSearchEmbeddingProvider({
      kind: "transformers-js",
      modelId: "Xenova/all-MiniLM-L6-v2",
      allowRemoteModels: true,
    });

    await expect(provider?.ready()).resolves.toBe(true);
    expect(runtime.env.useBrowserCache).toBe(false);
    expect(provider?.getRuntimeStatus()).toMatchObject({
      phase: "ready",
      message: "Embedding model downloaded for the current desktop session",
    });
  });
});
