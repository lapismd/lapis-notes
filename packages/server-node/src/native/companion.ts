import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { connect, type Socket } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import {
  MAX_REQUEST_BYTES,
  readResponses,
  type NativeAction,
  type NativeResponse,
} from "./protocol.ts";

export type NativeLaunch = {
  executable: string;
  args?: string[];
  dataRoot: string;
  requestTimeoutMs?: number;
};
type Pending = {
  id: string;
  resolve(frame: string): void;
  reject(error: Error): void;
};
type Exit = { code: number | null; signal: NodeJS.Signals | null };

export class NativeCompanion {
  readonly #child: ChildProcess;
  readonly #exit: Promise<Exit>;
  readonly #directory: string;
  readonly #timeout: number;
  #socket?: Socket;
  #pending?: Pending;
  #failure?: Error;
  #tail: Promise<unknown> = Promise.resolve();
  #queued = 0;
  #closing?: Promise<{ graceful: boolean }>;

  static async start(launch: NativeLaunch): Promise<NativeCompanion> {
    const root = await realpath(launch.dataRoot);
    const directory = await mkdtemp(join(tmpdir(), "lapis-native-"));
    const socketPath = join(directory, "host.sock");
    const child = new NativeCompanion(launch, root, directory, socketPath);
    try {
      const deadline = Date.now() + 5_000;
      while (!child.#socket) {
        if (child.#failure) throw child.#failure;
        try {
          child.#socket = await new Promise<Socket>((resolve, reject) => {
            const socket = connect(socketPath);
            socket.once("error", reject);
            socket.once("connect", () => {
              socket.removeListener("error", reject);
              resolve(socket);
            });
          });
        } catch {
          if (Date.now() >= deadline)
            throw new Error("Native companion did not become ready");
          await delay(25);
        }
      }
      const socket = child.#socket;
      socket.on("error", () =>
        child.#fail(
          new Error("Native connection failed; outcome is uncertain"),
        ),
      );
      socket.on("close", () => {
        if (!child.#closing)
          child.#fail(
            new Error("Native connection closed; outcome is uncertain"),
          );
      });
      readResponses(
        socket,
        (response) => child.#receive(response),
        (error) => child.#fail(error),
      );
      if ((await child.request({ method: "ping" })) !== "ready")
        throw new Error("Invalid native readiness response");
      return child;
    } catch (error) {
      child.#fail(new Error("Native startup failed"));
      await child.close();
      throw error;
    }
  }
  private constructor(
    launch: NativeLaunch,
    root: string,
    directory: string,
    socket: string,
  ) {
    this.#directory = directory;
    this.#timeout = launch.requestTimeoutMs ?? 30_000;
    this.#child = spawn(
      launch.executable,
      [...(launch.args ?? []), "--socket", socket, "--data-root", root],
      {
        detached: true,
        stdio: "ignore",
        env: {
          PATH: process.env.PATH,
          LANG: process.env.LANG ?? "en_US.UTF-8",
        },
      },
    );
    this.#exit = new Promise((resolve) => {
      this.#child.once("error", () => {
        this.#fail(new Error("Native executable unavailable"));
        resolve({ code: null, signal: null });
      });
      this.#child.once("exit", (code, signal) => {
        if (!this.#closing || this.#pending)
          this.#fail(new Error("Native process exited; outcome is uncertain"));
        resolve({ code, signal });
      });
    });
  }
  request(action: NativeAction): Promise<string> {
    if (this.#closing || this.#failure)
      return Promise.reject(
        this.#failure ?? new Error("Native companion is closing"),
      );
    if (this.#queued >= 32)
      return Promise.reject(new Error("Native request queue is full"));
    if (
      action.method === "history" &&
      Buffer.byteLength(action.frame) > 128 * 1024
    )
      return Promise.reject(
        new Error("History request exceeds its byte limit"),
      );
    this.#queued++;
    const pending = this.#tail.then(() => this.#rpc(action));
    this.#tail = pending.catch(() => undefined).finally(() => this.#queued--);
    return pending;
  }
  async #rpc(action: NativeAction): Promise<string> {
    if (this.#failure) throw this.#failure;
    const id = randomUUID();
    const encoded = JSON.stringify({ version: 1, id, action }) + "\n";
    if (Buffer.byteLength(encoded) > MAX_REQUEST_BYTES)
      throw new Error("Native request exceeds its byte limit");
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          this.#fail(
            new Error("Native response timed out; outcome is uncertain"),
          ),
        this.#timeout,
      );
      this.#pending = {
        id,
        resolve: (frame) => {
          clearTimeout(timer);
          resolve(frame);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      };
      if (!this.#socket?.writable)
        this.#fail(new Error("Native connection unavailable"));
      else
        this.#socket.write(encoded, (error) => {
          if (error)
            this.#fail(new Error("Native send failed; outcome is uncertain"));
        });
    });
  }
  #receive(response: NativeResponse): void {
    const pending = this.#pending;
    if (
      !pending ||
      response.version !== 1 ||
      response.id !== pending.id ||
      (response.error === null
        ? typeof response.frame !== "string"
        : response.frame !== null)
    ) {
      this.#fail(
        new Error(
          "Invalid native response identity or shape; outcome is uncertain",
        ),
      );
      return;
    }
    this.#pending = undefined;
    if (response.error !== null) {
      const error = new Error("Native history request refused");
      Object.assign(error, { nativeError: response.error });
      pending.reject(error);
    } else pending.resolve(response.frame!);
  }
  #kill(signal: NodeJS.Signals): void {
    if (!this.#child.pid) return;
    try {
      process.kill(-this.#child.pid, signal);
    } catch {
      /* Already exited. */
    }
  }
  #fail(error: Error): void {
    this.#failure ??= error;
    this.#pending?.reject(this.#failure);
    this.#pending = undefined;
    this.#socket?.destroy();
    this.#kill("SIGTERM");
  }
  close(): Promise<{ graceful: boolean }> {
    return (this.#closing ??= this.#close());
  }
  async #close(): Promise<{ graceful: boolean }> {
    let forced = false;
    const timer = setTimeout(() => {
      forced = true;
      this.#fail(new Error("Native shutdown deadline expired"));
      this.#kill("SIGKILL");
    }, 5_000);
    let acknowledged = false;
    try {
      await this.#tail;
      if (!this.#failure)
        acknowledged = (await this.#rpc({ method: "shutdown" })) === "closed";
    } catch {
      /* Unknown completion remains a failed close. */
    }
    this.#socket?.end();
    const exit = await this.#exit;
    clearTimeout(timer);
    this.#socket?.destroy();
    await rm(this.#directory, { recursive: true, force: true });
    return {
      graceful:
        acknowledged && !forced && exit.code === 0 && exit.signal === null,
    };
  }
}
