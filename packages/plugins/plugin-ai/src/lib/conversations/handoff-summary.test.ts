import { describe, expect, it, vi } from "vitest";
import { AsyncEventQueue } from "../core/event-queue";
import type {
  AgentCapabilities,
  AgentEvent,
  AgentRequest,
  AgentRuntime,
  AgentSession,
  AgentTurnOptions,
} from "../core/types";
import { ConversationRepository } from "./conversation-repository";
import {
  HandoffSummaryCoordinator,
  RuntimeHandoffSummaryProvider,
} from "./handoff-summary";
import { MemoryTranscriptStore } from "./memory-transcript-store";
import { CONVERSATION_SCHEMA_VERSION } from "./types";

describe("HandoffSummaryCoordinator", () => {
  it("writes one hash-bound append-only summary after the threshold", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = {
      scopeDir: "Projects/Atlas",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    };
    await repository.create({ ...location, id: location.conversationId });
    await repository.appendTranscript(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "large-owner-message",
        type: "message",
        role: "user",
        text: "evidence ".repeat(6_500),
        createdAt: "2026-08-27T12:00:00.000Z",
      },
    ]);
    const provider = {
      propose: vi.fn(async () => ({
        summary: "The user supplied durable evidence.",
      })),
    };
    const coordinator = new HandoffSummaryCoordinator(repository, provider, {
      runtime: "acp",
      agent: "codex",
      model: "pinned-summary-model",
    });

    await coordinator.afterTerminal(location);
    await coordinator.afterTerminal(location);

    const summaries = (await repository.read(location)).agents.filter(
      (record) => record.type === "handoff.summary.created",
    );
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      fromEntryId: "large-owner-message",
      throughEntryId: "large-owner-message",
      sourceHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
      processor: { model: "pinned-summary-model" },
    });
    expect(provider.propose).toHaveBeenCalledOnce();
  });
});

class SummarySession implements AgentSession {
  readonly id = "summary-session";
  readonly eventsQueue = new AsyncEventQueue<AgentEvent>();
  readonly send = vi.fn(async (_input: string, _options?: AgentTurnOptions) => {
    this.eventsQueue.push({
      type: "text",
      text: JSON.stringify({ summary: "Bounded summary" }),
    });
    this.eventsQueue.push({ type: "completed" });
  });
  readonly close = vi.fn(async () => this.eventsQueue.close());
  events(): AsyncIterable<AgentEvent> {
    return this.eventsQueue;
  }
  async respondToApproval(): Promise<void> {}
}

describe("RuntimeHandoffSummaryProvider", () => {
  it("uses a pinned restricted no-tool session", async () => {
    const session = new SummarySession();
    let request: AgentRequest | undefined;
    const runtime: AgentRuntime = {
      id: "acp",
      capabilities: (): AgentCapabilities => ({
        sessions: true,
        resume: false,
        cancel: true,
        steer: false,
        modelSelection: true,
        nativeTools: true,
        mcpTools: true,
        approvals: {
          supported: false,
          interactive: false,
          persistentDecisions: false,
          granularPermissions: false,
          policyAmendments: false,
        },
      }),
      async supports() {
        return true;
      },
      async start(next) {
        request = next;
        return session;
      },
    };
    const provider = new RuntimeHandoffSummaryProvider({
      configuration: () => ({
        runtime: "acp",
        agent: "cursor",
        model: "pinned-summary-model",
      }),
      resolveRuntime: async () => runtime,
    });

    await expect(
      provider.propose({
        conversationId: "conversation-1",
        fromEntryId: "entry-1",
        throughEntryId: "entry-1",
        sourceHash: "a".repeat(64),
        entries: [
          {
            id: "entry-1",
            hash: "b".repeat(64),
            type: "message",
            role: "user",
            content: "Remember the decision.",
          },
        ],
      }),
    ).resolves.toEqual({ summary: "Bounded summary" });
    expect(request).toMatchObject({
      agent: "cursor",
      model: { provider: "cursor", model: "pinned-summary-model" },
      restricted: true,
      mcpServers: [],
      metadata: { purpose: "conversation-handoff-summary" },
    });
    expect(request).not.toHaveProperty("workspace");
    expect(request).not.toHaveProperty("appToolSession");
  });
});
