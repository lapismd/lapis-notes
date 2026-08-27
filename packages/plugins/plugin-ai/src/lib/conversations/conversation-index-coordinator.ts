import { CONVERSATION_ID_PATTERN, type ConversationLocation } from "./types";

type ConversationIndexWriter = {
  sync(location: ConversationLocation): Promise<void>;
  delete(location: ConversationLocation): Promise<void>;
};

type PendingIndexAction = {
  type: "sync" | "delete";
  location: ConversationLocation;
};

export type ConversationIndexErrorHandler = (
  operation: "sync" | "delete",
  location: ConversationLocation,
  error: unknown,
) => void;

export function conversationLocationFromSourcePath(
  path: string,
): ConversationLocation | null {
  const match = path.match(
    /^(?:(.*)\/)?\.lapis\/agents\/sessions\/([^/]+)(?:\/|$)/u,
  );
  const conversationId = match?.[2];
  if (!conversationId || !CONVERSATION_ID_PATTERN.test(conversationId)) {
    return null;
  }
  return { scopeDir: match?.[1] ?? "", conversationId };
}

function locationKey(location: ConversationLocation): string {
  return `${location.scopeDir}\u0000${location.conversationId}`;
}

export class ConversationIndexCoordinator {
  readonly #pending = new Map<string, PendingIndexAction>();
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly index: ConversationIndexWriter,
    private readonly onError: ConversationIndexErrorHandler = () => {},
    private readonly delay = 150,
  ) {}

  handleVaultChange(path: string, oldPath?: string): void {
    const next = conversationLocationFromSourcePath(path);
    const previous = oldPath
      ? conversationLocationFromSourcePath(oldPath)
      : null;
    if (previous && (!next || locationKey(previous) !== locationKey(next))) {
      this.#pending.set(locationKey(previous), {
        type: "delete",
        location: previous,
      });
    }
    if (next) {
      this.#pending.set(locationKey(next), { type: "sync", location: next });
    }
    if (!next && !previous) return;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      void this.flush();
    }, this.delay);
  }

  async flush(): Promise<void> {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = undefined;
    const actions = [...this.#pending.values()];
    this.#pending.clear();
    for (const action of actions) {
      if (action.type === "delete") {
        await this.#delete(action.location);
        continue;
      }
      try {
        await this.index.sync(action.location);
      } catch (error) {
        this.onError("sync", action.location, error);
        await this.#delete(action.location);
      }
    }
  }

  dispose(): void {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#pending.clear();
  }

  async #delete(location: ConversationLocation): Promise<void> {
    try {
      await this.index.delete(location);
    } catch (error) {
      this.onError("delete", location, error);
    }
  }
}
