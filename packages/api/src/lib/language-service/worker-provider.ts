import type {
  LanguageServiceWorkerMessage,
  LanguageServiceWorkerRequest,
  LanguageServiceWorkerResponse,
  LanguageServiceWorkerResult,
} from "./worker-protocol";

export class LanguageServiceWorkerClient {
  private readonly pending = new Map<
    string,
    {
      resolve: (response: LanguageServiceWorkerResponse) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor(private readonly worker: Worker) {
    worker.addEventListener("message", this.handleMessage);
  }

  request(
    payload: LanguageServiceWorkerRequest,
  ): Promise<LanguageServiceWorkerResponse> {
    const id = crypto.randomUUID();
    const message: LanguageServiceWorkerMessage = { id, payload };
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage(message);
    });
  }

  dispose(): void {
    this.worker.removeEventListener("message", this.handleMessage);
    this.worker.terminate();
    for (const pending of this.pending.values()) {
      pending.reject(new Error("Language service worker disposed"));
    }
    this.pending.clear();
  }

  private readonly handleMessage = (
    event: MessageEvent<LanguageServiceWorkerResult>,
  ) => {
    const response = event.data;
    const pending = this.pending.get(response.id);
    if (!pending) {
      return;
    }

    this.pending.delete(response.id);
    if (response.ok) {
      pending.resolve(response.payload);
    } else {
      pending.reject(new Error(response.error));
    }
  };
}
