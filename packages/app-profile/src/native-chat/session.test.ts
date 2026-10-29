import { describe, expect, it, vi } from "vitest";
import type { TurnCommand, TurnValue } from "@lapis-notes/api/native-turns";
import { NativeChatSession } from "./session";
function fixture() {
  const host = {
    allowed: () => true,
    activate: vi.fn(async () => {}),
    call: vi.fn(
      async (command: TurnCommand): Promise<TurnValue> =>
        command.kind === "set_enabled"
          ? { kind: "availability", enabled: command.enabled }
          : { kind: "records", records: [] },
    ),
    readText: vi.fn(async () => ""),
    leave: vi.fn(async (_reason: string) => {}),
  };
  return { host, session: new NativeChatSession(host) };
}
describe("native chat feature lifetime", () => {
  it("does not activate on construction and shares one activation across observers", async () => {
    const f = fixture();
    expect(f.host.activate).not.toHaveBeenCalled();
    await Promise.all([
      f.session.call({ kind: "list" }),
      f.session.call({ kind: "list" }),
    ]);
    expect(f.host.activate).toHaveBeenCalledTimes(1);
    expect(
      f.host.call.mock.calls.filter(([c]) => c.kind === "set_enabled"),
    ).toHaveLength(1);
    await f.session.close("detach");
    expect(f.host.leave).toHaveBeenCalledWith("detach");
  });
  it("closing fences a late activation before it can enable or submit work", async () => {
    const f = fixture();
    let release!: () => void;
    f.host.activate.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const pending = f.session.call({ kind: "list" });
    const refused = expect(pending).rejects.toThrow("closed");
    await f.session.close("disable");
    release();
    await refused;
    expect(f.host.call).not.toHaveBeenCalled();
    await expect(f.session.call({ kind: "list" })).rejects.toThrow("closed");
  });
  it("preserves a failed native drain and allows explicit cleanup retry", async () => {
    const f = fixture();
    f.host.leave.mockRejectedValueOnce(new Error("Cleanup uncertain"));
    await expect(f.session.close("close")).rejects.toThrow("Cleanup uncertain");
    await expect(f.session.call({ kind: "list" })).rejects.toThrow("closed");
    await f.session.close("close");
    expect(f.host.leave).toHaveBeenCalledTimes(2);
  });
  it("retries a failed activation without submitting authored work", async () => {
    const f = fixture();
    f.host.activate.mockRejectedValueOnce(
      new Error("Native service unavailable"),
    );
    await expect(f.session.call({ kind: "list" })).rejects.toThrow(
      "Native service unavailable",
    );
    expect(f.host.call).not.toHaveBeenCalled();
    await f.session.call({ kind: "list" });
    expect(f.host.activate).toHaveBeenCalledTimes(2);
    expect(f.host.call.mock.calls.some(([c]) => c.kind === "submit")).toBe(
      false,
    );
    await f.session.close("detach");
  });
  it("untrusted workspaces cannot activate or read native conversations", async () => {
    const f = fixture();
    f.host.allowed = () => false;
    await expect(f.session.call({ kind: "list" })).rejects.toThrow("trusted");
    await expect(f.session.readText("Note.md")).rejects.toThrow("trusted");
    expect(f.host.activate).not.toHaveBeenCalled();
    expect(f.host.readText).not.toHaveBeenCalled();
  });
});
