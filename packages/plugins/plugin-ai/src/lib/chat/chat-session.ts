import type {
  AgentRuntime,
  AgentUsage,
  AiThinkingLevel,
  ModelRef,
} from "../core/types";
import {
  interruptPendingApprovals,
  pendingApprovalIdFromItems,
  type AgentSessionStore,
  type StoredAgentSession,
} from "../sessions/session-store";
import type { AiChatItem } from "./chat-items";

export function chatSessionId(
  workspace?: string,
  runtime?: string,
  agent?: string,
): string {
  const base = `ai:${workspace?.trim() || "default"}`;
  return runtime && agent ? `${base}:${runtime}:${agent}` : base;
}

export async function loadStoredChatSession(
  store: AgentSessionStore | undefined,
  sessionId: string,
): Promise<StoredAgentSession | undefined> {
  if (!store) return undefined;
  return store.get(sessionId);
}

export function applyStoredSessionResumePolicy(input: {
  stored: StoredAgentSession;
  runtime: AgentRuntime;
  resumed: boolean;
}): {
  items: AiChatItem[];
  interrupted: boolean;
  pendingApprovalId?: string;
} {
  const canResume = Boolean(
    input.runtime.capabilities().resume && input.runtime.resume,
  );
  if (canResume && input.resumed) {
    return {
      items: [...input.stored.items],
      interrupted: false,
      pendingApprovalId: pendingApprovalIdFromItems(input.stored.items),
    };
  }
  const items = interruptPendingApprovals(input.stored.items);
  return {
    items,
    interrupted: Boolean(
      input.stored.pendingApprovalId ??
        pendingApprovalIdFromItems(input.stored.items),
    ),
    pendingApprovalId: undefined,
  };
}

export function snapshotStoredChatSession(input: {
  id: string;
  runtime: string;
  runtimeSessionId: string;
  workspace?: string;
  agent?: string;
  model?: ModelRef;
  thinking?: AiThinkingLevel;
  usage?: AgentUsage;
  items: AiChatItem[];
  createdAt?: string;
  interrupted?: boolean;
}): StoredAgentSession {
  const now = new Date().toISOString();
  return {
    id: input.id,
    runtime: input.runtime,
    runtimeSessionId: input.runtimeSessionId,
    workspace: input.workspace,
    agent: input.agent,
    model: input.model,
    thinking: input.thinking,
    usage: input.usage ? { ...input.usage } : undefined,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
    interrupted: input.interrupted,
    pendingApprovalId: pendingApprovalIdFromItems(input.items),
    items: [...input.items],
  };
}
