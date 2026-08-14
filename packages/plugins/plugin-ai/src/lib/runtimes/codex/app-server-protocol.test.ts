import { describe, expect, it } from "vitest";
import {
  approvalRequestFromServerRequest,
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
        method: "item/toolCall/started",
        params: { item: { id: "1", tool: "read", arguments: { path: "a" } } },
      }),
    ).toEqual({
      type: "tool.start",
      id: "1",
      name: "read",
      input: { path: "a" },
    });
    expect(mapCodexNotification({ method: "turn/completed", params: {} })).toEqual({
      type: "completed",
      result: {},
    });
  });

  it("maps approval requests without leaking RPC types on the public shape", () => {
    const request = approvalRequestFromServerRequest({
      id: "a1",
      kind: "command",
      reason: "Run npm install",
      command: "npm install",
    });
    expect(request).toMatchObject({
      id: "a1",
      kind: "execute",
      title: "Run npm install",
    });
    expect(approvalResponseForOption("allow-always")).toEqual({
      decision: "approve",
      scope: "session",
    });
  });
});
