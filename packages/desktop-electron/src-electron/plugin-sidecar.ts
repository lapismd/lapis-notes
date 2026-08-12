import { fork, type ChildProcess } from "node:child_process";
import path from "node:path";
import type {
  ElectronPluginCapabilityBroker,
  PluginSidecarCapabilityRequest,
} from "./plugin-capability-broker";

const PLUGIN_SIDECAR_REQUEST_TIMEOUT_MS = 30_000;
const PLUGIN_SIDECAR_RESTART_DELAY_MS = 1_000;
const PLUGIN_SIDECAR_MAX_RESTARTS = 3;
const PLUGIN_SIDECAR_RESTART_COOLDOWN_MS = 10_000;

type PluginSidecarRequestType =
  | "prepare"
  | "evaluate"
  | "activate"
  | "deactivate"
  | "shutdown";

type PluginSidecarRequest = {
  id: string;
  type: PluginSidecarRequestType;
  payload?: Record<string, unknown>;
};

type PluginSidecarMessage =
  | { type: "ready" }
  | { type: "response"; id: string; result?: unknown }
  | { type: "error"; id?: string; error: string }
  | {
      type: "broker-request";
      id: string;
      request: PluginSidecarCapabilityRequest;
    };

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

export type PluginSidecarPrepareResult = {
  status: "ready";
  provider: "electron-plugin-sidecar";
  protocolVersion: 1;
  contextId: string;
  capabilities: string[];
  brokerResults?: unknown[];
};

let requestCounter = 0;

export class PluginSidecarManager {
  private child: ChildProcess | null = null;
  private starting: Promise<void> | null = null;
  private pendingReady: PendingReady | null = null;
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private restartTimer: NodeJS.Timeout | null = null;
  private stopping = false;
  private restartCount = 0;
  private cooldownUntil = 0;

  constructor(
    private readonly capabilityBroker?: ElectronPluginCapabilityBroker,
    private readonly label: string = "plugin-sidecar",
  ) {}

  async prepare(
    payload: Record<string, unknown> | string,
  ): Promise<PluginSidecarPrepareResult> {
    return this.sendRequest(
      "prepare",
      typeof payload === "string" ? { contextId: payload } : payload,
    );
  }

  async evaluate(payload: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest("evaluate", payload);
  }

  async activate(payload: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest("activate", payload);
  }

  async deactivate(payload: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest("deactivate", payload);
  }

  async shutdown(): Promise<void> {
    this.stopping = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.restartCount = 0;
    this.cooldownUntil = 0;

    if (!this.child) {
      this.rejectAllPending(new Error("Plugin sidecar is stopped"));
      this.stopping = false;
      return;
    }

    try {
      await this.sendRequest("shutdown", {}, 2_000);
    } catch {
      // The child may already be exiting; force cleanup below.
    } finally {
      const child = this.child;
      child?.removeAllListeners("message");
      child?.removeAllListeners("error");
      child?.removeAllListeners("exit");
      child?.kill();
      this.child = null;
      this.starting = null;
      this.rejectAllPending(new Error("Plugin sidecar was stopped"));
      this.stopping = false;
    }
  }

  private async sendRequest<T = unknown>(
    type: PluginSidecarRequestType,
    payload: Record<string, unknown>,
    timeoutMs: number = PLUGIN_SIDECAR_REQUEST_TIMEOUT_MS,
  ): Promise<T> {
    await this.ensureStarted();
    const child = this.child;
    if (!child?.connected) {
      throw new Error(`Plugin sidecar ${this.label} is unavailable`);
    }

    const id = `plugin-sidecar-${Date.now()}-${++requestCounter}`;
    const message: PluginSidecarRequest = { id, type, payload };
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(
          new Error(`Plugin sidecar ${this.label} request timed out: ${type}`),
        );
        this.restartAfterFailure(`request timed out: ${type}`);
      }, timeoutMs);
      timer.unref?.();

      this.pendingRequests.set(id, {
        resolve: (value) => resolve(value as T),
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
    if (this.cooldownUntil > Date.now()) {
      return Promise.reject(
        new Error(
          `Plugin sidecar ${this.label} restart budget exhausted until ${new Date(this.cooldownUntil).toISOString()}`,
        ),
      );
    }
    if (this.child?.connected) {
      return this.starting ?? Promise.resolve();
    }
    if (this.starting) {
      return this.starting;
    }

    this.stopping = false;
    this.starting = new Promise<void>((resolve, reject) => {
      const childPath = path.join(__dirname, "plugin-sidecar-child.js");
      const child = fork(childPath, [], {
        execArgv: [],
        serialization: "advanced",
        stdio: ["ignore", "ignore", "ignore", "ipc"],
      });
      this.child = child;

      const timer = setTimeout(() => {
        this.pendingReady = null;
        reject(new Error(`Plugin sidecar ${this.label} did not become ready`));
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

    if (message.type === "broker-request") {
      void this.handleBrokerRequest(message.id, message.request);
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

  private async handleBrokerRequest(
    id: string,
    request: PluginSidecarCapabilityRequest,
  ): Promise<void> {
    const child = this.child;
    if (!child?.connected) {
      return;
    }

    try {
      if (!this.capabilityBroker) {
        throw new Error("Plugin capability broker is unavailable");
      }
      const result = await this.capabilityBroker.invoke(request);
      child.send({ type: "broker-response", id, result });
    } catch (error) {
      child.send({
        type: "broker-error",
        id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private handleExit(reason: string): void {
    this.child = null;
    const error = new Error(`Plugin sidecar ${this.label} stopped: ${reason}`);
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
    this.scheduleRestart();
  }

  private scheduleRestart(): void {
    if (this.restartTimer) {
      return;
    }
    this.restartCount += 1;
    if (this.restartCount > PLUGIN_SIDECAR_MAX_RESTARTS) {
      this.cooldownUntil = Date.now() + PLUGIN_SIDECAR_RESTART_COOLDOWN_MS;
      return;
    }
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      void this.ensureStarted().catch(() => {
        this.scheduleRestart();
      });
    }, PLUGIN_SIDECAR_RESTART_DELAY_MS);
    this.restartTimer.unref?.();
  }
}

function isSidecarMessage(message: unknown): message is PluginSidecarMessage {
  return typeof message === "object" && message !== null && "type" in message;
}
