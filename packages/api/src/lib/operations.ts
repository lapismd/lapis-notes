/** Native plugin operations supplied by the owning, admitted host. */
export * from "./operations-protocol";
export * from "./operations-availability";
import type {
  OperationCatalog,
  OperationReply,
  OperationRequest,
} from "./operations-protocol";

export interface OperationHost {
  catalog(): Promise<OperationCatalog>;
  invoke(
    pluginId: string,
    operationId: string,
    request: OperationRequest,
  ): Promise<OperationReply>;
}

/** Detachment stops new observer requests without cancelling accepted work. */
export class OperationSession implements OperationHost {
  private stopped = false;
  private pending = new Set<Promise<unknown>>();
  constructor(private readonly host: OperationHost) {}
  private call<T>(action: () => Promise<T>): Promise<T> {
    if (this.stopped)
      return Promise.reject(new Error("Operations observer detached"));
    const pending = Promise.resolve().then(action);
    this.pending.add(pending);
    void pending.finally(() => this.pending.delete(pending)).catch(() => {});
    return pending;
  }
  catalog(): Promise<OperationCatalog> {
    return this.call(() => this.host.catalog());
  }
  invoke(
    pluginId: string,
    operationId: string,
    request: OperationRequest,
  ): Promise<OperationReply> {
    return this.call(() => this.host.invoke(pluginId, operationId, request));
  }
  async detach(): Promise<void> {
    this.stopped = true;
    await Promise.allSettled([...this.pending]);
  }
}
