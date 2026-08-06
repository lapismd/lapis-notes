export class HistoryManager<T> {
  private historyStack: T[] = $state([]);
  private currentIndex: number = $state(-1);
  private maxSize: number;

  hasForward: boolean = $derived(this.canGo(1));
  hasBackward: boolean = $derived(this.canGo(-1));

  constructor(
    readonly updater: (state: T) => void | Promise<void>,
    maxSize: number = 20,
  ) {
    this.maxSize = maxSize;
  }

  private limitStackSize() {
    while (this.historyStack.length > this.maxSize) {
      this.historyStack.shift();
      this.currentIndex--;
    }
  }

  updateState(state: Partial<T>) {
    if (this.historyStack.length && this.historyStack[this.currentIndex]) {
      this.historyStack[this.currentIndex] = {
        ...this.historyStack[this.currentIndex],
        ...state,
      };
    }
  }

  get stack() {
    return [...this.historyStack];
  }

  pushState(state: T) {
    // Clear forward history if we're adding a new state
    this.historyStack = this.historyStack.slice(0, this.currentIndex + 1);
    this.historyStack.push(state);
    this.currentIndex++;
    this.limitStackSize();
  }

  replaceState(state: T) {
    if (this.historyStack[this.currentIndex]) {
      this.historyStack[this.currentIndex] = state;
    }
  }

  trigger(): Promise<void> {
    if (this.currentIndex < 0 || !this.historyStack[this.currentIndex]) {
      return Promise.resolve();
    }
    const state = this.historyStack[this.currentIndex];
    return Promise.resolve(this.updater(state)).then(() => undefined);
  }

  go(steps: number): Promise<void> {
    const newIndex = this.currentIndex + steps;
    if (newIndex >= 0 && newIndex < this.historyStack.length) {
      this.currentIndex = newIndex;
      this.limitStackSize();
      return this.trigger();
    }
    return Promise.resolve();
  }

  forward(): Promise<void> {
    return this.go(1);
  }

  back(): Promise<void> {
    return this.go(-1);
  }

  canGo(steps: number) {
    const newIndex = this.currentIndex + steps;
    return newIndex >= 0 && newIndex < this.historyStack.length;
  }

  get history() {
    return {
      length: this.historyStack.length,
      state:
        this.currentIndex >= 0 ? this.historyStack[this.currentIndex] : null,
      currentState: () =>
        this.currentIndex >= 0 ? this.historyStack[this.currentIndex] : null,
    };
  }
}
