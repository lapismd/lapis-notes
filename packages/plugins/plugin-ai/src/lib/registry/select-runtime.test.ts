import { describe, expect, it } from "vitest";
import { FakeAgentRuntime } from "../runtimes/fake/fake-runtime";
import { AgentRuntimeNotFoundError, createAgentRuntimeRegistry } from "./runtime-registry";
import { selectAgentRuntime } from "./select-runtime";

describe("selectAgentRuntime", () => {
  it("returns Fake when settings pin fake", async () => {
    const fake = new FakeAgentRuntime();
    const selected = await selectAgentRuntime({
      registry: createAgentRuntimeRegistry([fake]),
      settings: { defaultRuntime: "fake", acpAgent: "codex" },
      request: { prompt: "hi" },
      fake,
    });
    expect(selected).toBe(fake);
  });

  it("throws when a pinned live runtime rejects supports()", async () => {
    const fake = new FakeAgentRuntime();
    const acp = {
      id: "acp",
      capabilities: fake.capabilities.bind(fake),
      supports: async () => false,
      start: fake.start.bind(fake),
    };
    await expect(
      selectAgentRuntime({
        registry: createAgentRuntimeRegistry([fake, acp]),
        settings: { defaultRuntime: "acp", acpAgent: "codex" },
        request: { prompt: "hi" },
        fake,
      }),
    ).rejects.toBeInstanceOf(AgentRuntimeNotFoundError);
  });

  it("throws when a pinned live runtime is missing", async () => {
    const fake = new FakeAgentRuntime();
    await expect(
      selectAgentRuntime({
        registry: createAgentRuntimeRegistry([fake]),
        settings: { defaultRuntime: "acp", acpAgent: "codex" },
        request: { prompt: "hi" },
        fake,
      }),
    ).rejects.toBeInstanceOf(AgentRuntimeNotFoundError);
  });

  it("stamps the selected ACP agent on the request used for supports()", async () => {
    const fake = new FakeAgentRuntime();
    const seen: Array<{ agent?: string }> = [];
    const acp = {
      id: "acp",
      capabilities: fake.capabilities.bind(fake),
      supports: async (request: { agent?: string }) => {
        seen.push(request);
        return true;
      },
      start: fake.start.bind(fake),
    };
    await selectAgentRuntime({
      registry: createAgentRuntimeRegistry([fake, acp]),
      settings: { defaultRuntime: "acp", acpAgent: "cursor" },
      request: { prompt: "hi" },
      fake,
    });
    expect(seen[0]).toMatchObject({ agent: "cursor" });
  });

  it("uses Fake for auto selection when no live runtime supports the request", async () => {
    const fake = new FakeAgentRuntime();
    const selected = await selectAgentRuntime({
      registry: createAgentRuntimeRegistry([fake]),
      settings: { defaultRuntime: "auto", acpAgent: "codex" },
      request: { prompt: "hi" },
      fake,
    });
    expect(selected.id).toBe("fake");
  });
});
