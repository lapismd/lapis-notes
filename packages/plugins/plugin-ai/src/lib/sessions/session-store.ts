import type { AiChatItem } from "../chat/chat-items";
import type { AgentUsage, AiThinkingLevel, ModelRef } from "../core/types";

export type StoredAgentSession = {
  id: string;
  runtime: string;
  runtimeSessionId: string;
  workspace?: string;
  agent?: string;
  model?: ModelRef;
  thinking?: AiThinkingLevel;
  usage?: AgentUsage;
  createdAt: string;
  updatedAt: string;
  interrupted?: boolean;
  pendingApprovalId?: string;
  pendingQuestionId?: string;
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
  const sessions = new Map(
    initial.map((session) => [session.id, cloneSession(session)]),
  );
  return {
    async list() {
      return [...sessions.values()]
        .map(cloneSession)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },
    async get(id) {
      const session = sessions.get(id);
      return session ? cloneSession(session) : undefined;
    },
    async save(session) {
      sessions.set(session.id, cloneSession(session));
    },
    async remove(id) {
      sessions.delete(id);
    },
  };
}

export function createPersistedSessionStore(options: {
  read(): Promise<StoredAgentSession[]>;
  write(sessions: StoredAgentSession[]): Promise<void>;
}): AgentSessionStore {
  const memory = createMemorySessionStore();
  let loaded = false;

  async function ensureLoaded(): Promise<void> {
    if (loaded) return;
    for (const session of await options.read()) {
      await memory.save(session);
    }
    loaded = true;
  }

  async function persist(): Promise<void> {
    await options.write(await memory.list());
  }

  return {
    async list() {
      await ensureLoaded();
      return memory.list();
    },
    async get(id) {
      await ensureLoaded();
      return memory.get(id);
    },
    async save(session) {
      await ensureLoaded();
      await memory.save(session);
      await persist();
    },
    async remove(id) {
      await ensureLoaded();
      await memory.remove(id);
      await persist();
    },
  };
}

export function createStoredAgentSession(input: {
  id: string;
  runtime: string;
  runtimeSessionId: string;
  workspace?: string;
  agent?: string;
  model?: ModelRef;
  thinking?: AiThinkingLevel;
  usage?: AgentUsage;
  items?: AiChatItem[];
  pendingApprovalId?: string;
  pendingQuestionId?: string;
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
    createdAt: now,
    updatedAt: now,
    interrupted: input.interrupted,
    pendingApprovalId: input.pendingApprovalId,
    pendingQuestionId: input.pendingQuestionId,
    items: input.items ? input.items.map(sanitizeChatItem) : [],
  };
}

export function pendingApprovalIdFromItems(
  items: AiChatItem[],
): string | undefined {
  const pending = items.find(
    (item): item is Extract<AiChatItem, { type: "approval" }> =>
      item.type === "approval" && item.status === "pending",
  );
  return pending?.request.id;
}

export function pendingQuestionIdFromItems(
  items: AiChatItem[],
): string | undefined {
  const pending = items.find(
    (item): item is Extract<AiChatItem, { type: "question" }> =>
      item.type === "question" && item.status === "pending",
  );
  return pending?.request.id;
}

export function interruptPendingApprovals(items: AiChatItem[]): AiChatItem[] {
  return items.map((item) =>
    item.type === "approval" && item.status === "pending"
      ? { ...item, status: "cancelled" }
      : item,
  );
}

export function interruptPendingInteractions(
  items: AiChatItem[],
): AiChatItem[] {
  return items.map((item) => {
    if (item.type === "approval" && item.status === "pending") {
      return { ...item, status: "cancelled" };
    }
    if (item.type === "question" && item.status === "pending") {
      return { ...item, status: "cancelled" };
    }
    if (item.type === "thinking" && item.state === "streaming") {
      return { ...item, state: "done" };
    }
    if (item.type === "tool" && item.state === "running") {
      return { ...item, state: "completed" };
    }
    return item;
  });
}

function cloneSession(session: StoredAgentSession): StoredAgentSession {
  return {
    ...session,
    usage: session.usage ? { ...session.usage } : undefined,
    items: session.items.map(sanitizeChatItem),
  };
}

function sanitizeChatItem(item: AiChatItem): AiChatItem {
  if (item.type !== "approval") return { ...item };
  const { metadata: _vendor, ...request } = item.request;
  return { ...item, request };
}
