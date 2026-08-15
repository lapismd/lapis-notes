import type { ModelRef } from "../core/types";
import type {
  AgentProcessHandle,
  AgentProcessHost,
} from "../host/process-host";

type AppServerMessage = {
  id?: string | number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { message?: string } | unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function normalizeCodexModelList(result: unknown): ModelRef[] {
  const data = asRecord(result).data;
  if (!Array.isArray(data)) return [];
  const models: ModelRef[] = [];
  const seen = new Set<string>();
  for (const entry of data) {
    const record = asRecord(entry);
    const model = stringValue(record.model) ?? stringValue(record.id);
    if (!model || seen.has(model)) continue;
    seen.add(model);
    models.push({ provider: "codex", model });
  }
  return models;
}

export async function listCodexModelsFromHost(
  host: AgentProcessHost,
  options: { cwd?: string; timeoutMs?: number } = {},
): Promise<ModelRef[]> {
  if (!host.available) return [];
  const process = await host.spawn({
    command: "codex",
    args: ["app-server", "--stdio"],
    cwd: options.cwd,
  });
  const rpc = new CodexCatalogRpc(process);
  const timeoutMs = options.timeoutMs ?? 10_000;
  const timeout = setTimeout(() => {
    void process.kill();
  }, timeoutMs);
  try {
    await rpc.request("initialize", {
      clientInfo: {
        name: "lapis_ai_model_catalog",
        title: "Lapis AI Model Catalog",
        version: "0.0.1",
      },
      capabilities: {},
    });
    await rpc.notify("initialized", {});
    const models: ModelRef[] = [];
    let cursor: string | null = null;
    const seenCursors = new Set<string>();
    do {
      const result = await rpc.request("model/list", {
        limit: 100,
        includeHidden: false,
        ...(cursor ? { cursor } : {}),
      });
      models.push(...normalizeCodexModelList(result));
      const nextCursor = stringValue(asRecord(result).nextCursor) ?? null;
      if (!nextCursor || seenCursors.has(nextCursor)) break;
      seenCursors.add(nextCursor);
      cursor = nextCursor;
    } while (cursor);
    return models;
  } finally {
    clearTimeout(timeout);
    await rpc.close();
  }
}

class CodexCatalogRpc {
  #id = 1;
  #buffer = "";
  #pending = new Map<
    number,
    { resolve(value: unknown): void; reject(error: Error): void }
  >();
  #consume: Promise<void>;

  constructor(private readonly process: AgentProcessHandle) {
    this.#consume = this.#pump();
  }

  async request(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = this.#id++;
    const result = new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
    });
    await this.process.write(`${JSON.stringify({ id, method, params })}\n`);
    return result;
  }

  async notify(method: string, params: Record<string, unknown>): Promise<void> {
    await this.process.write(`${JSON.stringify({ method, params })}\n`);
  }

  async close(): Promise<void> {
    for (const [id, pending] of this.#pending) {
      this.#pending.delete(id);
      pending.reject(new Error("Codex model catalog closed."));
    }
    await this.process.kill();
    await this.#consume;
  }

  async #pump(): Promise<void> {
    try {
      for await (const message of this.process.messages()) {
        if (message.type !== "stdout") continue;
        this.#buffer += message.data;
        const lines = this.#buffer.split("\n");
        this.#buffer = lines.pop() ?? "";
        for (const line of lines) this.#handleLine(line);
      }
    } catch {
      /* process closed */
    }
  }

  #handleLine(line: string): void {
    if (!line.trim()) return;
    let parsed: AppServerMessage;
    try {
      parsed = JSON.parse(line) as AppServerMessage;
    } catch {
      return;
    }
    if (parsed.id === undefined || parsed.method) return;
    const pending = this.#pending.get(Number(parsed.id));
    if (!pending) return;
    this.#pending.delete(Number(parsed.id));
    if (parsed.error) {
      const record = asRecord(parsed.error);
      pending.reject(
        new Error(stringValue(record.message) ?? "Codex model/list failed"),
      );
      return;
    }
    pending.resolve(parsed.result);
  }
}
