import { fork, type ChildProcess } from "node:child_process";
import path from "node:path";

const SIDECAR_REQUEST_TIMEOUT_MS = 30_000;
const SIDECAR_RESTART_DELAY_MS = 1_000;

export type LanguageServiceSidecarOp =
  | "document-update"
  | "diagnostics"
  | "completion"
  | "hover"
  | "definition"
  | "code-actions"
  | "shutdown";

type SidecarRequest = {
  id: string;
  type: LanguageServiceSidecarOp;
  payload?: Record<string, unknown>;
};

type SidecarMessage =
  | { type: "ready" }
  | { type: "response"; id: string; result?: unknown }
  | { type: "error"; id?: string; error: string };

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

type PendingReady = {
  resolve: () => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

let requestCounter = 0;

export class LanguageServiceSidecarManager {
  private child: ChildProcess | null = null;
  private starting: Promise<void> | null = null;
  private pendingReady: PendingReady | null = null;
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private restartTimer: NodeJS.Timeout | null = null;
  private stopping = false;

  async invoke(
    type: Exclude<LanguageServiceSidecarOp, "shutdown">,
    payload: Record<string, unknown>,
    timeoutMs: number = SIDECAR_REQUEST_TIMEOUT_MS,
  ): Promise<unknown> {
    return this.sendRequest(type, payload, timeoutMs);
  }

  async shutdown(timeoutMs = 2_000): Promise<void> {
    this.stopping = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (!this.child) {
      this.rejectAllPending(new Error("Language service sidecar is stopped"));
      this.stopping = false;
      return;
    }

    try {
      await this.sendRequest("shutdown", {}, timeoutMs);
    } catch {
      //
    } finally {
      const child = this.child;
      child?.removeAllListeners("message");
      child?.removeAllListeners("error");
      child?.removeAllListeners("exit");
      child?.kill();
      this.child = null;
      this.starting = null;
      this.rejectAllPending(new Error("Language service sidecar was stopped"));
      this.stopping = false;
    }
  }

  private async sendRequest(
    type: LanguageServiceSidecarOp,
    payload: Record<string, unknown>,
    timeoutMs: number = SIDECAR_REQUEST_TIMEOUT_MS,
  ): Promise<unknown> {
    await this.ensureStarted();
    const child = this.child;
    if (!child?.connected) {
      throw new Error("Language service sidecar is unavailable");
    }

    const id = `language-service-${Date.now()}-${++requestCounter}`;
    const message: SidecarRequest = { id, type, payload };

    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(
          new Error(`Language service sidecar request timed out: ${type}`),
        );
        this.restartAfterFailure(`request timed out: ${type}`);
      }, timeoutMs);
      timer.unref?.();

      this.pendingRequests.set(id, {
        resolve,
        reject,
        timer,
      });

      child.send(message, (error) => {
        if (!error) {
          return;
        }
        const pending = this.pendingRequests.get(id);
        if (!pending) {
          return;
        }
        clearTimeout(pending.timer);
        this.pendingRequests.delete(id);
        pending.reject(error);
      });
    });
  }

  private ensureStarted(): Promise<void> {
    if (this.child?.connected) {
      return this.starting ?? Promise.resolve();
    }
    if (this.starting) {
      return this.starting;
    }

    this.stopping = false;
    this.starting = new Promise<void>((resolve, reject) => {
      const childPath = path.join(
        __dirname,
        "language-service-sidecar-child.js",
      );
      const child = fork(childPath, [], {
        execArgv: [],
        serialization: "advanced",
        stdio: ["ignore", "ignore", "ignore", "ipc"],
      });
      this.child = child;

      const timer = setTimeout(() => {
        this.pendingReady = null;
        reject(new Error("Language service sidecar did not become ready"));
        this.restartAfterFailure("ready timeout");
      }, 5_000);
      timer.unref?.();

      this.pendingReady = {
        resolve: () => {
          clearTimeout(timer);
          this.pendingReady = null;
          resolve();
        },
        reject: (error) => {
          clearTimeout(timer);
          this.pendingReady = null;
          reject(error);
        },
        timer,
      };

      child.on("message", (message) => this.handleMessage(message));
      child.on("error", (error) => this.handleExit(error.message));
      child.on("exit", (code, signal) =>
        this.handleExit(
          `exit code ${code ?? "null"} signal ${signal ?? "null"}`,
        ),
      );
    }).finally(() => {
      this.starting = null;
    });

    return this.starting;
  }

  private handleMessage(message: unknown): void {
    if (!isSidecarMessage(message)) {
      return;
    }

    if (message.type === "ready") {
      this.pendingReady?.resolve();
      return;
    }

    if (message.type === "error" && !message.id) {
      this.pendingReady?.reject(new Error(message.error));
      this.restartAfterFailure(message.error);
      return;
    }

    const id = message.id;
    if (!id) {
      return;
    }
    const pending = this.pendingRequests.get(id);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timer);
    this.pendingRequests.delete(id);

    if (message.type === "error") {
      pending.reject(new Error(message.error));
      return;
    }

    pending.resolve(message.result);
  }

  private handleExit(reason: string): void {
    this.child = null;
    const error = new Error(`Language service sidecar stopped: ${reason}`);
    this.pendingReady?.reject(error);
    this.pendingReady = null;
    this.rejectAllPending(error);

    if (!this.stopping) {
      this.scheduleRestart();
    }
  }

  private rejectAllPending(error: Error): void {
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  private restartAfterFailure(reason: string): void {
    this.child?.kill();
    this.child = null;
    this.pendingReady?.reject(new Error(reason));
    this.pendingReady = null;
    this.rejectAllPending(new Error(reason));
    if (!this.stopping) {
      this.scheduleRestart();
    }
  }

  private scheduleRestart(): void {
    if (this.restartTimer || this.stopping) {
      return;
    }
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      void this.ensureStarted().catch(() => {
        this.scheduleRestart();
      });
    }, SIDECAR_RESTART_DELAY_MS);
    this.restartTimer.unref?.();
  }
}

function isSidecarMessage(message: unknown): message is SidecarMessage {
  return typeof message === "object" && message !== null && "type" in message;
}
