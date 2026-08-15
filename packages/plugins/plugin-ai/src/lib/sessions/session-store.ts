import type { AiChatItem } from "../chat/chat-items";
import type { ModelRef } from "../core/types";

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
  const sessions = new Map(initial.map((session) => [session.id, cloneSession(session)]));
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
  model?: ModelRef;
  items?: AiChatItem[];
  pendingApprovalId?: string;
  interrupted?: boolean;
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
    interrupted: input.interrupted,
    pendingApprovalId: input.pendingApprovalId,
    items: input.items ? [...input.items] : [],
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

export function interruptPendingApprovals(items: AiChatItem[]): AiChatItem[] {
  return items.map((item) =>
    item.type === "approval" && item.status === "pending"
      ? { ...item, status: "cancelled" }
      : item,
  );
}

function cloneSession(session: StoredAgentSession): StoredAgentSession {
  return {
    ...session,
    items: [...session.items],
  };
}
