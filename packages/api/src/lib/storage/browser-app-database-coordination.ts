const HEARTBEAT_INTERVAL_MS = 1_000;
const HEARTBEAT_STALE_AFTER_MS = HEARTBEAT_INTERVAL_MS * 3;
const RETRY_JITTER_MIN_MS = 150;
const RETRY_JITTER_MAX_MS = 650;

export interface BrowserAppDatabaseHeartbeat {
  type: "db-owner-heartbeat";
  vaultId: string;
  ownerId: string;
  timestamp: number;
}

function createTabId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function withAbortDelay(
  durationMs: number,
  signal?: AbortSignal,
): Promise<boolean> {
  if (signal?.aborted) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve(true);
    }, durationMs);

    const abort = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    };

    signal?.addEventListener("abort", abort, { once: true });
  });
}

function retryDelayMs(): number {
  return Math.floor(
    RETRY_JITTER_MIN_MS +
      Math.random() * (RETRY_JITTER_MAX_MS - RETRY_JITTER_MIN_MS),
  );
}

export class BrowserAppDatabaseCoordinator {
  readonly tabId = createTabId();
  readonly ownerId = this.tabId;
  readonly lockName: string;
  readonly channelName: string;
  readonly rpcChannelName: string;

  private releaseLock: (() => void) | null = null;
  private heartbeatChannel: BroadcastChannel | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastHeartbeatAt = 0;
  private lastOwnerId: string | null = null;

  constructor(readonly vaultId: string) {
    this.lockName = `lapis-notes-app-database-owner:${vaultId}`;
    this.channelName = `lapis-notes-db-coordination:${vaultId}`;
    this.rpcChannelName = `lapis-notes-db-rpc:${vaultId}`;
  }

  static hasLockApi(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.locks?.request === "function"
    );
  }

  get heartbeatStaleAfterMs(): number {
    return HEARTBEAT_STALE_AFTER_MS;
  }

  get observedOwnerId(): string | null {
    return this.lastOwnerId;
  }

  get observedHeartbeatAt(): number | null {
    return this.lastHeartbeatAt || null;
  }

  async tryAcquireOwnership(): Promise<boolean> {
    if (!BrowserAppDatabaseCoordinator.hasLockApi()) {
      return false;
    }

    if (this.releaseLock) {
      return true;
    }

    let resolveReady!: (release: (() => void) | null) => void;
    let rejectReady!: (error: unknown) => void;
    const ready = new Promise<(() => void) | null>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

    let unlock!: () => void;
    const released = { value: false };
    const holdLock = new Promise<void>((resolve) => {
      unlock = () => {
        if (released.value) {
          return;
        }
        released.value = true;
        resolve();
      };
    });

    void navigator.locks
      .request(
        this.lockName,
        { mode: "exclusive", ifAvailable: true },
        async (lock) => {
          if (!lock) {
            resolveReady(null);
            return;
          }

          this.releaseLock = unlock;
          this.lastOwnerId = this.ownerId;
          this.lastHeartbeatAt = Date.now();
          resolveReady(unlock);
          await holdLock;
        },
      )
      .catch((error) => {
        rejectReady(error);
      });

    try {
      return Boolean(await ready);
    } catch (error) {
      this.release();
      throw error;
    }
  }

  startHeartbeat(): void {
    if (!this.releaseLock) {
      return;
    }

    this.ensureHeartbeatChannel();
    this.publishHeartbeat();

    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      this.publishHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
  }

  async waitForOwnership(
    options: Partial<{ signal: AbortSignal }> = {},
  ): Promise<boolean> {
    const { signal } = options;

    if (signal?.aborted) {
      return false;
    }

    this.ensureHeartbeatChannel();

    while (!signal?.aborted) {
      if (!this.hasRecentHeartbeat()) {
        const acquired = await this.tryAcquireOwnership();
        if (acquired) {
          return true;
        }
      }

      const heartbeatAge = this.lastHeartbeatAt
        ? Date.now() - this.lastHeartbeatAt
        : Number.POSITIVE_INFINITY;
      const waitMs =
        heartbeatAge < HEARTBEAT_STALE_AFTER_MS
          ? Math.max(
              RETRY_JITTER_MIN_MS,
              HEARTBEAT_STALE_AFTER_MS - heartbeatAge + retryDelayMs(),
            )
          : retryDelayMs();

      const shouldContinue = await withAbortDelay(waitMs, signal);
      if (!shouldContinue) {
        return false;
      }
    }

    return false;
  }

  release(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.releaseLock?.();
    this.releaseLock = null;
  }

  close(): void {
    this.release();
    this.heartbeatChannel?.close();
    this.heartbeatChannel = null;
  }

  private ensureHeartbeatChannel(): void {
    if (this.heartbeatChannel || typeof BroadcastChannel === "undefined") {
      return;
    }

    this.heartbeatChannel = new BroadcastChannel(this.channelName);
    this.heartbeatChannel.addEventListener("message", (event) => {
      const heartbeat = event.data as BrowserAppDatabaseHeartbeat | undefined;
      if (
        !heartbeat ||
        heartbeat.type !== "db-owner-heartbeat" ||
        heartbeat.vaultId !== this.vaultId ||
        heartbeat.ownerId === this.ownerId
      ) {
        return;
      }

      this.lastOwnerId = heartbeat.ownerId;
      this.lastHeartbeatAt = heartbeat.timestamp;
    });
  }

  private hasRecentHeartbeat(): boolean {
    return (
      this.lastHeartbeatAt > 0 &&
      Date.now() - this.lastHeartbeatAt < HEARTBEAT_STALE_AFTER_MS
    );
  }

  private publishHeartbeat(): void {
    if (!this.heartbeatChannel) {
      return;
    }

    const heartbeat: BrowserAppDatabaseHeartbeat = {
      type: "db-owner-heartbeat",
      vaultId: this.vaultId,
      ownerId: this.ownerId,
      timestamp: Date.now(),
    };

    this.lastOwnerId = heartbeat.ownerId;
    this.lastHeartbeatAt = heartbeat.timestamp;
    this.heartbeatChannel.postMessage(heartbeat);
  }
}

export function isBrowserAppDatabaseAbort(error: unknown): boolean {
  return isAbortError(error);
}
