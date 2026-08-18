import {
  createAppToolExecutionScope,
  type AppToolApprovalDetails,
  type AppToolExecutionContext,
  type AppToolJsonValue,
  type AppToolRegistry,
  type AppToolResult,
  type RegisteredAppTool,
} from "@lapis-notes/api/agent-tools";
import Ajv, { type ValidateFunction } from "ajv";
import type {
  AppToolDescriptor,
  AppToolSessionDescriptor,
  ApprovalOptionKind,
  ApprovalRequest,
} from "../core/types";
import {
  isAppToolEnabled,
  type AiPluginSettings,
} from "../settings/ai-settings";

const MAX_CONTENT_ITEMS = 32;
const MAX_TEXT_BYTES = 64 * 1024;
const MAX_STRUCTURED_BYTES = 64 * 1024;
const MAX_IMAGE_DATA_BYTES = 5 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 60_000;

export type AppToolExecutionErrorCode =
  | "approval_denied"
  | "cancelled"
  | "execution_failed"
  | "invalid_arguments"
  | "invalid_result"
  | "invalid_tool_schema"
  | "timed_out"
  | "tool_unavailable";

export class AppToolExecutionError extends Error {
  constructor(
    readonly code: AppToolExecutionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppToolExecutionError";
  }
}

export type AppToolPolicySettings = Pick<
  AiPluginSettings,
  | "appToolsEnabled"
  | "disabledAppToolNames"
  | "enabledAppToolNames"
  | "enabledCommunityToolPluginIds"
>;

export interface CreateAppToolSessionInput {
  conversationId: string;
  agentBindingId: string;
  scopeDir: string;
  launchNotePath?: string;
  runtimeSupportsAppTools: boolean;
}

export interface AppToolCall {
  runId: string;
  toolCallId: string;
  name: string;
  input: unknown;
}

export type AppToolApprovalListener = (
  request: ApprovalRequest,
  bindingId: string,
) => void;

interface PendingApproval {
  bindingId: string;
  resolve: (decision: ApprovalOptionKind) => void;
  reject: (error: AppToolExecutionError) => void;
  removeAbortListener: () => void;
}

export class AppToolApprovalBroker {
  readonly #listeners = new Set<AppToolApprovalListener>();
  readonly #pending = new Map<string, PendingApproval>();
  #sequence = 0;

  subscribe(listener: AppToolApprovalListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  request(
    bindingId: string,
    tool: RegisteredAppTool,
    input: unknown,
    details: AppToolApprovalDetails | undefined,
    signal: AbortSignal,
  ): Promise<ApprovalOptionKind> {
    if (signal.aborted) {
      return Promise.reject(cancelledError());
    }
    const id = `app-tool-approval-${++this.#sequence}`;
    const request: ApprovalRequest = {
      id,
      origin: "app-tool",
      kind: tool.tool.effect === "external" ? "network" : "write",
      title: details?.title ?? `Allow ${tool.tool.name}`,
      tool: { name: tool.tool.name, input },
      options: [
        { id: "allow-once", label: "Allow once", kind: "allow-once" },
        {
          id: "allow-session",
          label: "Allow for this session",
          kind: "allow-session",
        },
        { id: "deny-once", label: "Deny", kind: "deny-once" },
      ],
      details: {
        description: details?.description,
        path: details?.path ?? details?.paths?.join(", "),
        diff: formatApprovalDiff(details),
      },
    };

    const decision = new Promise<ApprovalOptionKind>((resolve, reject) => {
      const onAbort = () => {
        const pending = this.#pending.get(id);
        if (!pending) return;
        this.#pending.delete(id);
        pending.removeAbortListener();
        reject(cancelledError());
      };
      signal.addEventListener("abort", onAbort, { once: true });
      this.#pending.set(id, {
        bindingId,
        resolve,
        reject,
        removeAbortListener: () =>
          signal.removeEventListener("abort", onAbort),
      });
    });

    for (const listener of this.#listeners) listener(request, bindingId);
    return decision;
  }

  respond(requestId: string, decision: ApprovalOptionKind): boolean {
    const pending = this.#pending.get(requestId);
    if (!pending) return false;
    if (!isAppToolApprovalDecision(decision)) return false;
    this.#pending.delete(requestId);
    pending.removeAbortListener();
    pending.resolve(decision);
    return true;
  }

  closeBinding(bindingId: string): void {
    for (const [requestId, pending] of this.#pending) {
      if (pending.bindingId !== bindingId) continue;
      this.#pending.delete(requestId);
      pending.removeAbortListener();
      pending.reject(cancelledError());
    }
  }

  close(): void {
    for (const pending of this.#pending.values()) {
      pending.removeAbortListener();
      pending.reject(cancelledError());
    }
    this.#pending.clear();
    this.#listeners.clear();
  }
}

interface ActiveAppToolSession {
  descriptor: AppToolSessionDescriptor;
  scope: ReturnType<typeof createAppToolExecutionScope>;
}

export class AppToolHost {
  readonly approvals = new AppToolApprovalBroker();
  readonly #ajv = new Ajv({ allErrors: true, strict: false });
  readonly #sessions = new Map<string, ActiveAppToolSession>();
  readonly #grants = new Set<string>();
  readonly #validators = new Map<string, ValidateFunction>();
  readonly #activeInvocations = new Map<string, Set<() => void>>();
  readonly #registryChangeRef;

  constructor(
    private readonly registry: AppToolRegistry,
    private readonly settings: () => AppToolPolicySettings,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {
    this.#registryChangeRef = registry.on("changed", (change) => {
      if (change.reason !== "unregistered") return;
      this.expireOwner(change.ownerPluginId);
      this.#validators.delete(change.registrationId);
    });
  }

  createSession(input: CreateAppToolSessionInput): AppToolSessionDescriptor {
    if (this.#sessions.has(input.agentBindingId)) {
      throw new Error(`App tool binding already exists: ${input.agentBindingId}`);
    }
    const scope = createAppToolExecutionScope(input.scopeDir);
    const settings = this.settings();
    const eligible =
      settings.appToolsEnabled && input.runtimeSupportsAppTools
        ? this.registry
            .list()
            .filter((registered) => isEligible(registered, settings))
            .map(toDescriptor)
        : [];
    const descriptor = Object.freeze({
      conversationId: input.conversationId,
      agentBindingId: input.agentBindingId,
      scopeDir: scope.directory,
      launchNotePath: input.launchNotePath,
      tools: Object.freeze(eligible) as unknown as AppToolDescriptor[],
    });
    this.#sessions.set(input.agentBindingId, { descriptor, scope });
    return descriptor;
  }

  getSession(agentBindingId: string): AppToolSessionDescriptor | undefined {
    return this.#sessions.get(agentBindingId)?.descriptor;
  }

  async invoke(
    agentBindingId: string,
    call: AppToolCall,
    signal?: AbortSignal,
  ): Promise<AppToolResult> {
    const session = this.#sessions.get(agentBindingId);
    if (!session) throw unavailableError(call.name);
    const snapshot = session.descriptor.tools.find(
      (descriptor) => descriptor.name === call.name,
    );
    if (!snapshot) throw unavailableError(call.name);
    const registered = this.registry.resolve(
      snapshot.name,
      snapshot.registrationId,
    );
    if (!registered) throw unavailableError(call.name);

    const invocation = createInvocationSignal(signal, this.timeoutMs);
    const activeForBinding =
      this.#activeInvocations.get(agentBindingId) ?? new Set<() => void>();
    activeForBinding.add(invocation.cancel);
    this.#activeInvocations.set(agentBindingId, activeForBinding);
    const context: AppToolExecutionContext = Object.freeze({
      conversationId: session.descriptor.conversationId,
      agentBindingId: session.descriptor.agentBindingId,
      runId: call.runId,
      toolCallId: call.toolCallId,
      scope: session.scope,
      launchNotePath: session.descriptor.launchNotePath,
      signal: invocation.signal,
    });

    try {
      this.validateInput(registered, call.input);
      let grantForSession = false;
      if (
        registered.tool.effect !== "read" &&
        !this.#grants.has(grantKey(session.descriptor, registered))
      ) {
        const details = registered.tool.describeApproval
          ? await raceWithAbort(
              registered.tool.describeApproval(call.input, context),
              invocation.signal,
            )
          : undefined;
        const decision = await this.approvals.request(
          agentBindingId,
          registered,
          call.input,
          details,
          invocation.signal,
        );
        if (decision === "deny-once") {
          throw new AppToolExecutionError(
            "approval_denied",
            `Permission denied for app tool: ${call.name}`,
          );
        }
        if (decision === "allow-session") {
          grantForSession = true;
        }
      }

      if (
        !this.registry.resolve(
          snapshot.name,
          snapshot.registrationId,
        )
      ) {
        throw unavailableError(call.name);
      }
      if (grantForSession) {
        this.#grants.add(grantKey(session.descriptor, registered));
      }

      const result = await raceWithAbort(
        registered.tool.execute(call.input, context),
        invocation.signal,
      );
      this.validateResult(registered, result);
      return result;
    } catch (error) {
      if (error instanceof AppToolExecutionError) {
        if (error.code === "cancelled" && invocation.timedOut()) {
          throw new AppToolExecutionError(
            "timed_out",
            `App tool timed out: ${call.name}`,
          );
        }
        throw error;
      }
      if (invocation.signal.aborted) {
        throw new AppToolExecutionError(
          invocation.timedOut() ? "timed_out" : "cancelled",
          invocation.timedOut()
            ? `App tool timed out: ${call.name}`
            : `App tool cancelled: ${call.name}`,
        );
      }
      throw new AppToolExecutionError(
        "execution_failed",
        `App tool execution failed: ${call.name}`,
      );
    } finally {
      activeForBinding.delete(invocation.cancel);
      if (activeForBinding.size === 0) {
        this.#activeInvocations.delete(agentBindingId);
      }
      invocation.dispose();
    }
  }

  closeBinding(agentBindingId: string): void {
    this.#sessions.delete(agentBindingId);
    for (const cancel of this.#activeInvocations.get(agentBindingId) ?? []) {
      cancel();
    }
    this.#activeInvocations.delete(agentBindingId);
    this.approvals.closeBinding(agentBindingId);
    for (const key of this.#grants) {
      if (key.includes(`\u0000${agentBindingId}\u0000`)) this.#grants.delete(key);
    }
  }

  expireOwner(ownerPluginId: string): void {
    for (const key of this.#grants) {
      if (key.includes(`\u0000${ownerPluginId}\u0000`)) this.#grants.delete(key);
    }
  }

  close(): void {
    for (const bindingId of this.#sessions.keys()) this.closeBinding(bindingId);
    this.approvals.close();
    this.registry.offref(this.#registryChangeRef);
    this.#validators.clear();
  }

  private validateInput(registered: RegisteredAppTool, input: unknown): void {
    let validate = this.#validators.get(registered.registrationId);
    if (!validate) {
      try {
        validate = this.#ajv.compile(registered.tool.inputSchema);
      } catch {
        throw new AppToolExecutionError(
          "invalid_tool_schema",
          `App tool has an invalid input schema: ${registered.tool.name}`,
        );
      }
      this.#validators.set(registered.registrationId, validate);
    }
    if (!validate(input)) {
      throw new AppToolExecutionError(
        "invalid_arguments",
        `Invalid arguments for app tool: ${registered.tool.name}`,
      );
    }
  }

  private validateResult(
    registered: RegisteredAppTool,
    result: AppToolResult,
  ): void {
    if (!result || !Array.isArray(result.content)) {
      throw invalidResult(registered.tool.name);
    }
    if (result.content.length > MAX_CONTENT_ITEMS) {
      throw invalidResult(registered.tool.name);
    }
    let textBytes = 0;
    for (const item of result.content) {
      if (item.type === "text") {
        if (typeof item.text !== "string") throw invalidResult(registered.tool.name);
        textBytes += byteLength(item.text);
      } else if (item.type === "image") {
        if (
          typeof item.data !== "string" ||
          typeof item.mimeType !== "string" ||
          !item.mimeType.startsWith("image/") ||
          byteLength(item.data) > MAX_IMAGE_DATA_BYTES
        ) {
          throw invalidResult(registered.tool.name);
        }
      } else {
        throw invalidResult(registered.tool.name);
      }
    }
    if (textBytes > MAX_TEXT_BYTES) throw invalidResult(registered.tool.name);
    if (result.structuredContent !== undefined) {
      let encoded: string;
      try {
        encoded = JSON.stringify(result.structuredContent);
      } catch {
        throw invalidResult(registered.tool.name);
      }
      if (byteLength(encoded) > MAX_STRUCTURED_BYTES) {
        throw invalidResult(registered.tool.name);
      }
      if (registered.tool.outputSchema) {
        let validate: ValidateFunction;
        try {
          validate = this.#ajv.compile(registered.tool.outputSchema);
        } catch {
          throw new AppToolExecutionError(
            "invalid_tool_schema",
            `App tool has an invalid output schema: ${registered.tool.name}`,
          );
        }
        if (!validate(result.structuredContent as AppToolJsonValue)) {
          throw invalidResult(registered.tool.name);
        }
      }
    }
  }
}

function isEligible(
  registered: RegisteredAppTool,
  settings: AppToolPolicySettings,
): boolean {
  return isAppToolEnabled(
    { name: registered.tool.name, owner: registered.owner },
    settings,
  );
}

function toDescriptor(registered: RegisteredAppTool): AppToolDescriptor {
  return Object.freeze({
    registrationId: registered.registrationId,
    ownerPluginId: registered.owner.pluginId,
    name: registered.tool.name,
    description: registered.tool.description,
    inputSchema: cloneJson(registered.tool.inputSchema),
    outputSchema: registered.tool.outputSchema
      ? cloneJson(registered.tool.outputSchema)
      : undefined,
    effect: registered.tool.effect,
  });
}

function cloneJson<T>(value: T): T {
  return deepFreezeJson(JSON.parse(JSON.stringify(value)) as T);
}

function deepFreezeJson<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  for (const nested of Object.values(value)) deepFreezeJson(nested);
  return Object.freeze(value);
}

function grantKey(
  session: AppToolSessionDescriptor,
  registered: RegisteredAppTool,
): string {
  return [
    "",
    session.conversationId,
    session.agentBindingId,
    session.scopeDir,
    registered.owner.pluginId,
    registered.tool.name,
    registered.tool.effect,
    "",
  ].join("\u0000");
}

function unavailableError(name: string): AppToolExecutionError {
  return new AppToolExecutionError(
    "tool_unavailable",
    `App tool is unavailable for this binding: ${name}`,
  );
}

function invalidResult(name: string): AppToolExecutionError {
  return new AppToolExecutionError(
    "invalid_result",
    `App tool returned an invalid or oversized result: ${name}`,
  );
}

function cancelledError(): AppToolExecutionError {
  return new AppToolExecutionError("cancelled", "App tool call cancelled.");
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function formatApprovalDiff(
  details: AppToolApprovalDetails | undefined,
): string | undefined {
  if (!details) return undefined;
  const hunks = [
    ...(details.diff
      ? [{ path: details.path, before: details.diff.before, after: details.diff.after }]
      : []),
    ...(details.diffs ?? []),
  ];
  if (hunks.length === 0) return undefined;
  return hunks
    .map((hunk) => {
      const header = hunk.path ? `# ${hunk.path}\n` : "";
      return `${header}--- before\n${hunk.before}\n+++ after\n${hunk.after}`;
    })
    .join("\n\n");
}

function isAppToolApprovalDecision(
  decision: ApprovalOptionKind,
): decision is "allow-once" | "allow-session" | "deny-once" {
  return ["allow-once", "allow-session", "deny-once"].includes(decision);
}

function createInvocationSignal(
  parent: AbortSignal | undefined,
  timeoutMs: number,
): {
  signal: AbortSignal;
  timedOut(): boolean;
  cancel(): void;
  dispose(): void;
} {
  const controller = new AbortController();
  let timeoutReached = false;
  const onParentAbort = () => controller.abort(parent?.reason);
  parent?.addEventListener("abort", onParentAbort, { once: true });
  if (parent?.aborted) controller.abort(parent.reason);
  const timer = setTimeout(() => {
    timeoutReached = true;
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    timedOut: () => timeoutReached,
    cancel: () => controller.abort(),
    dispose: () => {
      clearTimeout(timer);
      parent?.removeEventListener("abort", onParentAbort);
    },
  };
}

function raceWithAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(cancelledError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(cancelledError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}
