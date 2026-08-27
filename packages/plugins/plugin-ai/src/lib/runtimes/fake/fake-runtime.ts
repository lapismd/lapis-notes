import { AsyncEventQueue } from "../../core/event-queue";
import {
  DEFAULT_APPROVAL_OPTIONS,
  type AgentCapabilities,
  type AgentEvent,
  type AgentRequest,
  type AgentRuntime,
  type AgentSession,
  type AgentSessionConfiguration,
  type AgentSessionConfigurationResult,
  type AgentTurnOptions,
  type ApprovalRequest,
  type UserInputAnswers,
  type UserInputRequest,
} from "../../core/types";
import type { NativeAgentCommand } from "../../skills/types";

export type FakeAgentTrace = "echo" | "rich";

export type FakeAgentRuntimeOptions = {
  id?: string;
  requireApproval?: boolean;
  requireQuestion?: boolean;
  resumeSupported?: boolean;
  trace?: FakeAgentTrace;
  nativeCommands?: NativeAgentCommand[];
};

export const FAKE_RICH_THINKING =
  "I will read the mentioned note, then summarize it.";

export const FAKE_RICH_TOOL = {
  id: "tool-vault-read",
  name: "vault.read",
  input: { path: "Notes/alpha.md" },
  output: "heading: Notes",
} as const;

export const FAKE_RICH_ASSISTANT_TEXT = [
  "## Summary",
  "",
  "I read **Notes/alpha.md** and found a `TODO`.",
  "",
  "- One heading",
  "- A note",
].join("\n");

export class FakeAgentSession implements AgentSession {
  readonly id: string;
  readonly prompts: string[] = [];
  readonly contextBlocks: AgentTurnOptions["contextBlocks"][] = [];
  readonly configurations: AgentSessionConfiguration[] = [];
  cancelled = false;
  closed = false;
  detached = false;
  readonly #events = new AsyncEventQueue<AgentEvent>();
  readonly #pending = new Map<
    string,
    { resolve(optionId: string): void; reject(error: Error): void }
  >();
  readonly #pendingQuestions = new Map<
    string,
    {
      resolve(answers: UserInputAnswers): void;
      reject(error: Error): void;
    }
  >();
  readonly #requireApproval: boolean;
  readonly #requireQuestion: boolean;
  readonly #trace: FakeAgentTrace;
  readonly #nativeCommands: NativeAgentCommand[];

  constructor(
    id: string,
    requireApproval: boolean,
    trace: FakeAgentTrace = "echo",
    requireQuestion = false,
    nativeCommands: NativeAgentCommand[] = [],
  ) {
    this.id = id;
    this.#requireApproval = requireApproval;
    this.#requireQuestion = requireQuestion;
    this.#trace = trace;
    this.#nativeCommands = nativeCommands;
    if (nativeCommands.length > 0) {
      this.#events.push({
        type: "commands.update",
        commands: nativeCommands,
      });
    }
  }

  events(): AsyncIterable<AgentEvent> {
    return this.#events;
  }

  async send(input: string, options?: AgentTurnOptions): Promise<void> {
    if (this.closed) throw new Error("Fake session is closed.");
    this.prompts.push(input);
    this.contextBlocks.push(structuredClone(options?.contextBlocks));
    if (this.#trace === "rich") {
      this.#events.push({
        type: "thinking",
        text: FAKE_RICH_THINKING,
        kind: "reasoning",
      });
      this.#events.push({
        type: "tool.start",
        id: FAKE_RICH_TOOL.id,
        name: FAKE_RICH_TOOL.name,
        input: FAKE_RICH_TOOL.input,
      });
      this.#events.push({
        type: "tool.end",
        id: FAKE_RICH_TOOL.id,
        name: FAKE_RICH_TOOL.name,
        output: FAKE_RICH_TOOL.output,
      });
      this.#events.push({ type: "text", text: FAKE_RICH_ASSISTANT_TEXT });
      this.#events.push({ type: "status", status: "session updated" });
      this.#events.push({
        type: "status",
        status: "available commands updated (75)",
      });
      this.#events.push({
        type: "usage",
        usage: { used: 12_920, limit: 128_000 },
      });
    } else {
      this.#events.push({ type: "text", text: input });
    }
    if (this.#requireApproval) {
      const request = createFakeApprovalRequest(
        `approval-${this.prompts.length}`,
      );
      this.#events.push({ type: "permission.request", request });
      const optionId = await new Promise<string>((resolve, reject) => {
        this.#pending.set(request.id, { resolve, reject });
      });
      this.#events.push({
        type: "status",
        status: `approval:${request.id}:${optionId}`,
      });
    }
    if (this.#requireQuestion) {
      const request = createFakeQuestionRequest(
        `question-${this.prompts.length}`,
      );
      this.#events.push({ type: "question.request", request });
      await new Promise<UserInputAnswers>((resolve, reject) => {
        this.#pendingQuestions.set(request.id, { resolve, reject });
      });
    }
    this.#events.push({ type: "completed", result: { prompt: input } });
  }

  async configure(
    input: AgentSessionConfiguration,
  ): Promise<AgentSessionConfigurationResult> {
    this.configurations.push(structuredClone(input));
    return {
      ...(input.model ? { model: { status: "applied" as const } } : {}),
      ...(input.thinking ? { thinking: { status: "applied" as const } } : {}),
    };
  }

  async respondToApproval(requestId: string, optionId: string): Promise<void> {
    const pending = this.#pending.get(requestId);
    if (!pending) {
      throw new Error(`Unknown approval request: ${requestId}`);
    }
    this.#pending.delete(requestId);
    pending.resolve(optionId);
  }

  async respondToQuestion(
    requestId: string,
    answers: UserInputAnswers,
  ): Promise<void> {
    const pending = this.#pendingQuestions.get(requestId);
    if (!pending) {
      throw new Error(`Unknown question request: ${requestId}`);
    }
    this.#pendingQuestions.delete(requestId);
    pending.resolve(answers);
  }

  async cancel(): Promise<void> {
    this.cancelled = true;
    for (const [id, pending] of this.#pending) {
      this.#pending.delete(id);
      pending.reject(new Error("Session cancelled."));
    }
    for (const [id, pending] of this.#pendingQuestions) {
      this.#pendingQuestions.delete(id);
      pending.reject(new Error("Session cancelled."));
    }
    this.#events.push({ type: "status", status: "cancelled" });
  }

  async close(): Promise<void> {
    this.closed = true;
    for (const [id, pending] of this.#pending) {
      this.#pending.delete(id);
      pending.reject(new Error("Session closed."));
    }
    for (const [id, pending] of this.#pendingQuestions) {
      this.#pendingQuestions.delete(id);
      pending.reject(new Error("Session closed."));
    }
    this.#events.close();
  }

  async detach(): Promise<void> {
    this.detached = true;
    await this.close();
  }
}

export class FakeAgentRuntime implements AgentRuntime {
  readonly id: string;
  readonly sessions: FakeAgentSession[] = [];
  lastRequest: AgentRequest | null = null;
  readonly #requireApproval: boolean;
  readonly #requireQuestion: boolean;
  readonly #resumeSupported: boolean;
  readonly #trace: FakeAgentTrace;
  readonly #nativeCommands: NativeAgentCommand[];

  constructor(options: FakeAgentRuntimeOptions = {}) {
    this.id = options.id ?? "fake";
    this.#requireApproval = options.requireApproval ?? false;
    this.#requireQuestion = options.requireQuestion ?? false;
    this.#resumeSupported = options.resumeSupported ?? true;
    this.#trace = options.trace ?? "echo";
    this.#nativeCommands = options.nativeCommands ?? [];
  }

  capabilities(): AgentCapabilities {
    return {
      sessions: true,
      resume: this.#resumeSupported,
      cancel: true,
      steer: false,
      modelSelection: true,
      nativeTools: false,
      mcpTools: true,
      approvals: {
        supported: true,
        interactive: true,
        persistentDecisions: true,
        granularPermissions: false,
        policyAmendments: false,
      },
    };
  }

  async supports(request: AgentRequest): Promise<boolean> {
    if (request.requirePolicyAmendments) return false;
    return true;
  }

  async start(request: AgentRequest): Promise<AgentSession> {
    this.lastRequest = request;
    const session = new FakeAgentSession(
      `fake-${this.sessions.length + 1}`,
      this.#requireApproval || Boolean(request.requireApprovals),
      this.#trace,
      this.#requireQuestion,
      this.#nativeCommands,
    );
    this.sessions.push(session);
    return session;
  }

  async resume(sessionId: string): Promise<AgentSession> {
    if (!this.#resumeSupported) {
      throw new Error("Fake runtime does not support resume.");
    }
    const existing = this.sessions.find((session) => session.id === sessionId);
    if (!existing) throw new Error(`Unknown fake session: ${sessionId}`);
    if (!existing.closed) return existing;
    if (!existing.detached) {
      throw new Error(`Unknown fake session: ${sessionId}`);
    }
    const resumed = new FakeAgentSession(
      sessionId,
      this.#requireApproval,
      this.#trace,
      this.#requireQuestion,
      this.#nativeCommands,
    );
    this.sessions.push(resumed);
    return resumed;
  }
}

function createFakeApprovalRequest(id: string): ApprovalRequest {
  return {
    id,
    origin: "runtime",
    kind: "execute",
    title: "Allow the fake agent to continue?",
    tool: { name: "fake.echo", input: { id } },
    options: DEFAULT_APPROVAL_OPTIONS,
  };
}

function createFakeQuestionRequest(id: string): UserInputRequest {
  return {
    id,
    title: "Agent needs input",
    questions: [
      {
        id: "approach",
        header: "Approach",
        prompt: "How should I update the sample file?",
        options: [
          {
            id: "approach-minimal",
            label: "Make the smallest change",
            description:
              "Keep the existing structure and edit only what is needed.",
          },
          {
            id: "approach-refactor",
            label: "Refactor while editing",
            description:
              "Clean up the surrounding structure as part of the change.",
          },
        ],
        allowOther: true,
        secret: false,
      },
    ],
  };
}
