import { describe, expect, it } from "vitest";
import { queueFixture } from "./queue-observer.test.fixture";

describe("shared native chat queue observer", () => {
  it("uses direct first admission then captures the busy follow-up without renderer dispatch", async () => {
    const f = queueFixture();
    try {
      await f.read();
      await f.send("First message");
      const id = crypto.randomUUID();
      expect((await f.send(" Authored café 📝 ", id)).status).toBe(
        "acknowledged",
      );
      expect(f.turns.filter((c) => c.kind === "submit")).toHaveLength(1);
      const entry = f.queue().entries[0],
        capture = entry.input.capture as any;
      expect(entry.input.acceptance_id).toBe(id);
      expect(entry.input.target_id).toBe("opaque-target");
      expect(entry.input.target_id).toBe("opaque-target");
      expect(
        new Set([id, entry.request_id, capture.id, capture.user.id]).size,
      ).toBe(4);
      expect(capture.user.id).toMatch(/^queued-user-/);
      expect(capture).toEqual({
        version: 1,
        id: capture.id,
        state: "queued",
        user: {
          schemaVersion: 3,
          id: capture.user.id,
          type: "message",
          role: "user",
          text: "Authored café 📝",
          recipients: [f.selection.recipient],
          createdAt: expect.any(String),
          provenance: { originClass: "owner", sourceKind: "user-message" },
        },
        selection: {
          targets: [{ ...f.selection.target, executionMode: "read-only" }],
          runtime: "acp",
          thinking: "default",
          attachments: [],
        },
      });
      const snapshot = await f.read();
      expect(snapshot.queued[0]).toMatchObject({
        id,
        submission: { id: capture.user.id, text: "Authored café 📝" },
      });
      expect(snapshot.capabilities).toContain("send");
      expect(snapshot.queueState).toMatchObject({
        paused: false,
        running: false,
      });
      f.selection.recipient.label = "Changed";
      f.target.default_mode = "new mode";
      expect(
        (f.queue().entries[0].input.capture as any).user.recipients[0].label,
      ).toBe("Writer");
      expect(
        (f.queue().entries[0].input.capture as any).selection.targets[0]
          .executionMode,
      ).toBe("read-only");
    } finally {
      f.port.close();
    }
  });
  it("renders retained terminal queue receipts in the existing conversation", async () => {
    const f = queueFixture();
    try {
      await f.read();
      await f.send("First");
      await f.send("Cancelled queued text");
      const entry = f.queue().entries[0],
        capture = entry.input.capture as any;
      entry.phase = "cancelled";
      const receipt = {
        schemaVersion: 3,
        id: `queue:${capture.id}:cancelled`,
        type: "queue.outcome",
        parentId: capture.user.id,
        createdAt: new Date().toISOString(),
        queued: capture,
        outcome: "cancelled",
      };
      const read = f.host.readText;
      f.host.readText = async (path) =>
        (await read(path)) +
        (path.endsWith("transcript.jsonl")
          ? "\n" + JSON.stringify(receipt)
          : "");
      const snapshot = await f.read();
      expect(snapshot.queued).toHaveLength(0);
      const item = snapshot.sessions
        .find((s) => s.id === f.port.selected)!
        .items.find((i) => i.id === receipt.id);
      expect(item).toMatchObject({
        kind: "context",
        label: "Queue status",
        notice: "warning",
      });
      expect(item?.blocks[0].text).toContain("Cancelled queued text");
      expect(item?.blocks[0].text).toContain("cancelled");
    } finally {
      f.port.close();
    }
  });
  it("recovers lost acceptance by exact retained input even when JSON property ordering changes", async () => {
    const f = queueFixture();
    try {
      await f.read();
      await f.send("First");
      f.lose();
      const id = crypto.randomUUID();
      expect((await f.send("Follow-up", id)).status).toBe("unknown");
      const entry = f.queue().entries[0];
      entry.input = Object.fromEntries(
        Object.entries(entry.input).reverse(),
      ) as typeof entry.input;
      expect((await f.port.status(id)).status).toBe("acknowledged");
      expect(f.queues.filter((c) => c.kind === "accept")).toHaveLength(1);
      expect(f.turns.filter((c) => c.kind === "submit")).toHaveLength(1);
    } finally {
      f.port.close();
    }
  });
  it("recovers accepted delivery when only its following screen refresh fails", async () => {
    const f = queueFixture();
    try {
      await f.read();
      await f.send("First");
      const id = crypto.randomUUID();
      f.failRefresh();
      expect(
        (await f.send("Accepted before failed screen refresh", id)).status,
      ).toBe("unknown");
      expect((await f.port.status(id)).status).toBe("acknowledged");
      expect(f.queues.filter((c) => c.kind === "accept")).toHaveLength(1);
    } finally {
      f.port.close();
    }
  });
  it("routes Stop, cancellation and explicit resume through exact native queue identities", async () => {
    const f = queueFixture();
    try {
      await f.read();
      await f.send("First");
      const id = crypto.randomUUID();
      await f.send("Follow-up", id);
      expect((await f.read()).capabilities).toEqual(
        expect.arrayContaining(["cancel_queued", "pause_queue"]),
      );
      for (const [kind, target] of [
        ["stop", undefined],
        ["cancel_queued", id],
        ["resume_queue", undefined],
      ] as const) {
        const outcome = await f.port.act({
          id: crypto.randomUUID(),
          kind,
          target,
          session: f.port.selected,
        });
        expect(outcome.status).toBe("acknowledged");
      }
      expect(f.queues.filter((c) => c.kind !== "read").slice(1)).toEqual([
        { kind: "stop", conversation_id: f.port.selected },
        { kind: "cancel", conversation_id: f.port.selected, acceptance_id: id },
        {
          kind: "resume",
          conversation_id: f.port.selected,
          after_request_id: f.records[0].input.request_id,
        },
      ]);
      expect(f.turns.some((c) => c.kind === "cancel")).toBe(false);
    } finally {
      f.port.close();
    }
  });
  it("retains R2 behavior with absent declared selection and refuses rich/command captures before acceptance", async () => {
    const f = queueFixture();
    try {
      await f.read();
      await f.send("First");
      f.undeclare();
      expect((await f.read()).capabilities).not.toContain("send");
      expect((await f.send("Busy follow-up")).status).toBe("refused");
      f.records[0].phase = "completed";
      await f.read();
      expect((await f.send("Idle R2 follow-up")).status).toBe("acknowledged");
      expect(f.queues.some((c) => c.kind === "accept")).toBe(false);
    } finally {
      f.port.close();
    }
    const g = queueFixture();
    try {
      await g.read();
      await g.send("First");
      expect((await g.send("/application command")).status).toBe("refused");
      for (const patch of [
        { attachments: ["Note.md"] },
        { recipients: ["opaque-target", "other"] },
        { submission: { id: "mismatch", text: "Comment", comments: [{}] } },
      ]) {
        const id = crypto.randomUUID();
        expect(
          (
            await g.port.act({
              id,
              kind: "send",
              submission: { id, text: "Rich", comments: [] },
              ...patch,
            } as never)
          ).status,
        ).toBe("refused");
      }
      expect(g.queues.some((c) => c.kind === "accept")).toBe(false);
    } finally {
      g.port.close();
    }
  });
});
