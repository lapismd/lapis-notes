export interface UserAgentsCommandFile {
  name: string;
  content: string;
}

export interface UserAgentsCommandStore {
  readonly root?: string;
  list(): Promise<UserAgentsCommandFile[]>;
  exists(name: string): Promise<boolean>;
  write(name: string, content: string): Promise<void>;
  subscribe?(listener: () => void): () => void;
}

const NODE_USER_AGENTS_MODULE = "./user-agents-node.js";

export class MemoryUserAgentsStore implements UserAgentsCommandStore {
  readonly files = new Map<string, string>();
  readonly #listeners = new Set<() => void>();

  constructor(readonly root = "/tmp/.lapis/agents/commands") {}

  async list(): Promise<UserAgentsCommandFile[]> {
    return [...this.files.entries()].map(([name, content]) => ({
      name,
      content,
    }));
  }

  async exists(name: string): Promise<boolean> {
    return this.files.has(name);
  }

  async write(name: string, content: string): Promise<void> {
    this.files.set(name, content);
    for (const listener of this.#listeners) listener();
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}

export async function tryCreateNodeUserAgentsStore(
  root?: string,
): Promise<UserAgentsCommandStore | undefined> {
  if (typeof process === "undefined" || !process.versions?.node) {
    return undefined;
  }
  try {
    const { createNodeUserAgentsStore } = await import(
      /* @vite-ignore */ NODE_USER_AGENTS_MODULE
    );
    return createNodeUserAgentsStore(root);
  } catch {
    return undefined;
  }
}
