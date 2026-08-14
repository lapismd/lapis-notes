import type {
  AgentRequest,
  AgentRuntime,
  AgentSession,
  ToolContribution,
} from "../core/types";
import {
  applyAgentEventToChatItems,
  markApprovalResponse,
} from "./chat-trace";
import type { AiChatItem } from "./chat-items";

export class AiChatController {
  items = $state.raw<AiChatItem[]>([]);
  busy = $state(false);
  error = $state<string | null>(null);
  session: AgentSession | null = null;
  readonly runtime: AgentRuntime;
  readonly unavailableReason: string | null;
  readonly tools: ToolContribution[];

  constructor(
    runtime: AgentRuntime,
    unavailableReason: string | null = null,
    tools: ToolContribution[] = [],
  ) {
    this.runtime = runtime;
    this.unavailableReason = unavailableReason;
    this.tools = tools;
  }

  async submit(
    prompt: string,
    request: Omit<AgentRequest, "prompt"> = {},
  ): Promise<void> {
    const text = prompt.trim();
    if (!text || this.busy) return;
    this.error = null;
    this.busy = true;
    this.items = [
      ...this.items,
      {
        id: `user-${this.items.length + 1}`,
        type: "message",
        role: "user",
        text,
      },
    ];
    try {
      if (!this.session) {
        this.session = await this.runtime.start({
          ...request,
          prompt: "",
          tools: request.tools ?? this.tools,
        });
        void this.#consume(this.session);
      }
      await this.session.send(text);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      this.busy = false;
    }
  }

  async respondToApproval(requestId: string, optionId: string): Promise<void> {
    if (!this.session) return;
    this.items = markApprovalResponse(this.items, requestId, optionId);
    await this.session.respondToApproval(requestId, optionId);
  }

  async cancel(): Promise<void> {
    await this.session?.cancel?.();
    this.busy = false;
  }

  async close(): Promise<void> {
    await this.session?.close();
    this.session = null;
    this.busy = false;
  }

  async #consume(session: AgentSession): Promise<void> {
    try {
      for await (const event of session.events()) {
        this.items = applyAgentEventToChatItems(this.items, event);
        if (event.type === "completed" || event.type === "error") {
          this.busy = false;
        }
      }
    } finally {
      this.busy = false;
    }
  }
}
