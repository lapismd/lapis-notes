import { describe, expect, it } from "vitest";
import { AsyncEventQueue } from "../core/event-queue";
import type {
  AgentProcessHandle,
  AgentProcessHost,
  AgentProcessMessage,
} from "../host/process-host";
import { UnavailableAgentProcessHost } from "../host/process-host";
import {
  listCodexModelsFromHost,
  normalizeCodexModelList,
} from "./codex-model-catalog";
import { CodexModelProvider } from "./codex-model-provider";

class CatalogProcessHandle implements AgentProcessHandle {
  readonly id = "catalog-1";
  readonly #messages = new AsyncEventQueue<AgentProcessMessage>();

  messages(): AsyncIterable<AgentProcessMessage> {
    return this.#messages;
  }

  async write(data: string): Promise<void> {
    const message = JSON.parse(data) as {
      id?: number;
      method?: string;
      params?: { cursor?: string };
    };
    if (message.method === "initialize") {
      this.#messages.push({
        type: "stdout",
        data: `${JSON.stringify({ id: message.id, result: {} })}\n`,
      });
      return;
    }
    if (message.method !== "model/list") return;
    const page = message.params?.cursor
      ? {
          data: [{ id: "luna-id", model: "gpt-5.6-luna", displayName: "Luna" }],
          nextCursor: null,
        }
      : {
          data: [
            {
              id: "sol-id",
              model: "gpt-5.6-sol",
              displayName: "Sol",
              isDefault: true,
            },
            { id: "terra-id", model: "gpt-5.6-terra", displayName: "Terra" },
          ],
          nextCursor: "page-2",
        };
    this.#messages.push({
      type: "stdout",
      data: `${JSON.stringify({ id: message.id, result: page })}\n`,
    });
  }

  async kill(): Promise<void> {
    this.#messages.close();
  }
}

class CatalogProcessHost implements AgentProcessHost {
  readonly available = true;
  readonly handle = new CatalogProcessHandle();

  async spawn(): Promise<AgentProcessHandle> {
    return this.handle;
  }
}

describe("Codex model catalog", () => {
  it("normalizes paged model/list payloads", () => {
    expect(
      normalizeCodexModelList({
        data: [
          { id: "sol-id", model: "gpt-5.6-sol" },
          { id: "sol-id", model: "gpt-5.6-sol" },
          { model: "gpt-5.6-terra" },
        ],
      }),
    ).toEqual([
      { provider: "codex", model: "gpt-5.6-sol" },
      { provider: "codex", model: "gpt-5.6-terra" },
    ]);
  });

  it("lists models through the process host and stays empty when unavailable", async () => {
    await expect(
      listCodexModelsFromHost(new CatalogProcessHost()),
    ).resolves.toEqual([
      {
        provider: "codex",
        model: "gpt-5.6-sol",
        displayName: "Sol",
        isDefault: true,
      },
      { provider: "codex", model: "gpt-5.6-terra", displayName: "Terra" },
      { provider: "codex", model: "gpt-5.6-luna", displayName: "Luna" },
    ]);
    const unavailable = new CodexModelProvider(
      new UnavailableAgentProcessHost(),
    );
    expect(await unavailable.listModels()).toEqual([]);
    expect(await unavailable.authStatus()).toMatchObject({
      authenticated: false,
    });
  });

  it("fails closed when the process host never returns a catalog process", async () => {
    const hung: AgentProcessHost = {
      available: true,
      spawn() {
        return new Promise(() => undefined);
      },
    };
    await expect(
      listCodexModelsFromHost(hung, { timeoutMs: 20 }),
    ).rejects.toThrow("Codex model catalog spawn timed out");
  });

  it("times out when a spawned catalog process stops answering", async () => {
    const process = new MemorySilentProcess();
    await expect(
      listCodexModelsFromHost(
        {
          available: true,
          async spawn() {
            return process;
          },
        },
        { timeoutMs: 20 },
      ),
    ).rejects.toThrow("Codex model catalog request timed out");
    expect(process.killed).toBe(true);
  });
});

class MemorySilentProcess implements AgentProcessHandle {
  readonly id = "silent";
  readonly #messages = new AsyncEventQueue<AgentProcessMessage>();
  killed = false;

  messages(): AsyncIterable<AgentProcessMessage> {
    return this.#messages;
  }

  async write(): Promise<void> {}

  async kill(): Promise<void> {
    this.killed = true;
    this.#messages.close();
  }
}
