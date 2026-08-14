import { describe, expect, it } from "vitest";
import { FakeAgentRuntime } from "../runtimes/fake/fake-runtime";
import { UnavailableAgentProcessHost } from "../host/process-host";
import { AcpAgentRuntime, type AcpRuntimeBackend } from "../runtimes/acp/acp-runtime";
import { CodexNativeRuntime } from "../runtimes/codex/codex-runtime";
import {
  AgentRuntimeNotFoundError,
  createAgentRuntimeRegistry,
} from "./runtime-registry";

const availableAcpBackend: AcpRuntimeBackend = {
  async available() {
    return true;
  },
  async start() {
    throw new Error("unused");
  },
};

describe("runtime registry", () => {
  it("prefers ACP-capable runtimes over Fake when both support the request", async () => {
    const registry = createAgentRuntimeRegistry([
      new FakeAgentRuntime(),
      new AcpAgentRuntime(availableAcpBackend),
    ]);
    const selected = await registry.select({ prompt: "hello" });
    expect(selected.id).toBe("acp");
  });

  it("does not select native Codex when the process host is unavailable", async () => {
    const registry = createAgentRuntimeRegistry([
      new CodexNativeRuntime(new UnavailableAgentProcessHost()),
    ]);
    await expect(registry.select({ prompt: "hello" })).rejects.toBeInstanceOf(
      AgentRuntimeNotFoundError,
    );
  });
});
