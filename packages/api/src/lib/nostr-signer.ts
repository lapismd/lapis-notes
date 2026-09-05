export interface NostrUnsignedEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}

export interface NostrSignedEvent extends NostrUnsignedEvent {
  id: string;
  pubkey: string;
  sig: string;
}

export type NostrSignerAccountKind = "local" | "nip46";

export interface NostrSignerAccount {
  /** Opaque host-owned account identifier. */
  id: string;
  label: string;
  pubkey: string;
  kind: NostrSignerAccountKind;
}

export interface NostrProfileCreationRequest {
  displayName?: string;
}

export interface NostrRemoteSignerRequest {
  bunkerUrl: string;
  label?: string;
}

export interface NostrSignerBrokerContext {
  /** Identifies the plugin requesting a permissioned signer operation. */
  pluginId: string;
}

/**
 * Host-owned signer boundary. Implementations own consent, OS-keychain
 * storage, NIP-46 client credentials, signature validation, and session
 * teardown. Private keys are never part of this contract.
 */
export interface NostrSignerBroker {
  listAccounts(context: NostrSignerBrokerContext): Promise<NostrSignerAccount[]>;
  requestProfileCreation(
    context: NostrSignerBrokerContext,
    request: NostrProfileCreationRequest,
  ): Promise<NostrSignerAccount>;
  connectRemoteSigner(
    context: NostrSignerBrokerContext,
    request: NostrRemoteSignerRequest,
  ): Promise<NostrSignerAccount>;
  getPublicKey(
    context: NostrSignerBrokerContext,
    accountId: string,
  ): Promise<string>;
  signEvent(
    context: NostrSignerBrokerContext,
    accountId: string,
    event: NostrUnsignedEvent,
  ): Promise<NostrSignedEvent>;
  nip44Encrypt(
    context: NostrSignerBrokerContext,
    accountId: string,
    pubkey: string,
    plaintext: string,
  ): Promise<string>;
  nip44Decrypt(
    context: NostrSignerBrokerContext,
    accountId: string,
    pubkey: string,
    ciphertext: string,
  ): Promise<string>;
  close(
    context: NostrSignerBrokerContext,
    accountId: string,
  ): Promise<void>;
}

export interface NostrPluginSigner {
  readonly pluginId: string;
  listAccounts(): Promise<NostrSignerAccount[]>;
  requestProfileCreation(
    request?: NostrProfileCreationRequest,
  ): Promise<NostrSignerAccount>;
  connectRemoteSigner(
    request: NostrRemoteSignerRequest,
  ): Promise<NostrSignerAccount>;
  getPublicKey(accountId: string): Promise<string>;
  signEvent(
    accountId: string,
    event: NostrUnsignedEvent,
  ): Promise<NostrSignedEvent>;
  nip44Encrypt(
    accountId: string,
    pubkey: string,
    plaintext: string,
  ): Promise<string>;
  nip44Decrypt(
    accountId: string,
    pubkey: string,
    ciphertext: string,
  ): Promise<string>;
  close(accountId: string): Promise<void>;
}

export class NostrSignerHost {
  readonly #broker: NostrSignerBroker;

  constructor(broker: NostrSignerBroker = unavailableNostrSignerBroker) {
    this.#broker = broker;
  }

  forPlugin(pluginId: string): NostrPluginSigner {
    if (!pluginId.trim()) throw new TypeError("pluginId is required");
    const context = Object.freeze({ pluginId });
    return {
      pluginId,
      listAccounts: () => this.#broker.listAccounts(context),
      requestProfileCreation: (request = {}) =>
        this.#broker.requestProfileCreation(context, request),
      connectRemoteSigner: (request) =>
        this.#broker.connectRemoteSigner(context, request),
      getPublicKey: (accountId) =>
        this.#broker.getPublicKey(context, accountId),
      signEvent: async (accountId, event) => {
        const signed = await this.#broker.signEvent(context, accountId, event);
        assertSignedEventMatches(event, signed);
        return signed;
      },
      nip44Encrypt: (accountId, pubkey, plaintext) =>
        this.#broker.nip44Encrypt(context, accountId, pubkey, plaintext),
      nip44Decrypt: (accountId, pubkey, ciphertext) =>
        this.#broker.nip44Decrypt(context, accountId, pubkey, ciphertext),
      close: (accountId) => this.#broker.close(context, accountId),
    };
  }
}

const unavailable = (): never => {
  throw new Error("The host does not provide Nostr signing");
};

const unavailableNostrSignerBroker: NostrSignerBroker = {
  listAccounts: async () => [],
  requestProfileCreation: async () => unavailable(),
  connectRemoteSigner: async () => unavailable(),
  getPublicKey: async () => unavailable(),
  signEvent: async () => unavailable(),
  nip44Encrypt: async () => unavailable(),
  nip44Decrypt: async () => unavailable(),
  close: async () => undefined,
};

function assertSignedEventMatches(
  requested: NostrUnsignedEvent,
  signed: NostrSignedEvent,
): void {
  if (
    signed.kind !== requested.kind ||
    signed.created_at !== requested.created_at ||
    signed.content !== requested.content ||
    JSON.stringify(signed.tags) !== JSON.stringify(requested.tags)
  ) {
    throw new Error("Nostr signer changed the requested event");
  }
}
