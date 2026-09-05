import { describe, expect, it, vi } from "vitest";

import { createDenoNostrSignerBroker } from "./deno-nostr-signer";

describe("Deno renderer Nostr signer broker", () => {
  it("keeps the native session token inside the broker closure", async () => {
    const invoke = vi.fn(async (command: string) => {
      if (command === "desktop_nostr_signer_open_session") {
        return { sessionToken: "native-only-token" };
      }
      return [
        {
          id: "account-1",
          label: "Alice",
          pubkey: "a".repeat(64),
          kind: "local",
        },
      ];
    });
    const broker = await createDenoNostrSignerBroker(invoke);

    await expect(
      broker.listAccounts({ pluginId: "community" }),
    ).resolves.toMatchObject([{ id: "account-1" }]);
    expect(JSON.stringify(broker)).not.toContain("native-only-token");
    expect(invoke).toHaveBeenNthCalledWith(
      2,
      "desktop_nostr_signer_list_accounts",
      {
        sessionToken: "native-only-token",
        context: { pluginId: "community" },
      },
    );
  });

  it("copies event tags before crossing the native boundary", async () => {
    const invoke = vi.fn(
      async (command: string, payload?: Record<string, unknown>) => {
        if (command === "desktop_nostr_signer_open_session") {
          return { sessionToken: "token" };
        }
        const event = payload?.event as {
          kind: number;
          created_at: number;
          tags: string[][];
          content: string;
        };
        event.tags[0]!.push("native-change");
        return {
          ...event,
          id: "b".repeat(64),
          pubkey: "a".repeat(64),
          sig: "c".repeat(128),
        };
      },
    );
    const broker = await createDenoNostrSignerBroker(invoke);
    const event = {
      kind: 1,
      created_at: 1,
      tags: [["t", "lapis"]],
      content: "hello",
    };

    await broker.signEvent({ pluginId: "community" }, "account-1", event);
    expect(event.tags).toEqual([["t", "lapis"]]);
  });

  it("fails closed when the native host does not return a session", async () => {
    await expect(
      createDenoNostrSignerBroker(vi.fn(async () => ({}))),
    ).rejects.toThrow("did not create a native session");
  });
});
