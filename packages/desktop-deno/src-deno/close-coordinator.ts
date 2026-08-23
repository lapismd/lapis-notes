export type DenoWindowCloseEvent = {
  preventDefault(): void;
};

type TimerHandle = ReturnType<typeof setTimeout>;

export type DenoCloseCoordinatorOptions = {
  emitBeforeClose(): void;
  requestWindowClose(): void;
  shutdown(): Promise<void> | void;
  exit(code: number): void;
  timeoutMs?: number;
  setTimer?: (callback: () => void, delay: number) => TimerHandle;
  clearTimer?: (timer: TimerHandle) => void;
};

export type DenoCloseCoordinator = {
  onWindowClose(event: DenoWindowCloseEvent): void;
  rendererReady(): void;
  requestClose(): void;
};

export function createDenoCloseCoordinator(
  options: DenoCloseCoordinatorOptions,
): DenoCloseCoordinator {
  const setTimer = options.setTimer ?? setTimeout;
  const clearTimer = options.clearTimer ?? clearTimeout;
  const timeoutMs = options.timeoutMs ?? 10_000;
  let phase: "idle" | "pending" | "ready" | "closing" = "idle";
  let timer: TimerHandle | undefined;

  const clearCloseTimer = () => {
    if (timer !== undefined) clearTimer(timer);
    timer = undefined;
  };

  const shutdownAndExit = async () => {
    if (phase === "closing") return;
    phase = "closing";
    clearCloseTimer();
    try {
      await options.shutdown();
    } finally {
      options.exit(0);
    }
  };

  return {
    onWindowClose(event) {
      if (phase === "ready") {
        void shutdownAndExit();
        return;
      }
      if (phase === "closing") return;
      event.preventDefault();
      if (phase === "pending") return;
      phase = "pending";
      options.emitBeforeClose();
      timer = setTimer(() => {
        void shutdownAndExit();
      }, timeoutMs);
    },
    rendererReady() {
      if (phase !== "pending") return;
      clearCloseTimer();
      phase = "ready";
      queueMicrotask(() => options.requestWindowClose());
    },
    requestClose() {
      if (phase === "idle") options.requestWindowClose();
    },
  };
}
