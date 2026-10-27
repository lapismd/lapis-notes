import { describe, expect, it, vi } from "vitest";
import { NativeChatSession, type NativeChatHost } from "./session";
function fixture() {
  let allowed = true;
  const queue = {
    selection: async () => undefined,
    call: vi.fn(async () => ({ kind: "queue" as const, queue: null })),
  };
  const host: NativeChatHost = {
    allowed: () => allowed,
    activate: vi.fn(async () => {}),
    call: vi.fn(async () => ({ kind: "availability" as const, enabled: true })),
    leave: vi.fn(async () => {}),
    readText: async () => "",
    queue,
  };
  return {
    host,
    queue,
    session: new NativeChatSession(host),
    revoke: () => {
      allowed = false;
    },
  };
}
describe("native chat admitted queue session", () => {
  it("shares activation and trust admission without owning queue work", async () => {
    const f = fixture();
    expect(f.session.hasQueue).toBe(true);
    await f.session.queue({ kind: "read", conversation_id: "one" });
    await f.session.queue({ kind: "read", conversation_id: "two" });
    expect(f.host.activate).toHaveBeenCalledTimes(1);
    expect(f.host.call).toHaveBeenCalledTimes(1);
    expect(f.queue.call).toHaveBeenCalledTimes(2);
    f.revoke();
    await expect(
      f.session.queue({ kind: "stop", conversation_id: "one" }),
    ).rejects.toThrow("trusted");
    expect(f.queue.call).toHaveBeenCalledTimes(2);
  });
  it("fences view calls after detach while native queue lifetime stays host-owned", async () => {
    const f = fixture();
    await f.session.queue({ kind: "read", conversation_id: "one" });
    await f.session.close("detach");
    await expect(
      f.session.queue({ kind: "stop", conversation_id: "one" }),
    ).rejects.toThrow("closed");
    expect(f.queue.call).toHaveBeenCalledTimes(1);
    expect(f.host.leave).toHaveBeenCalledWith("detach");
  });
  it("preserves an uncertain mutation and never retries it", async () => {
    const f = fixture();
    f.queue.call.mockRejectedValueOnce(new Error("lost reply"));
    await expect(
      f.session.queue({ kind: "stop", conversation_id: "one" }),
    ).rejects.toThrow("lost reply");
    expect(f.queue.call).toHaveBeenCalledTimes(1);
  });
});
