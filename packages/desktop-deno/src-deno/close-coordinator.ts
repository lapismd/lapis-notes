export type DenoWindowCloseEvent = {
  preventDefault(): void;
};

type TimerHandle = ReturnType<typeof setTimeout>;

export type DenoCloseCoordinatorOptions = {
  emitBeforeClose(): void;
  deferRendererClose?(callback: () => void): void;
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
  const deferRendererClose =
    options.deferRendererClose ??
    ((callback: () => void) => setTimeout(callback, 0));
  const timeoutMs = options.timeoutMs ?? 10_000;
  let phase: "idle" | "pending" | "closing" = "idle";
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

  const beginClose = () => {
    if (phase !== "idle") return;
    phase = "pending";
    deferRendererClose(() => {
      if (phase === "pending") options.emitBeforeClose();
    });
    timer = setTimer(() => {
      void shutdownAndExit();
    }, timeoutMs);
  };

  return {
    onWindowClose(event) {
      event.preventDefault();
      if (phase === "closing") return;
      beginClose();
    },
    rendererReady() {
      if (phase !== "pending") return;
      clearCloseTimer();
      void shutdownAndExit();
    },
    requestClose() {
      beginClose();
    },
  };
}

export function installDenoWindowCloseRouting(
  coordinator: DenoCloseCoordinator,
  sources: readonly EventTarget[],
): () => void {
  const listener = (event: Event) => coordinator.onWindowClose(event);
  const uniqueSources = [...new Set(sources)];
  for (const source of uniqueSources) {
    source.addEventListener("close", listener);
  }
  return () => {
    for (const source of uniqueSources) {
      source.removeEventListener("close", listener);
    }
  };
}
