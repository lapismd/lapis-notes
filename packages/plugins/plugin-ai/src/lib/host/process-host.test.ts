import { describe, expect, it } from "vitest";
import { UnavailableAgentProcessHost } from "./process-host";

describe("agent process host", () => {
  it("rejects spawn when the desktop agent-runtime capability is missing", async () => {
    const host = new UnavailableAgentProcessHost();
    expect(host.available).toBe(false);
    await expect(host.spawn({ command: "acpx" })).rejects.toThrow(
      /desktop agent-runtime capability/,
    );
  });
});
