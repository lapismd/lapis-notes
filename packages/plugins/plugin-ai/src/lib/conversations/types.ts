import type {
  AgentUsage,
  AiThinkingLevel,
  ApprovalKind,
  ApprovalOption,
  ModelRef,
  UserInputQuestion,
} from "../core/types";

export const CONVERSATION_SCHEMA_VERSION = 1 as const;
export const CONVERSATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export type ConversationLocation = {
  scopeDir: string;
  conversationId: string;
};

export type ConversationMetadata = {
  schemaVersion: typeof CONVERSATION_SCHEMA_VERSION;
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  launchContext?: {
    notePath?: string;
  };
  workspace?: {
    path: string;
  };
  activeAgentBindingId?: string;
  status: "active" | "archived";
};

export type AgentBindingCreatedRecord = {
  schemaVersion: typeof CONVERSATION_SCHEMA_VERSION;
  type: "binding.created";
  id: string;
  createdAt: string;
  runtime: string;
  agent?: string;
  model?: ModelRef;
  thinking?: AiThinkingLevel;
  nativeSessionId?: string;
  executionHostId?: string;
  handoffThroughEntryId?: string;
  replacesBindingId?: string;
};

export type AgentUsageRecord = {
  schemaVersion: typeof CONVERSATION_SCHEMA_VERSION;
  type: "usage.updated";
  id: string;
  createdAt: string;
  agentBindingId: string;
  turnId?: string;
  usage: AgentUsage;
};

export type AgentBindingRecord = AgentBindingCreatedRecord | AgentUsageRecord;

export type RuntimeEventProvenance = {
  sessionId: string;
  runId: string;
  sequence: number;
};

type TranscriptEntryBase = {
  schemaVersion: typeof CONVERSATION_SCHEMA_VERSION;
  id: string;
  createdAt: string;
  parentId?: string;
  agentBindingId?: string;
  source?: RuntimeEventProvenance;
};

export type TranscriptEntry =
  | (TranscriptEntryBase & {
      type: "message";
      role: "user" | "assistant";
      text: string;
    })
  | (TranscriptEntryBase & {
      type: "thinking.summary";
      text: string;
      kind?: "summary" | "plan";
    })
  | (TranscriptEntryBase & {
      type: "tool";
      toolId: string;
      name: string;
      server?: string;
      state: "completed" | "error" | "cancelled";
      input?: string;
      output?: string;
      redacted?: boolean;
      truncated?: boolean;
    })
  | (TranscriptEntryBase & {
      type: "approval.request";
      requestId: string;
      kind: ApprovalKind;
      title: string;
      tool?: { name: string; input?: string };
      options: ApprovalOption[];
      redacted?: boolean;
      truncated?: boolean;
    })
  | (TranscriptEntryBase & {
      type: "approval.response";
      requestId: string;
      option: { id: string; label: string };
    })
  | (TranscriptEntryBase & {
      type: "question.request";
      requestId: string;
      title: string;
      questions: UserInputQuestion[];
    })
  | (TranscriptEntryBase & {
      type: "question.response";
      requestId: string;
      status: "answered" | "cancelled";
    })
  | (TranscriptEntryBase & {
      type: "agent.switch";
      fromBindingId?: string;
      toBindingId: string;
      handoffThroughEntryId?: string;
    })
  | (TranscriptEntryBase & {
      type: "system.notice";
      text: string;
    })
  | (TranscriptEntryBase & {
      type: "cancelled";
      text?: string;
    })
  | (TranscriptEntryBase & {
      type: "error";
      message: string;
      retryable?: boolean;
    });

export type ConversationReadWarning = {
  file: "agents.jsonl" | "transcript.jsonl";
  line: number;
  message: string;
};

export type ConversationSnapshot = {
  location: ConversationLocation;
  metadata: ConversationMetadata;
  agents: AgentBindingRecord[];
  transcript: TranscriptEntry[];
  warnings: ConversationReadWarning[];
};

export class ConversationUnavailableError extends Error {
  constructor(
    readonly location: ConversationLocation,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ConversationUnavailableError";
  }
}
