import { describe, expect, it, vi } from "vitest";

import {
  NostrSignerHost,
  type NostrSignerBroker,
  type NostrSignerBrokerContext,
  type NostrUnsignedEvent,
} from "../nostr-signer";

describe("Nostr signer host", () => {
  it("binds opaque signer operations to the requesting plugin", async () => {
    const contexts: NostrSignerBrokerContext[] = [];
    const broker: NostrSignerBroker = {
      listAccounts: async (context) => {
        contexts.push(context);
        return [
          {
            id: "account-1",
            label: "Personal",
            pubkey: "a".repeat(64),
            kind: "nip46",
          },
        ];
      },
      requestProfileCreation: async () => {
        throw new Error("not used");
      },
      connectRemoteSigner: async () => {
        throw new Error("not used");
      },
      getPublicKey: async () => "a".repeat(64),
      signEvent: async (_context, _accountId, event) => ({
        ...event,
        id: "b".repeat(64),
        pubkey: "a".repeat(64),
        sig: "c".repeat(128),
      }),
      nip44Encrypt: async () => "ciphertext",
      nip44Decrypt: async () => "plaintext",
      close: vi.fn(async () => undefined),
    };
    const signer = new NostrSignerHost(broker).forPlugin("community");
    const event: NostrUnsignedEvent = {
      kind: 1,
      created_at: 1_700_000_000,
      tags: [["t", "lapis"]],
      content: "Hello",
    };

    await expect(signer.listAccounts()).resolves.toHaveLength(1);
    await expect(signer.signEvent("account-1", event)).resolves.toMatchObject({
      ...event,
      pubkey: "a".repeat(64),
    });
    await expect(
      signer.nip44Encrypt("account-1", "d".repeat(64), "message"),
    ).resolves.toBe("ciphertext");
    await expect(
      signer.nip44Decrypt("account-1", "d".repeat(64), "ciphertext"),
    ).resolves.toBe("plaintext");
    expect(contexts).toEqual([{ pluginId: "community" }]);
  });

  it("rejects a broker response that mutates the event template", async () => {
    const broker = {
      listAccounts: async () => [],
      requestProfileCreation: async () => {
        throw new Error("not used");
      },
      connectRemoteSigner: async () => {
        throw new Error("not used");
      },
      getPublicKey: async () => "a".repeat(64),
      signEvent: async (_context, _accountId, event) => ({
        ...event,
        content: "changed",
        id: "b".repeat(64),
        pubkey: "a".repeat(64),
        sig: "c".repeat(128),
      }),
      nip44Encrypt: async () => "",
      nip44Decrypt: async () => "",
      close: async () => undefined,
    } satisfies NostrSignerBroker;

    await expect(
      new NostrSignerHost(broker).forPlugin("community").signEvent("account", {
        kind: 1,
        created_at: 1,
        tags: [],
        content: "original",
      }),
    ).rejects.toThrow("changed the requested event");
  });

  it("fails closed without a host signer implementation", async () => {
    const signer = new NostrSignerHost().forPlugin("community");
    await expect(signer.listAccounts()).resolves.toEqual([]);
    await expect(signer.getPublicKey("missing")).rejects.toThrow(
      "does not provide Nostr signing",
    );
  });
});
