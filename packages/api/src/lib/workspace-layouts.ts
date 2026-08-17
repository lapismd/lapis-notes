export const NAMED_WORKSPACES_FILE = "workspaces.json";

export interface NamedWorkspaceStore {
  workspaces: Record<string, unknown>;
  active?: string;
}

export function parseNamedWorkspaceStore(raw: string): NamedWorkspaceStore {
  try {
    const parsed = JSON.parse(raw) as {
      workspaces?: unknown;
      active?: unknown;
    };
    const workspaces =
      parsed.workspaces &&
      typeof parsed.workspaces === "object" &&
      !Array.isArray(parsed.workspaces)
        ? (parsed.workspaces as Record<string, unknown>)
        : {};
    return {
      workspaces,
      ...(typeof parsed.active === "string" && parsed.active
        ? { active: parsed.active }
        : {}),
    };
  } catch {
    return { workspaces: {} };
  }
}

export function serializeNamedWorkspaceStore(
  store: NamedWorkspaceStore,
): string {
  return `${JSON.stringify(store, null, 2)}\n`;
}
