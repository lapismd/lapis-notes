import { createHash } from "node:crypto";
import { mkdir, realpath, stat } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import {
  ManagedControllerProcess,
  type ManagedControllerOptions,
} from "@lapismd/ai-controller/managed";

export const DENO_AGENT_COMMANDS = new Set([
  "desktop_ai_controller_connection",
]);
type ManagedProcess = Pick<
  ManagedControllerProcess,
  "connection" | "close" | "onExit"
>;
interface HostOptions {
  dataDirectory: string;
  env?: NodeJS.ProcessEnv;
  start?(options: ManagedControllerOptions): Promise<ManagedProcess>;
}
const PROVIDER_ENVIRONMENT = [
  "PATH",
  "HOME",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "TMPDIR",
  "TEMP",
  "TMP",
  "XDG_CACHE_HOME",
  "XDG_CONFIG_HOME",
  "XDG_DATA_HOME",
  "XDG_STATE_HOME",
  "CODEX_HOME",
  "SSH_AUTH_SOCK",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "CURSOR_API_KEY",
] as const;

/** The desktop owns process lifetime; all AI execution lives in the standalone service. */
export class DenoAgentRuntimeHost {
  readonly #services = new Map<string, Promise<ManagedProcess>>();
  #stopping = false;
  #shutdown?: Promise<void>;
  constructor(readonly options: HostOptions) {}

  async handle(command: string, payload: Record<string, unknown>) {
    if (!DENO_AGENT_COMMANDS.has(command))
      throw new Error(`Unsupported agent command: ${command}`);
    if (this.#stopping) throw new Error("AI controller host is shutting down");
    if (typeof payload.workspace !== "string" || !isAbsolute(payload.workspace))
      throw new Error(
        "An absolute vault workspace is required for the AI controller",
      );
    const workspace = await realpath(payload.workspace);
    if (!(await stat(workspace)).isDirectory())
      throw new Error("AI controller workspace must be a directory");
    if (this.#stopping) throw new Error("AI controller host is shutting down");
    let service = this.#services.get(workspace);
    if (!service) {
      service = this.#start(workspace);
      this.#services.set(workspace, service);
      const expected = service;
      void service.then(
        (process) => {
          process.onExit(() => {
            if (this.#services.get(workspace) === expected)
              this.#services.delete(workspace);
          });
        },
        () => {
          if (this.#services.get(workspace) === expected)
            this.#services.delete(workspace);
        },
      );
    }
    const process = await service;
    if (this.#stopping) throw new Error("AI controller host is shutting down");
    return process.connection;
  }

  async #start(workspace: string): Promise<ManagedProcess> {
    const directory = join(this.options.dataDirectory, "ai-controller");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const source = this.options.env ?? process.env;
    const env: NodeJS.ProcessEnv = {};
    for (const key of PROVIDER_ENVIRONMENT)
      if (source[key] !== undefined) env[key] = source[key];
    return (this.options.start ?? ManagedControllerProcess.start)({
      workspace,
      database: join(
        directory,
        `${createHash("sha256").update(workspace).digest("hex")}.sqlite`,
      ),
      env,
      executable: {
        command: source.LAPIS_AI_CONTROLLER_BIN || "lapis-ai-controller",
      },
    });
  }

  shutdown(): Promise<void> {
    if (this.#shutdown) return this.#shutdown;
    this.#stopping = true;
    this.#shutdown = (async () => {
      const services = await Promise.allSettled(this.#services.values());
      await Promise.all(
        services.map((service) =>
          service.status === "fulfilled" ? service.value.close() : undefined,
        ),
      );
      this.#services.clear();
    })();
    return this.#shutdown;
  }
}
