import { describe, expect, it, vi } from "vitest";
import type {
  TurnCommand,
  TurnInput,
  TurnRecord,
  TurnValue,
} from "@lapis-notes/api/native-turns";
import { NativeChatSession } from "./session";
import { NativeChatObserver } from "./observer";

function fixture() {
  const conversation = crypto.randomUUID();
  const records: TurnRecord[] = [];
  const calls: TurnCommand[] = [];
  const leaves: string[] = [];
  let loseReply = false;
  const host = {
    allowed: () => true,
    activate: vi.fn(async () => {}),
    leave: vi.fn(async (reason: string) => {
      leaves.push(reason);
    }),
    async call(command: TurnCommand): Promise<TurnValue> {
      calls.push(structuredClone(command));
      switch (command.kind) {
        case "targets":
          return {
            kind: "targets",
            targets: [{ id: "codex", label: "Codex" }],
          };
        case "set_enabled":
          return { kind: "availability", enabled: command.enabled };
        case "list":
          return {
            kind: "records",
            records: records.map((r) => ({
              request_id: r.input.request_id,
              conversation_id: r.conversation_id,
              target_id: r.input.target_id,
              scope_dir: r.input.scope_dir,
              phase: r.phase,
              accepted_at_ms: r.accepted_at_ms,
              updated_at_ms: r.updated_at_ms,
              failure_code: r.failure_code,
            })),
          };
        case "read":
          return {
            kind: "record",
            record:
              records.find((r) => r.input.request_id === command.request_id) ??
              null,
          };
        case "cancel":
          return {
            kind: "cancel_requested",
            accepted: records.some(
              (r) => r.input.request_id === command.request_id,
            ),
          };
        case "submit": {
          const record: TurnRecord = {
            schema_version: 1,
            vault_id: crypto.randomUUID(),
            conversation_id: conversation,
            input: command.input,
            phase: "accepted",
            accepted_at_ms: 1000 + records.length,
            updated_at_ms: 1000 + records.length,
            output: null,
            failure_code: null,
          };
          records.push(record);
          if (loseReply)
            throw new Error("Response disconnected after native acceptance");
          return { kind: "record", record };
        }
      }
    },
    readText: vi.fn(async (path: string) =>
      path.endsWith("metadata.yaml")
        ? JSON.stringify({
            schemaVersion: 3,
            id: conversation,
            title: "Saved native title",
            status: "active",
          })
        : records
            .flatMap((r) => [
              {
                schemaVersion: 3,
                id: r.input.request_id,
                type: "message",
                role: "user",
                text: r.input.prompt,
              },
              ...(r.output
                ? [
                    {
                      schemaVersion: 3,
                      id: `reply-${r.input.request_id}`,
                      type: "message",
                      role: "assistant",
                      text: r.output,
                    },
                  ]
                : []),
            ])
            .map((v) => JSON.stringify(v))
            .join("\n"),
    ),
  };
  const session = new NativeChatSession(host);
  const port = new NativeChatObserver(session, { target: () => "codex" });
  const send = (id = crypto.randomUUID()) =>
    port.act({
      id,
      kind: "send",
      session: port.selected,
      recipients: ["codex"],
      submission: { id, text: "Authored café 📝", comments: [] },
    });
  return {
    host,
    session,
    port,
    records,
    calls,
    leaves,
    send,
    conversation,
    loseReply: () => {
      loseReply = true;
    },
  };
}

describe("native chat observer", () => {
  it("a fresh History observer reads saved titles without loading all transcripts", async () => {
    const f = fixture();
    await f.port.read(new AbortController().signal);
    await f.send();
    f.records[0].phase = "completed";
    f.host.readText.mockClear();
    const history = new NativeChatObserver(f.session, {
      target: () => "codex",
    });
    const snapshot = await history.read(new AbortController().signal);
    expect(snapshot.sessions.find((s) => s.id === f.conversation)?.title).toBe(
      "Saved native title",
    );
    expect(f.host.readText.mock.calls.map(([path]) => path)).toEqual([
      expect.stringContaining("/metadata.yaml"),
    ]);
    expect(f.calls.filter((v) => v.kind === "submit")).toHaveLength(1);
    history.close();
    f.port.close();
  });
  it("opens a local draft without publishing a conversation or authored work", async () => {
    const f = fixture();
    const snapshot = await f.port.read(new AbortController().signal);
    expect(snapshot.agents[0].id).toBe("codex");
    expect(snapshot.sessions).toHaveLength(1);
    expect(snapshot.sessions[0].items).toEqual([]);
    expect(f.calls.filter((v) => v.kind === "submit")).toHaveLength(0);
    expect(f.host.readText).not.toHaveBeenCalled();
    f.port.close();
  });
  it("uses the first native authored prompt when portable metadata has no title", async () => {
    const f = fixture();
    await f.port.read(new AbortController().signal);
    await f.send();
    f.records[0].phase = "completed";
    const history = new NativeChatObserver(f.session, {
      target: () => "codex",
    });
    f.host.readText.mockResolvedValue(
      JSON.stringify({
        schemaVersion: 3,
        id: f.conversation,
        status: "active",
      }),
    );
    f.host.readText.mockClear();
    const snapshot = await history.read(new AbortController().signal);
    expect(snapshot.sessions.find((s) => s.id === f.conversation)?.title).toBe(
      "Authored café 📝",
    );
    expect(f.host.readText.mock.calls.map(([path]) => path)).toEqual([
      expect.stringContaining("/metadata.yaml"),
    ]);
    history.close();
    f.port.close();
  });
  it("retries only active missing metadata and never hides malformed saved history", async () => {
    const f = fixture();
    await f.port.read(new AbortController().signal);
    await f.send();
    const history = new NativeChatObserver(f.session, {
      target: () => "codex",
    });
    f.host.readText.mockRejectedValueOnce(
      Object.assign(new Error("Not published"), { code: "ENOENT" }),
    );
    const pending = await history.read(new AbortController().signal);
    expect(pending.sessions.find((s) => s.id === f.conversation)?.title).toBe(
      "Conversation",
    );
    const published = await history.read(new AbortController().signal);
    expect(published.sessions.find((s) => s.id === f.conversation)?.title).toBe(
      "Saved native title",
    );
    f.records[0].updated_at_ms++;
    f.records[0].phase = "completed";
    f.host.readText.mockRejectedValueOnce(
      Object.assign(new Error("Missing saved metadata"), { code: "ENOENT" }),
    );
    await expect(history.read(new AbortController().signal)).rejects.toThrow(
      "Missing saved metadata",
    );
    f.host.readText.mockResolvedValueOnce(
      JSON.stringify({ schemaVersion: 3, id: "other", title: "Other" }),
    );
    await expect(history.read(new AbortController().signal)).rejects.toThrow(
      "cannot be displayed",
    );
    expect(f.calls.filter((v) => v.kind === "submit")).toHaveLength(1);
    history.close();
    f.port.close();
  });
  it("refreshes edited metadata after the bounded cache expires without reading transcripts", async () => {
    vi.useFakeTimers();
    try {
      const f = fixture();
      await f.port.read(new AbortController().signal);
      await f.send();
      f.records[0].phase = "completed";
      const history = new NativeChatObserver(f.session, {
        target: () => "codex",
      });
      await history.read(new AbortController().signal);
      f.host.readText.mockClear();
      f.host.readText.mockResolvedValue(
        JSON.stringify({
          schemaVersion: 3,
          id: f.conversation,
          title: "Edited title",
          status: "archived",
        }),
      );
      const cached = await history.read(new AbortController().signal);
      expect(cached.sessions.find((s) => s.id === f.conversation)?.title).toBe(
        "Saved native title",
      );
      expect(f.host.readText).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(2001);
      const refreshed = await history.read(new AbortController().signal);
      expect(
        refreshed.sessions.find((s) => s.id === f.conversation),
      ).toMatchObject({ title: "Edited title", status: "archived" });
      expect(f.host.readText.mock.calls).toHaveLength(1);
      expect(f.host.readText.mock.calls[0][0]).toMatch(/metadata.yaml$/);
      history.close();
      f.port.close();
    } finally {
      vi.useRealTimers();
    }
  });
  it("keeps a History-created draft's scope through its first explicit send", async () => {
    const f = fixture();
    const port = new NativeChatObserver(f.session, {
      target: () => "codex",
      initialScope: "Projects/Café",
    });
    const snapshot = await port.read(new AbortController().signal);
    expect(snapshot.chat?.scope).toBe("Projects/Café");
    expect(snapshot.sessions[0].scope).toBe("Projects/Café");
    const id = crypto.randomUUID();
    await port.act({
      id,
      kind: "send",
      recipients: ["codex"],
      submission: { id, text: "Scoped prompt", comments: [] },
    });
    expect(f.records[0].input.scope_dir).toBe("Projects/Café");
    port.close();
    f.port.close();
  });
  it("acknowledges the exact native request and observes portable files without writing", async () => {
    const f = fixture();
    await f.port.read(new AbortController().signal);
    const id = crypto.randomUUID();
    const outcome = await f.send(id);
    expect(outcome.status).toBe("acknowledged");
    expect(f.port.selected).toBe(f.conversation);
    expect(f.records[0].input.request_id).toBe(id);
    expect(f.records[0].input.prompt).toBe("Authored café 📝");
    expect(f.records[0].input.continuation).toBeUndefined();
    expect(f.records[0].input.options.mode).toBe("ask");
    f.records[0].phase = "completed";
    f.records[0].output = "Native reply";
    const snapshot = await f.port.read(new AbortController().signal);
    expect(snapshot.sessions.find((s) => s.id === f.conversation)?.title).toBe(
      "Saved native title",
    );
    expect(
      snapshot.sessions
        .find((s) => s.id === f.conversation)
        ?.items.map((i) => i.blocks[0].text),
    ).toEqual(["Authored café 📝", "Native reply"]);
    expect(snapshot.chat?.controls).toEqual({
      attachments: false,
      approvalPolicy: false,
      runtime: false,
    });
    expect(f.host.activate).toHaveBeenCalledTimes(1);
    f.port.close();
  });
  it("continues the same conversation only after its exact terminal predecessor", async () => {
    const f = fixture();
    await f.port.read(new AbortController().signal);
    await f.send();
    expect((await f.send()).status).toBe("refused");
    expect(f.calls.filter((v) => v.kind === "submit")).toHaveLength(1);
    f.records[0].phase = "completed";
    f.records[0].output = "Earlier answer";
    await f.port.read(new AbortController().signal);
    expect((await f.send()).status).toBe("acknowledged");
    expect(f.records[1].input.continuation).toEqual({
      conversation_id: f.conversation,
      after_request_id: f.records[0].input.request_id,
    });
    f.port.close();
  });
  it("checks an unknown send by the original request identity and never resends it", async () => {
    const f = fixture();
    await f.port.read(new AbortController().signal);
    f.loseReply();
    const id = crypto.randomUUID();
    expect((await f.send(id)).status).toBe("unknown");
    expect((await f.port.status(id)).status).toBe("acknowledged");
    expect((await f.port.status(crypto.randomUUID())).status).toBe("unknown");
    expect(f.calls.filter((v) => v.kind === "submit")).toHaveLength(1);
    f.port.close();
  });
  it("refuses unsupported authored content before any native submission", async () => {
    const f = fixture();
    await f.port.read(new AbortController().signal);
    for (const patch of [
      { attachments: ["Note.md"] },
      { recipients: ["codex", "other"] },
      {
        submission: {
          id: crypto.randomUUID(),
          text: "",
          comments: [{ text: "Keep this comment" }],
        },
      },
    ]) {
      const id = crypto.randomUUID();
      const outcome = await f.port.act({
        id,
        kind: "send",
        session: f.port.selected,
        recipients: ["codex"],
        submission: { id, text: "A prompt", comments: [] },
        ...patch,
      } as never);
      expect(outcome.status).toBe("refused");
    }
    expect(f.calls.filter((v) => v.kind === "submit")).toHaveLength(0);
    f.port.close();
  });
  it("view close stops observation while explicit plugin disable remains host-owned", async () => {
    vi.useFakeTimers();
    try {
      const f = fixture();
      await f.port.read(new AbortController().signal);
      await f.send();
      f.port.subscribe(() => {});
      f.port.close();
      const before = f.calls.length;
      await vi.advanceTimersByTimeAsync(2000);
      expect(f.calls).toHaveLength(before);
      expect(f.leaves).toEqual([]);
      expect(f.calls.some((v) => v.kind === "cancel")).toBe(false);
      await f.session.close("disable");
      expect(f.leaves).toEqual(["disable"]);
    } finally {
      vi.useRealTimers();
    }
  });
  it("malformed retained files report failure without dispatch or replacement", async () => {
    const f = fixture();
    await f.port.read(new AbortController().signal);
    await f.send();
    f.host.readText.mockResolvedValue("not a portable transcript");
    await expect(f.port.read(new AbortController().signal)).rejects.toThrow();
    expect(f.calls.filter((v) => v.kind === "submit")).toHaveLength(1);
    f.port.close();
  });
});
