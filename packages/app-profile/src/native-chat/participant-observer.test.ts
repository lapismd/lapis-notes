import { describe, expect, it } from "vitest";
import { participantFixture } from "./participant-observer.test.fixture";

describe("declared native participant observation", () => {
  it("keeps opaque UI action IDs separate from canonical native acceptance UUIDs", async () => {
    const f = participantFixture();
    const compact = crypto.randomUUID().replaceAll("-", "");
    const action = f.action();
    action.id = compact;
    action.submission.id = compact;
    try {
      await f.port.read(new AbortController().signal);
      expect((await f.port.act(action)).status).toBe("acknowledged");
      const accepted = f.calls.find((c) => c.kind === "accept");
      if (accepted?.kind !== "accept") throw Error("Missing native acceptance");
      expect(accepted.input.acceptance_id).toMatch(
        /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/u,
      );
      expect(accepted.input.acceptance_id).not.toBe(compact);
      expect((await f.port.status(compact)).status).toBe("acknowledged");
      expect(f.calls).toContainEqual({
        kind: "read",
        acceptance_id: accepted.input.acceptance_id,
      });
    } finally {
      f.port.close();
    }
  });
  it("projects distinct logical profiles instead of inferring recipients from runtime target labels", async () => {
    const f = participantFixture();
    try {
      const snapshot = await f.port.read(new AbortController().signal);
      expect(snapshot.agents.map((a) => a.id)).toEqual(["writer", "reviewer"]);
      expect(snapshot.agents.map((a) => a.name)).toEqual([
        "Writer",
        "Reviewer",
      ]);
      expect(snapshot.agents.every((a) => a.id !== f.runtime)).toBe(true);
    } finally {
      f.port.close();
    }
  });
  it("captures one explicit authored parent for several logical roles on one native runtime", async () => {
    const f = participantFixture();
    try {
      await f.port.read(new AbortController().signal);
      const action = f.action();
      const result = await f.port.act(action);
      expect(result.status).toBe("acknowledged");
      const accepted = f.calls.filter((c) => c.kind === "accept");
      expect(accepted).toHaveLength(1);
      expect(f.turns.filter((c) => c.kind === "submit")).toHaveLength(0);
      if (accepted[0].kind !== "accept")
        throw Error("Missing native acceptance");
      expect(accepted[0].input.profiles).toEqual(f.profiles);
      expect(accepted[0].input.turns.map((t) => t.target_id)).toEqual([
        f.runtime,
        f.runtime,
      ]);
      expect(
        (accepted[0].input.user as any).recipients.map((r: any) => r.id),
      ).toEqual(["writer", "reviewer"]);
    } finally {
      f.port.close();
    }
  });
  it("keeps a running sibling busy after the later native head completes", async () => {
    const f = participantFixture();
    f.seed();
    const port = f.observer(true);
    try {
      const snapshot = await port.read(new AbortController().signal);
      expect(snapshot.busy).toBe(true);
      expect(f.calls.some((c) => c.kind === "for_turn")).toBe(true);
      expect(snapshot.capabilities).not.toContain("send");
      expect(snapshot.capabilities).toContain("stop");
    } finally {
      port.close();
      f.port.close();
    }
  });
  it("preserves metadata-absent R2 idle single-target behavior", async () => {
    const f = participantFixture();
    f.declared = false;
    try {
      const snapshot = await f.port.read(new AbortController().signal);
      expect(snapshot.agents.map((a) => a.id)).toEqual([f.runtime]);
      expect((await f.port.act(f.action([f.runtime]))).status).toBe(
        "acknowledged",
      );
      expect(f.turns.filter((c) => c.kind === "submit")).toHaveLength(1);
      expect(f.calls.filter((c) => c.kind === "accept")).toHaveLength(0);
    } finally {
      f.port.close();
    }
  });
  it("observes a lost acceptance by its original identity and never resubmits it", async () => {
    const f = participantFixture();
    f.lose = true;
    try {
      await f.port.read(new AbortController().signal);
      const action = f.action();
      expect((await f.port.act(action)).status).toBe("unknown");
      expect(f.calls.filter((c) => c.kind === "accept")).toHaveLength(1);
      const nativeAcceptance = f.calls.find((c) => c.kind === "accept");
      if (nativeAcceptance?.kind !== "accept")
        throw Error("Missing native acceptance");
      f.declared = false;
      expect((await f.port.act(f.action([f.runtime]))).status).toBe("refused");
      expect(f.turns.some((c) => c.kind === "submit")).toBe(false);
      f.declared = true;
      expect((await f.port.status(action.id)).status).toBe("acknowledged");
      expect((await f.port.act(action)).status).toBe("acknowledged");
      expect(f.calls.filter((c) => c.kind === "accept")).toHaveLength(1);
      expect(
        f.calls.some(
          (c) =>
            c.kind === "read" &&
            c.acceptance_id === nativeAcceptance.input.acceptance_id,
        ),
      ).toBe(true);
      const changed = {
        ...action,
        submission: { ...action.submission, text: "Reused identity" },
      };
      expect((await f.port.act(changed)).status).toBe("refused");
      expect(f.turns.some((c) => c.kind === "submit")).toBe(false);
    } finally {
      f.port.close();
    }
  });
  it("retains independent labels and uses acceptance-wide Stop after passive detach", async () => {
    const f = participantFixture();
    f.seed();
    f.port.close();
    f.profiles[0].selection.recipient.label = "Renamed current Writer";
    const port = f.observer(true);
    try {
      const snapshot = await port.read(new AbortController().signal);
      const saved = snapshot.sessions.find((s) => s.id === f.conversation)!;
      expect(
        saved.items.filter((i) => i.role === "assistant").map((i) => i.label),
      ).toEqual(["Writer", "Reviewer"]);
      expect(saved.items.filter((i) => i.role === "user")).toHaveLength(1);
      expect(snapshot.agents[0].name).toBe("Renamed current Writer");
      expect(
        (await port.act({ id: crypto.randomUUID(), kind: "stop" })).status,
      ).toBe("acknowledged");
      expect(f.calls.filter((c) => c.kind === "stop")).toEqual([
        { kind: "stop", acceptance_id: f.message!.acceptance_id },
      ]);
      expect(f.turns.some((c) => c.kind === "cancel")).toBe(false);
      expect(f.host.leave).not.toHaveBeenCalled();
    } finally {
      port.close();
    }
  });
  it("projects cold unknown and not-sent siblings without stale running markers or writes", async () => {
    const f = participantFixture();
    f.seed();
    f.message!.recovered = true;
    f.message!.deliveries[0].state = "unknown";
    f.message!.deliveries[1].state = "not_sent";
    f.message!.deliveries[1].outcome_published = false;
    f.records[1].output = null;
    for (const record of f.records) record.phase = "unknown";
    const port = f.observer(true);
    try {
      const snapshot = await port.read(new AbortController().signal);
      expect(snapshot.busy).toBe(false);
      expect(snapshot.capabilities).not.toContain("stop");
      const text = JSON.stringify(
        snapshot.sessions.find((s) => s.id === f.conversation)!.items,
      );
      expect(text).toContain(
        "Outcome uncertain; it will not be replayed automatically",
      );
      expect(text).toContain("Not sent; no automatic retry");
      expect(text).not.toContain("Running.");
      expect(
        f.calls.some((c) => ["accept", "stop", "cancel"].includes(c.kind)),
      ).toBe(false);
      expect(f.turns.some((c) => ["submit", "cancel"].includes(c.kind))).toBe(
        false,
      );
    } finally {
      port.close();
      f.port.close();
    }
  });
  it("refuses rich captures and busy group sends without a second queue or single-turn fallback", async () => {
    const f = participantFixture();
    try {
      await f.port.read(new AbortController().signal);
      const rich = f.action();
      expect(
        (await f.port.act({ ...rich, attachments: ["Notes/private.md"] }))
          .status,
      ).toBe("refused");
      expect(f.calls.some((c) => c.kind === "accept")).toBe(false);
      f.seed();
      await f.port.read(new AbortController().signal);
      expect((await f.port.act(f.action())).status).toBe("refused");
      expect(f.calls.some((c) => c.kind === "accept")).toBe(false);
      expect(f.turns.some((c) => c.kind === "submit")).toBe(false);
    } finally {
      f.port.close();
    }
  });
});
