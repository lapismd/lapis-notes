import { describe, expect, it, vi } from "vitest";
import type { ParticipantValue } from "@lapis-notes/api/native-turns";
import { participantFixture } from "./participant-observer.test.fixture";

describe("native participant feature lifetime", () => {
  it("shares activation and refuses participant calls after trust revocation", async () => {
    const f = participantFixture();
    try {
      await Promise.all([
        f.session.participant({ kind: "profiles" }),
        f.session.call({ kind: "list" }),
      ]);
      expect(f.host.activate).toHaveBeenCalledTimes(1);
      const before = f.calls.length;
      f.host.allowed = () => false;
      await expect(f.session.participant({ kind: "profiles" })).rejects.toThrow(
        "trusted",
      );
      expect(f.calls).toHaveLength(before);
    } finally {
      f.port.close();
      await f.session.close("detach");
    }
  });
  it("fences a late participant reply after passive detach without cancelling native work", async () => {
    const f = participantFixture();
    await f.session.call({ kind: "list" });
    let release!: (value: ParticipantValue) => void;
    vi.spyOn(f.host.participants, "call").mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const pending = f.session.participant({ kind: "profiles" });
    const rejected = expect(pending).rejects.toThrow("closed");
    await Promise.resolve();
    await f.session.close("detach");
    release({ kind: "profiles", profiles: [] });
    await rejected;
    expect(f.host.leave).toHaveBeenCalledWith("detach");
    expect(f.calls.some((c) => c.kind === "stop" || c.kind === "cancel")).toBe(
      false,
    );
    expect(f.turns.some((c) => c.kind === "cancel")).toBe(false);
    f.port.close();
  });
});
