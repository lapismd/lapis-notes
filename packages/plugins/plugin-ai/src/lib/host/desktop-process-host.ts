import {
  getNativeDesktopBridge,
  hasNativeDesktopCapability,
} from "@lapis-notes/api/desktop-native";
import { AsyncEventQueue } from "../core/event-queue";
import type {
  AgentProcessHandle,
  AgentProcessHost,
  AgentProcessMessage,
  AgentProcessSpawnOptions,
} from "./process-host";

type AgentProcessIpcEvent = {
  processId: string;
  type: "stdout" | "stderr" | "exit";
  data?: string;
  exitCode?: number;
};

type AgentRuntimeBridge = {
  invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
  onAgentProcessMessage?(
    listener: (event: AgentProcessIpcEvent) => void,
  ): () => void;
};

export class DesktopAgentProcessHost implements AgentProcessHost {
  get available(): boolean {
    return hasNativeDesktopCapability("agent-runtime");
  }

  async spawn(options: AgentProcessSpawnOptions): Promise<AgentProcessHandle> {
    if (!this.available) {
      throw new Error(
        "Live agent runtimes require the desktop agent-runtime capability.",
      );
    }
    const bridge = getRequiredBridge();
    const { processId } = await bridge.invoke<{ processId: string }>(
      "desktop_agent_process_spawn",
      {
        command: options.command,
        args: options.args ?? [],
        cwd: options.cwd,
        env: options.env,
        appToolBridgeId: options.appToolBridgeId,
      },
    );
    return new DesktopAgentProcessHandle(bridge, processId);
  }
}

class DesktopAgentProcessHandle implements AgentProcessHandle {
  readonly id: string;
  readonly #bridge: AgentRuntimeBridge;
  readonly #messages = new AsyncEventQueue<AgentProcessMessage>();
  readonly #unsubscribe: () => void;

  constructor(bridge: AgentRuntimeBridge, processId: string) {
    this.id = processId;
    this.#bridge = bridge;
    this.#unsubscribe =
      bridge.onAgentProcessMessage?.((event) => {
        if (event.processId !== processId) return;
        if (event.type === "exit") {
          this.#messages.push({ type: "exit", exitCode: event.exitCode ?? 0 });
          this.#messages.close();
          return;
        }
        this.#messages.push({
          type: event.type,
          data: event.data ?? "",
        });
      }) ??
      (() => {
        /* no-op when the host cannot stream */
      });
  }

  messages(): AsyncIterable<AgentProcessMessage> {
    return this.#messages;
  }

  async write(data: string): Promise<void> {
    await this.#bridge.invoke("desktop_agent_process_write", {
      processId: this.id,
      data,
    });
  }

  async kill(): Promise<void> {
    this.#unsubscribe();
    await this.#bridge.invoke("desktop_agent_process_kill", {
      processId: this.id,
    });
    this.#messages.close();
  }
}

function getRequiredBridge(): AgentRuntimeBridge {
  const bridge = getNativeDesktopBridge() as AgentRuntimeBridge | null;
  if (!bridge) {
    throw new Error("The desktop agent-runtime bridge is not registered.");
  }
  return bridge;
}

export function createAgentProcessHost(): AgentProcessHost {
  return new DesktopAgentProcessHost();
}
