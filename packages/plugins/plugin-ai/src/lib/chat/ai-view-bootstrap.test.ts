import { describe, expect, it, vi } from "vitest";
import type { AgentRuntime } from "../core/types";
import { ConversationRepository } from "../conversations/conversation-repository";
import { MemoryTranscriptStore } from "../conversations/memory-transcript-store";
import { CONVERSATION_SCHEMA_VERSION } from "../conversations/types";
import { FakeAgentRuntime } from "../runtimes/fake/fake-runtime";
import { DEFAULT_AI_SETTINGS, mergeAiSettings } from "../settings/ai-settings";
import type { AiViewHost } from "./ai-view";
import { LIVE_RUNTIME_UNAVAILABLE_REASON } from "./live-runtime-unavailable";
import {
  initialAiViewBootstrap,
  prepareAiViewBootstrap,
} from "./ai-view-bootstrap";

const ID = "123e4567-e89b-42d3-a456-426614174000";
const CREATED_AT = "2026-08-16T10:00:00.000Z";

function createHost(
  options: { selectedId?: string; unavailableReason?: string | null } = {},
) {
  const fallback = new FakeAgentRuntime({ resumeSupported: false });
  const selected = new FakeAgentRuntime({
    id: options.selectedId ?? "selected",
  });
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  let settings = mergeAiSettings(DEFAULT_AI_SETTINGS);
  const listModels = vi.fn(async (provider: string) => [
    {
      provider,
      model: provider === "cursor" ? "composer-2.5" : "gpt-5.6-sol",
      isDefault: true,
    },
  ]);
  const selectRuntime = vi.fn(async () => selected as AgentRuntime);
  const host: AiViewHost = {
    selectRuntime,
    fallbackRuntime: () => fallback,
    liveRuntimeUnavailableReason: () => options.unavailableReason ?? null,
    mcpServers: { list: () => [] },
    conversations: repository,
    createConversationInput: () => ({ scopeDir: "" }),
    currentConversationScope: () => "",
    listConversationFolders: () => [""],
    revealConversationHistory: async () => {},
    searchVaultFiles: async () => [],
    getSettings: () => settings,
    updateSettings: async (patch) => {
      const acpAgent = patch.acpAgent ?? settings.acpAgent;
      const defaultModels = {
        ...settings.defaultModels,
        ...patch.defaultModels,
      };
      if (patch.defaultModel !== undefined) {
        defaultModels[acpAgent] = patch.defaultModel.trim();
      }
      settings = mergeAiSettings({
        ...settings,
        ...patch,
        acpAgent,
        defaultModels,
      });
    },
    models: { listModels },
  };
  return { fallback, host, listModels, repository, selectRuntime };
}

describe("AI view bootstrap", () => {
  it("provides a synchronous fallback without starting provider work", () => {
    const { fallback, host, listModels, selectRuntime } = createHost();

    expect(initialAiViewBootstrap(host)).toMatchObject({
      runtime: fallback,
      settings: DEFAULT_AI_SETTINGS,
      models: [],
      modelCatalogError: null,
      unavailableReason: null,
    });
    expect(listModels).not.toHaveBeenCalled();
    expect(selectRuntime).not.toHaveBeenCalled();
  });

  it("prepares the exact durable binding after the shell is available", async () => {
    const { host, repository, selectRuntime } = createHost();
    const location = { scopeDir: "Notes", conversationId: ID };
    await repository.create({
      id: ID,
      scopeDir: "Notes",
      now: CREATED_AT,
    });
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        type: "binding.created",
        id: "binding-native",
        createdAt: CREATED_AT,
        runtime: "codex-native",
        agent: "codex",
        model: { provider: "codex", model: "gpt-5.6-sol" },
        thinking: "high",
      },
    ]);

    const prepared = await prepareAiViewBootstrap(host, location, []);

    expect(prepared.settings).toMatchObject({
      defaultRuntime: "codex-native",
      acpAgent: "codex",
      defaultModel: "gpt-5.6-sol",
      thinking: "high",
    });
    expect(prepared.models).toHaveLength(2);
    expect(selectRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        agent: "codex",
        model: { provider: "codex", model: "gpt-5.6-sol" },
        thinking: "high",
        metadata: { runtime: "codex-native" },
      }),
    );
  });

  it("does not report host unavailability for an explicit Fake runtime", async () => {
    const { host } = createHost({
      selectedId: "fake",
      unavailableReason: LIVE_RUNTIME_UNAVAILABLE_REASON,
    });
    await host.updateSettings({ defaultRuntime: "fake" });

    const prepared = await prepareAiViewBootstrap(host, null, []);

    expect(prepared.runtime.id).toBe("fake");
    expect(prepared.unavailableReason).toBeNull();
  });

  it("keeps a saved Cursor default when the flat catalog omits that model", async () => {
    const { host, listModels } = createHost();
    await host.updateSettings({
      acpAgent: "cursor",
      defaultModel: "composer-2.5[fast=true]",
    });
    listModels.mockImplementation(async (provider: string) =>
      provider === "cursor"
        ? []
        : [
            {
              provider,
              model: "gpt-5.6-sol",
              isDefault: true,
            },
          ],
    );

    const prepared = await prepareAiViewBootstrap(host, null, []);

    expect(prepared.settings.acpAgent).toBe("cursor");
    expect(prepared.settings.defaultModel).toBe("composer-2.5[fast=true]");
    expect(host.getSettings().defaultModel).toBe("composer-2.5[fast=true]");
  });

  it("reports a start-server message when auto falls back to Fake", async () => {
    const { host } = createHost({
      selectedId: "fake",
      unavailableReason: LIVE_RUNTIME_UNAVAILABLE_REASON,
    });

    const prepared = await prepareAiViewBootstrap(host, null, []);

    expect(prepared.runtime.id).toBe("fake");
    expect(prepared.unavailableReason).toBe(LIVE_RUNTIME_UNAVAILABLE_REASON);
  });
});
