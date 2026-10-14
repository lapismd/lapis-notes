/** Renderer-owned delivery of the native instance's pending App URLs. */
export class DesktopAppUrlDelivery {
  private readonly listeners = new Set<(url: string) => void>();
  private inFlight: Promise<void> | null = null;
  private requested = false;
  private disposed = false;
  private readonly queued: string[] = [];

  constructor(
    private readonly takePending: () => Promise<unknown>,
    private readonly onDelivered: (url: string) => void,
  ) {}

  subscribe(listener: (url: string) => void): () => void {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    void this.flush().catch(() => {});
    return () => this.listeners.delete(listener);
  }

  flush(): Promise<void> {
    if (this.disposed || !this.listeners.size) return Promise.resolve();
    this.requested = true;
    if (this.inFlight) return this.inFlight;
    const run = async () => {
      do {
        this.requested = false;
        this.deliverQueued();
        if (this.disposed || !this.listeners.size) return;
        const urls = await this.takePending();
        if (this.disposed) return;
        if (Array.isArray(urls))
          this.queued.push(
            ...urls.filter((url): url is string => typeof url === "string"),
          );
        this.deliverQueued();
      } while (this.requested && this.listeners.size);
    };
    this.inFlight = run()
      .catch((error) => {
        this.requested = false;
        throw error;
      })
      .finally(() => {
        this.inFlight = null;
        // A subscriber or native notification can arrive after run's last check
        // but before this promise settles. Carry that request into a new drain.
        if (this.requested && !this.disposed && this.listeners.size)
          void this.flush().catch(() => {});
      });
    return this.inFlight;
  }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
    this.queued.length = 0;
  }

  private deliverQueued(): void {
    while (!this.disposed && this.listeners.size && this.queued.length) {
      const url = this.queued.shift()!;
      for (const listener of [...this.listeners]) listener(url);
      this.onDelivered(url);
    }
  }
}
