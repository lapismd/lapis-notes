const EMPTY = Symbol("empty");

export class SerializedWriteQueue<T> {
  private latest: T | typeof EMPTY = EMPTY;
  private running: Promise<void> | null = null;

  constructor(private readonly write: (value: T) => Promise<void>) {}

  enqueue(value: T): void {
    this.latest = value;
    void this.start().catch(() => {});
  }

  async flush(): Promise<void> {
    while (this.latest !== EMPTY || this.running) {
      await this.start();
    }
  }

  private start(): Promise<void> {
    if (!this.running) {
      this.running = this.drain().finally(() => {
        this.running = null;
        if (this.latest !== EMPTY) {
          void this.start().catch(() => {});
        }
      });
    }
    return this.running;
  }

  private async drain(): Promise<void> {
    while (this.latest !== EMPTY) {
      const value = this.latest;
      this.latest = EMPTY;
      await this.write(value);
    }
  }
}
