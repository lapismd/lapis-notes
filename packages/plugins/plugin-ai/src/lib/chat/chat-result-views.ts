import type { App } from "@lapis-notes/api";
import type { Component } from "svelte";
import type { AgentResultViewProps } from "@lapis-notes/api";

export function parseToolResultPayload(value?: string): unknown {
  if (value == null || value === "") return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function resolveToolResultView(
  app: App | undefined,
  toolName: string | undefined,
): Component<AgentResultViewProps<App>> | undefined {
  if (!app || !toolName?.trim()) return undefined;
  return app.agentResultViews?.getByTool(toolName.trim())?.component as
    | Component<AgentResultViewProps<App>>
    | undefined;
}
