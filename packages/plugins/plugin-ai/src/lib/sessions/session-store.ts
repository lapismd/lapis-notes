import type { ModelRef } from "../core/types";
import type { AiChatItem } from "../chat/chat-items";

export type StoredAgentSession = {
  id: string;
  runtime: string;
  runtimeSessionId: string;
  workspace?: string;
  model?: ModelRef;
  createdAt: string;
  updatedAt: string;
  interrupted?: boolean;
  pendingApprovalId?: string;
  items: AiChatItem[];
};

export interface AgentSessionStore {
  list(): Promise<StoredAgentSession[]>;
  get(id: string): Promise<StoredAgentSession | undefined>;
  save(session: StoredAgentSession): Promise<void>;
  remove(id: string): Promise<void>;
}

export function createMemorySessionStore(
  initial: StoredAgentSession[] = [],
): AgentSessionStore {
  const sessions = new Map(initial.map((session) => [session.id, session]));
  return {
    async list() {
      return [...sessions.values()].sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );
    },
    async get(id) {
      return sessions.get(id);
    },
    async save(session) {
      sessions.set(session.id, {
        ...session,
        items: [...session.items],
        updatedAt: session.updatedAt,
      });
    },
    async remove(id) {
      sessions.delete(id);
    },
  };
}

export function createStoredAgentSession(input: {
  id: string;
  runtime: string;
  runtimeSessionId: string;
  workspace?: string;
  model?: ModelRef;
  items?: AiChatItem[];
}): StoredAgentSession {
  const now = new Date().toISOString();
  return {
    id: input.id,
    runtime: input.runtime,
    runtimeSessionId: input.runtimeSessionId,
    workspace: input.workspace,
    model: input.model,
    createdAt: now,
    updatedAt: now,
    items: input.items ?? [],
  };
}
