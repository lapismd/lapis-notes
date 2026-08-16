import { describe, expect, it } from "vitest";
import {
  approvalRequestFromServerRequest,
  approvalReplyForServerRequest,
  approvalResponseForOption,
  mapCodexNotification,
} from "./app-server-protocol";

describe("Codex app-server protocol mapper", () => {
  it("maps deltas, tools, completion, and errors", () => {
    expect(
      mapCodexNotification({
        method: "item/agentMessage/delta",
        params: { text: "hi" },
      }),
    ).toEqual({ type: "text", text: "hi" });
    expect(
      mapCodexNotification({
        method: "item/started",
        params: {
          item: {
            id: "1",
            type: "mcpToolCall",
            tool: "read",
            arguments: { path: "a" },
          },
        },
      }),
    ).toEqual({
      type: "tool.start",
      id: "1",
      name: "read",
      input: { path: "a" },
    });
    expect(
      mapCodexNotification({ method: "turn/completed", params: {} }),
    ).toEqual({
      type: "completed",
      result: {},
    });
  });

  it("maps approval requests without leaking RPC types on the public shape", () => {
    const message = {
      id: "a1",
      method: "item/commandExecution/requestApproval",
      params: {
        reason: "Run npm install",
        command: "npm install",
      },
    };
    const request = approvalRequestFromServerRequest(message);
    expect(request).toMatchObject({
      id: "a1",
      kind: "execute",
      title: "Run npm install",
    });
    expect(request?.metadata).toBeUndefined();
    expect(approvalResponseForOption("allow-always")).toEqual({
      decision: "acceptForSession",
    });
    expect(approvalReplyForServerRequest(message, "deny-once")).toEqual({
      result: { decision: "decline" },
    });
  });

  it("maps current reasoning and command completion notifications", () => {
    expect(
      mapCodexNotification({
        method: "item/reasoning/summaryTextDelta",
        params: { delta: { text: "Summary" } },
      }),
    ).toEqual({ type: "thinking", text: "Summary", kind: "summary" });
    expect(
      mapCodexNotification({
        method: "item/completed",
        params: {
          item: {
            id: "cmd-1",
            type: "commandExecution",
            command: "pwd",
            aggregatedOutput: "/vault",
          },
        },
      }),
    ).toEqual({
      type: "tool.end",
      id: "cmd-1",
      name: "command",
      server: undefined,
      output: "/vault",
      error: undefined,
    });
  });
});
