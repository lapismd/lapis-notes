export class Tasks {
  private readonly tasks = new Set<Promise<unknown>>();

  add(callback: () => Promise<unknown>): void {
    this.addPromise(Promise.resolve().then(callback));
  }

  addPromise(promise: Promise<unknown>): void {
    const tracked = Promise.resolve(promise).finally(() => {
      this.tasks.delete(tracked);
    });
    this.tasks.add(tracked);
  }

  isEmpty(): boolean {
    return this.tasks.size === 0;
  }

  promise(): Promise<unknown[]> {
    return Promise.all([...this.tasks]);
  }
}
