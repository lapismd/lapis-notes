import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "main.ts"),
  "utf8",
);

describe("desktop renderer agent channels", () => {
  it("keeps tool cancel and omits retired ACP event listeners", () => {
    expect(source).toContain("desktop_agent_tool_cancel");
    expect(source).toContain("onAgentToolCancel");
    expect(source).not.toContain("desktop_agent_process_message");
    expect(source).not.toContain("desktop_agent_runtime_event");
    expect(source).not.toContain("desktop_agent_tool_call");
    expect(source).not.toContain("onAgentProcessMessage");
    expect(source).not.toContain("onAgentRuntimeEvent");
    expect(source).not.toContain("onAgentToolCall");
  });
});
