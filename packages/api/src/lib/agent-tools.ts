import { EventDispatcher } from "./events";

export type AppToolEffect = "read" | "write" | "external";

export type AppToolJsonValue =
  | null
  | boolean
  | number
  | string
  | AppToolJsonValue[]
  | { [key: string]: AppToolJsonValue };

export type AppToolContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string };

export interface AppToolResult {
  content: AppToolContent[];
  isError?: boolean;
  structuredContent?: AppToolJsonValue;
}

export interface AppToolApprovalDetails {
  title: string;
  description?: string;
  path?: string;
  diff?: { before: string; after: string };
}

export interface AppToolExecutionScope {
  /** Vault-relative directory fixed by the owning conversation. */
  readonly directory: string;
  contains(path: string): boolean;
  resolve(path: string): string;
}

function assertPortableVaultPath(path: string, label: string): string {
  if (path.includes("\\") || path.startsWith("/") || /^[a-z]:/iu.test(path)) {
    throw new Error(`${label} must be a vault-relative portable path.`);
  }
  const segments = path.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error(`${label} must not contain traversal segments.`);
  }
  if (segments.some((segment) => segment.length === 0) && path.length > 0) {
    throw new Error(`${label} must not contain empty path segments.`);
  }
  return path;
}

/** Construct an immutable execution scope from trusted conversation state. */
export function createAppToolExecutionScope(
  directory: string,
): AppToolExecutionScope {
  const trustedDirectory = assertPortableVaultPath(
    directory,
    "App tool scope directory",
  );
  return Object.freeze({
    directory: trustedDirectory,
    contains(path: string): boolean {
      try {
        const candidate = assertPortableVaultPath(path, "App tool path");
        return (
          trustedDirectory === "" ||
          candidate === trustedDirectory ||
          candidate.startsWith(`${trustedDirectory}/`)
        );
      } catch {
        return false;
      }
    },
    resolve(path: string): string {
      const candidate = assertPortableVaultPath(path, "App tool path");
      if (
        trustedDirectory !== "" &&
        candidate !== trustedDirectory &&
        !candidate.startsWith(`${trustedDirectory}/`)
      ) {
        throw new Error(`App tool path escapes scope: ${path}`);
      }
      return candidate;
    },
  });
}

export interface AppToolExecutionContext {
  conversationId: string;
  agentBindingId: string;
  runId: string;
  toolCallId: string;
  scope: AppToolExecutionScope;
  launchNotePath?: string;
  signal: AbortSignal;
}

export interface AppTool<TInput = unknown> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  effect: AppToolEffect;
  describeApproval?(
    input: TInput,
    context: AppToolExecutionContext,
  ): Promise<AppToolApprovalDetails>;
  execute(
    input: TInput,
    context: AppToolExecutionContext,
  ): Promise<AppToolResult>;
}

export interface AppToolOwner {
  pluginId: string;
  source: "core" | "community" | "official" | "system";
  provenance:
    | "bundled"
    | "official"
    | "community"
    | "manual"
    | "development";
}

export interface RegisteredAppTool {
  registrationId: string;
  owner: AppToolOwner;
  tool: AppTool;
}

export interface AppToolRegistration {
  readonly id: string;
  readonly name: string;
  dispose(): void;
}

export type AppToolRegistryChange = {
  registrationId: string;
  name: string;
  ownerPluginId: string;
  reason: "registered" | "unregistered";
};

export const APP_TOOL_NAME_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

let registrationSequence = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateSchema(
  schema: Record<string, unknown>,
  label: "input" | "output",
  toolName: string,
): void {
  if (!isRecord(schema)) {
    throw new Error(`App tool ${toolName} ${label} schema must be an object.`);
  }
  if (label === "input" && schema.type !== "object") {
    throw new Error(`App tool ${toolName} input schema must have type object.`);
  }
  try {
    JSON.stringify(schema);
  } catch {
    throw new Error(`App tool ${toolName} ${label} schema must be serializable.`);
  }
}

function normalizeTool<TInput>(tool: AppTool<TInput>): AppTool<TInput> {
  const name = tool.name.trim();
  if (!APP_TOOL_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid app tool name: ${tool.name}. Expected pattern ${APP_TOOL_NAME_PATTERN.source}.`,
    );
  }
  const description = tool.description.trim();
  if (!description) {
    throw new Error(`App tool ${name} description must not be empty.`);
  }
  if (!["read", "write", "external"].includes(tool.effect)) {
    throw new Error(`App tool ${name} has an invalid effect: ${tool.effect}.`);
  }
  if (typeof tool.execute !== "function") {
    throw new Error(`App tool ${name} must provide an execute function.`);
  }
  validateSchema(tool.inputSchema, "input", name);
  if (tool.outputSchema !== undefined) {
    validateSchema(tool.outputSchema, "output", name);
  }
  return { ...tool, name, description };
}

/** Transport-neutral registry for plugin-owned application tools. */
export class AppToolRegistry extends EventDispatcher<{
  changed: [change: AppToolRegistryChange];
}> {
  private readonly tools = new Map<string, RegisteredAppTool>();

  register<TInput>(
    owner: AppToolOwner,
    tool: AppTool<TInput>,
  ): AppToolRegistration {
    const registeredTool = normalizeTool(tool) as AppTool;
    if (!owner.pluginId.trim()) {
      throw new Error("App tool owner plugin id must not be empty.");
    }
    if (this.tools.has(registeredTool.name)) {
      throw new Error(`App tool already registered: ${registeredTool.name}`);
    }

    const registrationId = `app-tool-${++registrationSequence}`;
    const registered: RegisteredAppTool = {
      registrationId,
      owner: { ...owner, pluginId: owner.pluginId.trim() },
      tool: registeredTool,
    };
    this.tools.set(registeredTool.name, registered);
    this.emit("changed", {
      registrationId,
      name: registeredTool.name,
      ownerPluginId: registered.owner.pluginId,
      reason: "registered",
    });

    let disposed = false;
    return {
      id: registrationId,
      name: registeredTool.name,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        if (this.tools.get(registeredTool.name) !== registered) return;
        this.tools.delete(registeredTool.name);
        this.emit("changed", {
          registrationId,
          name: registeredTool.name,
          ownerPluginId: registered.owner.pluginId,
          reason: "unregistered",
        });
      },
    };
  }

  get(name: string): RegisteredAppTool | undefined {
    return this.tools.get(name);
  }

  resolve(name: string, registrationId: string): RegisteredAppTool | undefined {
    const registered = this.tools.get(name);
    return registered?.registrationId === registrationId
      ? registered
      : undefined;
  }

  list(): RegisteredAppTool[] {
    return [...this.tools.values()].sort((left, right) =>
      left.tool.name.localeCompare(right.tool.name),
    );
  }
}
