import {
  AppToolRegistry,
  type AppTool,
  type AppToolExecutionContext,
  type AppToolOwner,
  type AppToolResult,
} from "@lapis-notes/api/agent-tools";
import { describe, expect, it, vi } from "vitest";
import {
  AppToolExecutionError,
  AppToolHost,
  type AppToolPolicySettings,
} from "./app-tool-host";

const bundledOwner: AppToolOwner = {
  pluginId: "markdown",
  source: "core",
  provenance: "bundled",
};
const communityOwner: AppToolOwner = {
  pluginId: "community-tools",
  source: "community",
  provenance: "community",
};

function createTool(
  name: string,
  options: Partial<AppTool<Record<string, unknown>>> = {},
): AppTool<Record<string, unknown>> {
  return {
    name,
    description: `Execute ${name}`,
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
    effect: "read",
    execute: vi.fn(
      async (
        _input: Record<string, unknown>,
        context: AppToolExecutionContext,
      ): Promise<AppToolResult> => ({
        content: [{ type: "text", text: context.scope.directory }],
      }),
    ),
    ...options,
  };
}

function createFixture(timeoutMs = 1_000) {
  const registry = new AppToolRegistry();
  const settings: AppToolPolicySettings = {
    appToolsEnabled: true,
    disabledAppToolNames: [],
    enabledAppToolNames: [],
    enabledCommunityToolPluginIds: [],
  };
  const host = new AppToolHost(registry, () => settings, timeoutMs);
  return { host, registry, settings };
}

function createSession(
  host: AppToolHost,
  bindingId = "binding-1",
  supports = true,
) {
  return host.createSession({
    conversationId: "conversation-1",
    agentBindingId: bindingId,
    scopeDir: "Projects/Alpha",
    launchNotePath: "Projects/Alpha/readme.md",
    runtimeSupportsAppTools: supports,
  });
}

function invoke(
  host: AppToolHost,
  name: string,
  bindingId = "binding-1",
  input: unknown = { path: "Projects/Alpha/readme.md" },
  signal?: AbortSignal,
) {
  return host.invoke(
    bindingId,
    { runId: "run-1", toolCallId: "call-1", name, input },
    signal,
  );
}

describe("AppToolHost snapshots", () => {
  it("includes bundled tools and gates community tools and incapable runtimes", () => {
    const { host, registry, settings } = createFixture();
    registry.register(bundledOwner, createTool("notes_read"));
    registry.register(communityOwner, createTool("community_read"));

    expect(createSession(host).tools.map((tool) => tool.name)).toEqual([
      "notes_read",
    ]);
    settings.enabledAppToolNames = ["community_read"];
    expect(
      createSession(host, "binding-2").tools.map((tool) => tool.name),
    ).toEqual(["community_read", "notes_read"]);
    expect(createSession(host, "binding-3", false).tools).toEqual([]);
  });

  it("applies bundled opt-out and community opt-in without rewriting an active snapshot", () => {
    const { host, registry, settings } = createFixture();
    registry.register(bundledOwner, createTool("notes_read"));
    registry.register(communityOwner, createTool("community_read"));
    const session = createSession(host);

    settings.disabledAppToolNames = ["notes_read"];
    settings.enabledAppToolNames = ["community_read"];
    expect(session.tools.map((tool) => tool.name)).toEqual(["notes_read"]);
    expect(
      createSession(host, "binding-2").tools.map((tool) => tool.name),
    ).toEqual(["community_read"]);
  });

  it("keeps registrations frozen and fails closed after unload or replacement", async () => {
    const { host, registry } = createFixture();
    const first = registry.register(bundledOwner, createTool("notes_read"));
    const session = createSession(host);

    first.dispose();
    registry.register(bundledOwner, createTool("notes_read"));

    await expect(invoke(host, "notes_read")).rejects.toMatchObject({
      code: "tool_unavailable",
    });
    expect(session.tools).toHaveLength(1);
    expect(createSession(host, "binding-2").tools[0]?.registrationId).not.toBe(
      session.tools[0]?.registrationId,
    );
  });
});

describe("AppToolHost execution", () => {
  it("validates inputs and supplies immutable trusted invocation context", async () => {
    const { host, registry } = createFixture();
    const execute = vi.fn(async (_input, context) => ({
      content: [
        {
          type: "text" as const,
          text: [
            context.conversationId,
            context.agentBindingId,
            context.scope.resolve("Projects/Alpha/readme.md"),
          ].join(":"),
        },
      ],
    }));
    registry.register(
      bundledOwner,
      createTool("notes_read", { execute }),
    );
    createSession(host);

    await expect(invoke(host, "notes_read", "binding-1", {})).rejects.toMatchObject({
      code: "invalid_arguments",
    });
    await expect(invoke(host, "notes_read")).resolves.toEqual({
      content: [
        {
          type: "text",
          text: "conversation-1:binding-1:Projects/Alpha/readme.md",
        },
      ],
    });
    const context = execute.mock.calls[0]?.[1];
    expect(Object.isFrozen(context)).toBe(true);
    expect(context?.scope.contains("Elsewhere/readme.md")).toBe(false);
  });

  it("bounds text and structured results", async () => {
    const { host, registry } = createFixture();
    registry.register(
      bundledOwner,
      createTool("notes_read", {
        execute: async () => ({
          content: [{ type: "text", text: "x".repeat(64 * 1024 + 1) }],
        }),
      }),
    );
    createSession(host);

    await expect(invoke(host, "notes_read")).rejects.toMatchObject({
      code: "invalid_result",
    });
  });

  it("normalizes callback failures without exposing their message", async () => {
    const { host, registry } = createFixture();
    registry.register(
      bundledOwner,
      createTool("notes_read", {
        execute: async () => {
          throw new Error("secret filesystem detail");
        },
      }),
    );
    createSession(host);

    const error = await invoke(host, "notes_read").catch((reason) => reason);
    expect(error).toBeInstanceOf(AppToolExecutionError);
    expect(error).toMatchObject({ code: "execution_failed" });
    expect(error.message).not.toContain("secret filesystem detail");
  });

  it("propagates cancellation and enforces a timeout", async () => {
    const { host, registry } = createFixture(10);
    registry.register(
      bundledOwner,
      createTool("notes_read", {
        execute: async () => new Promise(() => {}),
      }),
    );
    createSession(host);

    await expect(invoke(host, "notes_read")).rejects.toMatchObject({
      code: "timed_out",
    });

    const second = createFixture();
    second.registry.register(
      bundledOwner,
      createTool("notes_read", { execute: async () => new Promise(() => {}) }),
    );
    createSession(second.host);
    const controller = new AbortController();
    const pending = invoke(
      second.host,
      "notes_read",
      "binding-1",
      undefined,
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "cancelled" });
  });

  it("cancels in-flight execution when its binding closes", async () => {
    const { host, registry } = createFixture();
    registry.register(
      bundledOwner,
      createTool("notes_read", { execute: async () => new Promise(() => {}) }),
    );
    createSession(host);

    const pending = invoke(host, "notes_read");
    host.closeBinding("binding-1");

    await expect(pending).rejects.toMatchObject({ code: "cancelled" });
  });
});

describe("AppToolHost approvals", () => {
  it("grants one binding session and expires the grant on close", async () => {
    const { host, registry } = createFixture();
    const execute = vi.fn(async () => ({
      content: [{ type: "text" as const, text: "patched" }],
    }));
    registry.register(
      bundledOwner,
      createTool("notes_patch", {
        effect: "write",
        describeApproval: async () => ({
          title: "Patch note",
          path: "Projects/Alpha/readme.md",
          diff: { before: "old", after: "new" },
        }),
        execute,
      }),
    );
    createSession(host);
    const approvals: string[] = [];
    host.approvals.subscribe((request) => {
      approvals.push(request.id);
      expect(request).toMatchObject({
        origin: "app-tool",
        details: { path: "Projects/Alpha/readme.md" },
      });
      host.approvals.respond(request.id, "allow-session");
    });

    await invoke(host, "notes_patch");
    await invoke(host, "notes_patch");
    expect(approvals).toHaveLength(1);
    expect(execute).toHaveBeenCalledTimes(2);

    host.closeBinding("binding-1");
    createSession(host);
    await invoke(host, "notes_patch");
    expect(approvals).toHaveLength(2);
  });

  it("concatenates multi-file approval hunks", async () => {
    const { host, registry } = createFixture();
    registry.register(
      bundledOwner,
      createTool("apply_patch", {
        effect: "write",
        describeApproval: async () => ({
          title: "Patch 2 files",
          paths: ["Notes/a.md", "Notes/b.md"],
          diffs: [
            { path: "Notes/a.md", before: "old-a", after: "new-a" },
            { path: "Notes/b.md", before: "old-b", after: "new-b" },
          ],
        }),
        execute: async () => ({
          content: [{ type: "text" as const, text: "patched" }],
        }),
      }),
    );
    createSession(host);
    host.approvals.subscribe((request) => {
      expect(request.details).toMatchObject({
        path: "Notes/a.md, Notes/b.md",
        diff: "# Notes/a.md\n--- before\nold-a\n+++ after\nnew-a\n\n# Notes/b.md\n--- before\nold-b\n+++ after\nnew-b",
      });
      host.approvals.respond(request.id, "allow-once");
    });
    await invoke(host, "apply_patch");
  });

  it("denies without executing and cancels pending approval on close", async () => {
    const { host, registry } = createFixture();
    const execute = vi.fn(async () => ({ content: [] }));
    registry.register(
      bundledOwner,
      createTool("notes_patch", { effect: "write", execute }),
    );
    createSession(host);
    host.approvals.subscribe((request) => {
      host.approvals.respond(request.id, "deny-once");
    });

    await expect(invoke(host, "notes_patch")).rejects.toMatchObject({
      code: "approval_denied",
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it("does not invoke a registration unloaded during approval", async () => {
    const { host, registry } = createFixture();
    const execute = vi.fn(async () => ({ content: [] }));
    const registration = registry.register(
      bundledOwner,
      createTool("notes_patch", { effect: "write", execute }),
    );
    createSession(host);
    let approvalId = "";
    host.approvals.subscribe((request) => {
      approvalId = request.id;
    });

    const pending = invoke(host, "notes_patch");
    await vi.waitFor(() => expect(approvalId).not.toBe(""));
    registration.dispose();
    host.approvals.respond(approvalId, "allow-once");

    await expect(pending).rejects.toMatchObject({ code: "tool_unavailable" });
    expect(execute).not.toHaveBeenCalled();
  });
});
