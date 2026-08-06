export interface WorkerMessage {
  id: string;
  type: string;
  data: any;
}

export interface WorkerResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

export class PromiseWorker {
  private pendingPromises: Map<
    string,
    { resolve: Function; reject: Function }
  > = new Map();
  private messageId = 0;

  constructor(readonly worker: Worker) {
    worker.onmessage = this.handleMessage.bind(this);
    worker.onerror = this.handleError.bind(this);
  }

  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const { id, success, result, error } = event.data;
    const promise = this.pendingPromises.get(id);

    if (promise) {
      this.pendingPromises.delete(id);

      if (success) {
        promise.resolve(result);
      } else {
        promise.reject(new Error(error || "Worker operation failed"));
      }
    }
  }

  private handleError(error: ErrorEvent) {
    // Reject all pending promises
    this.pendingPromises.forEach(({ reject }) => {
      reject(new Error("Worker encountered an error"));
    });
    this.pendingPromises.clear();
  }

  private generateId(): string {
    return `msg_${++this.messageId}_${Date.now()}`;
  }

  public postMessage<T = any>(
    type: string,
    data: any,
    timeout = 10000,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.generateId();

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingPromises.delete(id);
        reject(new Error(`Worker operation timed out after ${timeout}ms`));
      }, timeout);

      // Store promise resolvers
      this.pendingPromises.set(id, {
        resolve: (result: T) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      });

      // Send message to worker
      const message: WorkerMessage = { id, type, data };
      this.worker.postMessage(message);
    });
  }

  public terminate() {
    this.worker.terminate();
    // Reject all pending promises
    this.pendingPromises.forEach(({ reject }) => {
      reject(new Error("Worker was terminated"));
    });
    this.pendingPromises.clear();
  }
}
