import {
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
} from "nostr-tools/pure";
import { describe, expect, it, vi } from "vitest";

import type { NostrCredentialStore } from "./nostr-keychain";
import {
  DenoNostrSignerService,
  type DenoNip46Signer,
  type DenoNostrSignerAccount,
  type DenoNostrSignerAccountStore,
} from "./nostr-signer";

describe("Deno native Nostr signer", () => {
  it("keeps local credentials native while returning verifiable signatures", async () => {
    const fixture = createFixture();
    const sessionToken = await openSession(fixture.service);
    const context = { pluginId: "community" };
    const account = (await fixture.service.handle(
      "desktop_nostr_signer_create_profile",
      { sessionToken, context, request: { displayName: "Alice" } },
    )) as DenoNostrSignerAccount;

    expect(account).toMatchObject({
      id: "nostr-account-1",
      label: "Alice",
      kind: "local",
      pubkey: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(JSON.stringify(account)).not.toContain("secretKey");
    expect(fixture.credentials.values.get(account.id)).toMatch(
      /"secretKeyHex":"[0-9a-f]{64}"/,
    );
    await expect(
      fixture.service.handle("desktop_nostr_signer_sign_event", {
        sessionToken,
        context,
        accountId: account.id,
        event: {
          kind: 0,
          created_at: 1_800_000_000,
          tags: [],
          content: JSON.stringify({ display_name: "Alice" }),
        },
      }),
    ).resolves.toMatchObject({ pubkey: account.pubkey, kind: 0 });
  });

  it("supports NIP-44 without returning the local key", async () => {
    const fixture = createFixture();
    const sessionToken = await openSession(fixture.service);
    const context = { pluginId: "community" };
    const sender = (await fixture.service.handle(
      "desktop_nostr_signer_create_profile",
      { sessionToken, context, request: {} },
    )) as DenoNostrSignerAccount;
    const recipient = (await fixture.service.handle(
      "desktop_nostr_signer_create_profile",
      { sessionToken, context, request: {} },
    )) as DenoNostrSignerAccount;
    const ciphertext = (await fixture.service.handle(
      "desktop_nostr_signer_nip44_encrypt",
      {
        sessionToken,
        context,
        accountId: sender.id,
        pubkey: recipient.pubkey,
        plaintext: "private message",
      },
    )) as string;

    await expect(
      fixture.service.handle("desktop_nostr_signer_nip44_decrypt", {
        sessionToken,
        context,
        accountId: recipient.id,
        pubkey: sender.pubkey,
        ciphertext,
      }),
    ).resolves.toBe("private message");
  });

  it("persists NIP-46 client credentials and reconnects after close", async () => {
    const remoteSecret = generateSecretKey();
    const close = vi.fn(async () => undefined);
    const connect = vi.fn(async () => createRemoteSigner(remoteSecret, close));
    const fixture = createFixture({ nip46: { connect } });
    const sessionToken = await openSession(fixture.service);
    const context = { pluginId: "community" };
    const account = (await fixture.service.handle(
      "desktop_nostr_signer_connect_remote",
      {
        sessionToken,
        context,
        request: {
          bunkerUrl: `bunker://${"b".repeat(64)}?relay=wss%3A%2F%2Frelay.example&secret=invite`,
          label: "Remote",
        },
      },
    )) as DenoNostrSignerAccount;

    expect(account.pubkey).toBe(getPublicKey(remoteSecret));
    expect(JSON.stringify(account)).not.toContain("bunker://");
    expect(fixture.credentials.values.get(account.id)).toContain(
      '"clientSecretKeyHex":"',
    );
    await fixture.service.handle("desktop_nostr_signer_close", {
      sessionToken,
      context,
      accountId: account.id,
    });
    expect(close).toHaveBeenCalledOnce();
    await fixture.service.handle("desktop_nostr_signer_sign_event", {
      sessionToken,
      context,
      accountId: account.id,
      event: { kind: 1, created_at: 1, tags: [], content: "remote" },
    });
    expect(connect).toHaveBeenCalledTimes(2);
    expect(connect.mock.calls[1]?.[0].clientSecretKey).toEqual(
      connect.mock.calls[0]?.[0].clientSecretKey,
    );
  });

  it("requires the native session capability and official plugin identity", async () => {
    const fixture = createFixture();
    const sessionToken = await openSession(fixture.service);
    await expect(
      fixture.service.handle("desktop_nostr_signer_list_accounts", {
        sessionToken: "wrong",
        context: { pluginId: "community" },
      }),
    ).rejects.toThrow("unauthorized");
    await expect(
      fixture.service.handle("desktop_nostr_signer_list_accounts", {
        sessionToken,
        context: { pluginId: "community-copy" },
      }),
    ).rejects.toThrow("not authorized for this plugin");
  });
});

const openSession = async (
  service: DenoNostrSignerService,
): Promise<string> => {
  const result = (await service.handle(
    "desktop_nostr_signer_open_session",
    {},
  )) as { sessionToken: string };
  return result.sessionToken;
};

const createFixture = (
  options: { nip46?: { connect: () => Promise<DenoNip46Signer> } } = {},
) => {
  const accounts = new MemoryAccountStore();
  const credentials = new MemoryCredentialStore();
  let id = 0;
  const service = new DenoNostrSignerService({
    accounts,
    credentials,
    ...(options.nip46 ? { nip46: options.nip46 } : {}),
    randomId: () => `nostr-account-${++id}`,
    randomSessionToken: () => "native-session-token",
  });
  return { accounts, credentials, service };
};

const createRemoteSigner = (
  secret: Uint8Array,
  close: () => Promise<void>,
): DenoNip46Signer => ({
  getPublicKey: async () => getPublicKey(secret),
  signEvent: async (event) => finalizeEvent(event, secret),
  nip44Encrypt: async () => "ciphertext",
  nip44Decrypt: async () => "plaintext",
  close,
});

class MemoryAccountStore implements DenoNostrSignerAccountStore {
  readonly values = new Map<string, DenoNostrSignerAccount>();

  async list(): Promise<DenoNostrSignerAccount[]> {
    return [...this.values.values()];
  }

  async get(accountId: string): Promise<DenoNostrSignerAccount | null> {
    return this.values.get(accountId) ?? null;
  }

  async put(account: DenoNostrSignerAccount): Promise<void> {
    this.values.set(account.id, account);
  }
}

class MemoryCredentialStore implements NostrCredentialStore {
  readonly values = new Map<string, string>();

  async get(accountId: string): Promise<string | null> {
    return this.values.get(accountId) ?? null;
  }

  async put(accountId: string, credential: string): Promise<void> {
    this.values.set(accountId, credential);
  }

  async delete(accountId: string): Promise<void> {
    this.values.delete(accountId);
  }
}
