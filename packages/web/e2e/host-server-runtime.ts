import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** The ordinary built server, with test-owned storage and supervised lifetime. */
export class HostServerRuntime {
  #child?: ChildProcessWithoutNullStreams;
  #exit?: Promise<number | null>;
  #logs = "";

  constructor(
    readonly root: string,
    readonly repository: string,
    readonly origin: string,
    readonly password: string,
  ) {}

  get logs(): string {
    return this.#logs;
  }

  async start(): Promise<void> {
    if (this.#child) throw new Error("The test server is already owned");
    await mkdir(join(this.root, "data"), { recursive: true });
    const secret = join(this.root, "bootstrap-password");
    await writeFile(secret, `${this.password}\n`, { mode: 0o600 });
    const child = spawn(
      process.execPath,
      [join(this.repository, "packages/server-node/dist/main.js")],
      {
        cwd: this.repository,
        stdio: "pipe",
        env: {
          ...process.env,
          LAPIS_SERVER_DATA_ROOT: join(this.root, "data"),
          LAPIS_SERVER_STATIC_ROOT: join(
            this.repository,
            "packages/web/dist-server",
          ),
          LAPIS_SERVER_HOST: "127.0.0.1",
          LAPIS_SERVER_PORT: new URL(this.origin).port,
          LAPIS_SERVER_ORIGIN: this.origin,
          LAPIS_SERVER_INSECURE_COOKIE: "1",
          LAPIS_SERVER_BOOTSTRAP_USERNAME: "owner",
          LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE: secret,
          LAPIS_SERVER_BUILD_ID: "browser-acceptance",
        },
      },
    );
    this.#child = child;
    this.#logs = "";
    const log = (chunk: unknown) => {
      this.#logs = `${this.#logs}${String(chunk)}`.slice(-32_768);
    };
    child.stdout.on("data", log);
    child.stderr.on("data", log);
    child.on("error", (error) => log(error.message));
    child.stdin.end();
    this.#exit = new Promise((resolve) => child.once("close", resolve));
  }

  async stop(requireCleanExit: boolean): Promise<void> {
    const child = this.#child;
    if (!child) return;
    if (child.exitCode === null && child.signalCode === null)
      child.kill("SIGTERM");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("Host test server exceeded its shutdown deadline"));
      }, 15_000);
    });
    try {
      const code = await Promise.race([this.#exit!, timeout]);
      this.#child = undefined;
      if (requireCleanExit && code !== 0) {
        throw new Error(`Host test server exited with ${code}\n${this.logs}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }
}
