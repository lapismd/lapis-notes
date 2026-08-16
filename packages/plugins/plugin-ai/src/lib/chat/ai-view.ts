import {
  View,
  type ViewStateResult,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import type { ComposerSearchSource } from "@lapismd/design-core/ai/chat";
import { mount, unmount } from "svelte";
import type {
  AgentRequest,
  AgentRuntime,
  ModelRef,
  ToolContribution,
} from "../core/types";
import type {
  ConversationRepository,
  CreateConversationInput,
} from "../conversations/conversation-repository";
import type { ConversationLocation } from "../conversations/types";
import type { AiPluginSettings } from "../settings/ai-settings";
import AiViewPanel from "./ai-view-panel.svelte";
import { AiViewType } from "./ai-view-type";
export { AiViewType } from "./ai-view-type";

export type AiViewHost = {
  selectRuntime(request: AgentRequest): Promise<AgentRuntime>;
  fallbackRuntime(): AgentRuntime;
  liveRuntimeUnavailableReason(): string | null;
  tools: { list(): ToolContribution[] };
  conversations: ConversationRepository;
  createConversationInput(explicitFolder?: string): CreateConversationInput;
  listConversationFolders(): string[];
  revealConversationHistory(): Promise<void>;
  subscribeConversationMoves?(
    listener: (oldPath: string, newPath: string) => void,
  ): () => void;
  searchVaultFiles: ComposerSearchSource;
  getSettings(): AiPluginSettings;
  updateSettings(patch: Partial<AiPluginSettings>): Promise<void>;
  subscribeSettings?(
    listener: (patch: Partial<AiPluginSettings>) => void,
  ): () => void;
  models: { listModels(provider: string): Promise<ModelRef[]> };
  workspace?: string;
};

export class AiView extends View {
  private component: Record<string, unknown> | null = null;
  private disposed = false;
  private mountGeneration = 0;
  private readonly host: AiViewHost;

  constructor(leaf: WorkspaceLeaf, host: AiViewHost) {
    super(leaf);
    this.host = host;
  }

  getViewType(): string {
    return AiViewType;
  }

  getDisplayText(): string {
    return "AI";
  }

  getIcon(): string {
    return "sparkles";
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.disposed = false;
    this.mountGeneration += 1;
    this.mountPanel(this.mountGeneration);
  }

  onunload(): void {
    this.disposed = true;
    this.mountGeneration += 1;
    if (this.component) void unmount(this.component);
    this.component = null;
  }

  async setState(
    state: Record<string, unknown>,
    result?: ViewStateResult,
  ): Promise<void> {
    const previous = conversationLocationFromState(this.getState());
    await super.setState(state, result);
    const next = conversationLocationFromState(state);
    if (this.component && !sameLocation(previous, next)) {
      this.mountGeneration += 1;
      const generation = this.mountGeneration;
      await unmount(this.component);
      this.component = null;
      if (!this.disposed) this.mountPanel(generation);
    }
  }

  private mountPanel(generation: number): void {
    const initialLocation = conversationLocationFromState(this.getState());
    if (
      this.disposed ||
      this.component ||
      generation !== this.mountGeneration
    ) {
      return;
    }
    this.component = mount(AiViewPanel, {
      target: this.containerEl,
      props: {
        host: this.host,
        initialLocation,
        onConversationLocationChange: (
          location: ConversationLocation | null,
        ) => {
          this.persistLocationHint(location);
        },
      },
    }) as Record<string, unknown>;
  }

  private persistLocationHint(location: ConversationLocation | null): void {
    const state = { ...this.getState() };
    if (location) {
      state.scopeDir = location.scopeDir;
      state.conversationId = location.conversationId;
    } else {
      delete state.scopeDir;
      delete state.conversationId;
    }
    void super.setState(state);
  }
}

function conversationLocationFromState(
  state: Record<string, unknown>,
): ConversationLocation | null {
  return typeof state.scopeDir === "string" &&
    typeof state.conversationId === "string"
    ? {
        scopeDir: state.scopeDir,
        conversationId: state.conversationId,
      }
    : null;
}

function sameLocation(
  left: ConversationLocation | null,
  right: ConversationLocation | null,
): boolean {
  return (
    left?.scopeDir === right?.scopeDir &&
    left?.conversationId === right?.conversationId
  );
}
