import type { Component } from "svelte";
import { EventDispatcher } from "./events";

export type AgentResultViewState = "running" | "completed" | "error";

export interface AgentResultViewConversation {
  conversationId?: string;
  scopeDirectory?: string;
  launchNotePath?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentResultViewProps<TApp = object> {
  app: TApp;
  conversation?: AgentResultViewConversation;
  name: string;
  input?: unknown;
  output?: unknown;
  state?: AgentResultViewState;
}

export interface AgentResultViewDefinition<TApp = object> {
  tool?: string;
  command?: string;
  component: Component<AgentResultViewProps<TApp>>;
}

export interface RegisteredAgentResultView<TApp = object> {
  registrationId: string;
  ownerPluginId: string;
  key: string;
  kind: "tool" | "command";
  name: string;
  component: Component<AgentResultViewProps<TApp>>;
}

export interface AgentResultViewRegistration {
  readonly id: string;
  readonly key: string;
  dispose(): void;
}

export type AgentResultViewRegistryChange = {
  registrationId: string;
  key: string;
  ownerPluginId: string;
  reason: "registered" | "unregistered";
};

const NAME_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

let registrationSequence = 0;

export function agentResultViewKey(
  kind: "tool" | "command",
  name: string,
): string {
  return `${kind}:${name}`;
}

function normalizeName(value: string | undefined, label: string): string {
  const name = value?.trim() ?? "";
  if (!NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid result view ${label}: ${value ?? ""}. Expected pattern ${NAME_PATTERN.source}.`,
    );
  }
  return name;
}

function normalizeDefinition<TApp>(
  view: AgentResultViewDefinition<TApp>,
): {
  kind: "tool" | "command";
  name: string;
  key: string;
  component: Component<AgentResultViewProps<TApp>>;
} {
  const hasTool = Boolean(view.tool?.trim());
  const hasCommand = Boolean(view.command?.trim());
  if (hasTool === hasCommand) {
    throw new Error(
      "A result view must name exactly one of tool or command.",
    );
  }
  if (view.component == null) {
    throw new Error("A result view must provide a component.");
  }
  const kind = hasTool ? "tool" : "command";
  const name = normalizeName(hasTool ? view.tool : view.command, kind);
  return {
    kind,
    name,
    key: agentResultViewKey(kind, name),
    component: view.component,
  };
}

/** Registry for plugin-owned transcript result views. */
export class AppResultViewRegistry extends EventDispatcher<{
  changed: [change: AgentResultViewRegistryChange];
}> {
  private readonly views = new Map<string, RegisteredAgentResultView>();

  register<TApp>(
    ownerPluginId: string,
    view: AgentResultViewDefinition<TApp>,
  ): AgentResultViewRegistration {
    const pluginId = ownerPluginId.trim();
    if (!pluginId) {
      throw new Error("Result view owner plugin id must not be empty.");
    }
    const normalized = normalizeDefinition(view);
    if (this.views.has(normalized.key)) {
      throw new Error(`Result view already registered: ${normalized.key}`);
    }

    const registrationId = `app-result-view-${++registrationSequence}`;
    const registered: RegisteredAgentResultView = {
      registrationId,
      ownerPluginId: pluginId,
      key: normalized.key,
      kind: normalized.kind,
      name: normalized.name,
      component: normalized.component as Component<AgentResultViewProps>,
    };
    this.views.set(normalized.key, registered);
    this.emit("changed", {
      registrationId,
      key: normalized.key,
      ownerPluginId: pluginId,
      reason: "registered",
    });

    let disposed = false;
    return {
      id: registrationId,
      key: normalized.key,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        if (this.views.get(normalized.key) !== registered) return;
        this.views.delete(normalized.key);
        this.emit("changed", {
          registrationId,
          key: normalized.key,
          ownerPluginId: pluginId,
          reason: "unregistered",
        });
      },
    };
  }

  getByTool(name: string): RegisteredAgentResultView | undefined {
    return this.views.get(agentResultViewKey("tool", name.trim()));
  }

  getByCommand(name: string): RegisteredAgentResultView | undefined {
    return this.views.get(agentResultViewKey("command", name.trim()));
  }

  list(): RegisteredAgentResultView[] {
    return [...this.views.values()].sort((left, right) =>
      left.key.localeCompare(right.key),
    );
  }
}
