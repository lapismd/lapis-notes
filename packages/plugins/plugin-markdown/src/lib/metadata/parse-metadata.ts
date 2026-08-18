/// <reference path="../../vite-env.d.ts" />

import MetadataWorker from "./metadata-worker?worker&inline";
import { extractMetadata } from "./extract-metadata";
import type {
  MetadataWorkerRequest,
  MetadataWorkerResponse,
} from "./metadata-worker-protocol";

type PendingParse = {
  resolve: (cache: ReturnType<typeof extractMetadata>) => void;
  reject: (error: unknown) => void;
};

let worker: Worker | null | undefined;
const pending = new Map<string, PendingParse>();
let nextId = 0;

function acquireWorker(): Worker | null {
  if (worker !== undefined) {
    return worker;
  }
  if (typeof Worker === "undefined") {
    worker = null;
    return null;
  }
  try {
    const instance = new MetadataWorker();
    instance.onmessage = (event: MessageEvent<MetadataWorkerResponse>) => {
      const task = pending.get(event.data.id);
      if (!task) return;
      pending.delete(event.data.id);
      task.resolve(event.data.cache);
    };
    instance.onerror = (event) => {
      const error = event.error ?? new Error(event.message);
      for (const task of pending.values()) {
        task.reject(error);
      }
      pending.clear();
      worker = undefined;
    };
    worker = instance;
    return instance;
  } catch {
    worker = null;
    return null;
  }
}

export function parseMetadataOffThread(
  data: string,
): Promise<ReturnType<typeof extractMetadata>> {
  const instance = acquireWorker();
  if (!instance) {
    return Promise.resolve(extractMetadata(data));
  }
  const id = `metadata-${++nextId}`;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    instance.postMessage({ id, data } satisfies MetadataWorkerRequest);
  });
}
