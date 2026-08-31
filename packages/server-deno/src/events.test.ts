import { describe, expect, it } from "vitest";

import { VaultEventHub } from "./events.ts";

describe("vault event replay", () => {
  it("uses epoch:sequence ids and replays only unseen retained events", () => {
    const hub = new VaultEventHub(3);
    const first = hub.publish("vault", "file", { path: "a.md" });
    const second = hub.publish("vault", "database", { revision: 1 });
    expect(first.id).toMatch(/^[0-9a-f-]{36}:1$/u);
    expect(hub.replay("vault", first.id)).toEqual([second]);
  });

  it("requires resync for cursors older than the bounded replay window", () => {
    const hub = new VaultEventHub(2);
    const expired = hub.publish("vault", "file", 1);
    hub.publish("vault", "file", 2);
    hub.publish("vault", "file", 3);
    hub.publish("vault", "file", 4);
    expect(() => hub.replay("vault", expired.id)).toThrow(
      /cursor is unavailable/u,
    );
  });
});
