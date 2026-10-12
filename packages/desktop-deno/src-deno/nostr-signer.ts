import { join } from "node:path";
import { nip19 } from "npm:nostr-tools@2.25.2";
import { BunkerSigner, parseBunkerInput } from "npm:nostr-tools@2.25.2/nip46";
import {
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  verifyEvent,
  type EventTemplate,
  type VerifiedEvent,
} from "npm:nostr-tools@2.25.2/pure";
import { v2 as nip44 } from "npm:nostr-tools@2.25.2/nip44";

import type { NostrCredentialStore } from "./nostr-keychain.ts";

export const DENO_NOSTR_SIGNER_COMMANDS = new Set([
  "desktop_nostr_signer_open_session",
  "desktop_nostr_signer_list_accounts",
  "desktop_nostr_signer_create_profile",
  "desktop_nostr_signer_connect_remote",
  "desktop_nostr_signer_import_private_key",
  "desktop_nostr_signer_get_public_key",
  "desktop_nostr_signer_sign_event",
  "desktop_nostr_signer_nip44_encrypt",
  "desktop_nostr_signer_nip44_decrypt",
  "desktop_nostr_signer_close",
]);

export type DenoNostrSignerAccount = {
  id: string;
  label: string;
  pubkey: string;
  kind: "local" | "nip46";
};

export interface DenoNostrSignerAccountStore {
  list(): Promise<DenoNostrSignerAccount[]>;
  get(accountId: string): Promise<DenoNostrSignerAccount | null>;
  put(account: DenoNostrSignerAccount): Promise<void>;
}

export interface DenoNip46Signer {
  getPublicKey(): Promise<string>;
  signEvent(event: EventTemplate): Promise<VerifiedEvent>;
  nip44Encrypt(pubkey: string, plaintext: string): Promise<string>;
  nip44Decrypt(pubkey: string, ciphertext: string): Promise<string>;
  close(): Promise<void>;
}

export interface DenoNip46SignerFactory {
  connect(options: {
    bunkerUrl: string;
    clientSecretKey: Uint8Array;
    onauth?: (url: string) => void;
  }): Promise<DenoNip46Signer>;
}

export interface DenoNostrSignerServiceOptions {
  accounts: DenoNostrSignerAccountStore;
  credentials: NostrCredentialStore;
  nip46?: DenoNip46SignerFactory;
  onRemoteAuthRequired?: (url: string) => void;
  randomId?: () => string;
  randomSessionToken?: () => string;
}

type LocalCredential = {
  version: 1;
  kind: "local";
  secretKeyHex: string;
};

type RemoteCredential = {
  version: 1;
  kind: "nip46";
  bunkerUrl: string;
  clientSecretKeyHex: string;
};

type StoredCredential = LocalCredential | RemoteCredential;

export class DenoNostrSignerService {
  readonly #options: DenoNostrSignerServiceOptions;
  readonly #nip46: DenoNip46SignerFactory;
  readonly #remoteSessions = new Map<string, DenoNip46Signer>();
  #sessionToken: string | null = null;

  constructor(options: DenoNostrSignerServiceOptions) {
    this.#options = options;
    this.#nip46 = options.nip46 ?? new DefaultDenoNip46SignerFactory();
  }

  async handle(
    command: string,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    if (command === "desktop_nostr_signer_open_session") {
      this.#sessionToken =
        this.#options.randomSessionToken?.() ?? encodeHex(generateSecretKey());
      return { sessionToken: this.#sessionToken };
    }
    this.#authorize(payload);
    const context = readRecord(payload.context, "context");
    if (context.pluginId !== "community") {
      throw new Error("Nostr signing is not authorized for this plugin");
    }
    if (command === "desktop_nostr_signer_list_accounts") {
      return (await this.#options.accounts.list()).map(copyAccount);
    }
    if (command === "desktop_nostr_signer_create_profile") {
      return await this.#createProfile(readOptionalRecord(payload.request));
    }
    if (command === "desktop_nostr_signer_connect_remote") {
      return await this.#connectRemote(readRecord(payload.request, "request"));
    }
    if (command === "desktop_nostr_signer_import_private_key") {
      return await this.#importPrivateKey(
        readRecord(payload.request, "request"),
      );
    }
    const accountId = readBoundedString(payload.accountId, "accountId", 200);
    const account = await this.#requireAccount(accountId);
    if (command === "desktop_nostr_signer_get_public_key")
      return account.pubkey;
    if (command === "desktop_nostr_signer_sign_event") {
      return await this.#signEvent(account, parseEventTemplate(payload.event));
    }
    if (command === "desktop_nostr_signer_nip44_encrypt") {
      return await this.#nip44Encrypt(
        account,
        readPubkey(payload.pubkey),
        readBoundedString(payload.plaintext, "plaintext", 1_048_576, false),
      );
    }
    if (command === "desktop_nostr_signer_nip44_decrypt") {
      return await this.#nip44Decrypt(
        account,
        readPubkey(payload.pubkey),
        readBoundedString(payload.ciphertext, "ciphertext", 2_097_152, false),
      );
    }
    if (command === "desktop_nostr_signer_close") {
      const signer = this.#remoteSessions.get(account.id);
      this.#remoteSessions.delete(account.id);
      await signer?.close();
      return;
    }
    throw new Error(`Unhandled Nostr signer command: ${command}`);
  }

  async close(): Promise<void> {
    this.#sessionToken = null;
    const sessions = [...this.#remoteSessions.values()];
    this.#remoteSessions.clear();
    await Promise.allSettled(sessions.map((session) => session.close()));
  }

  async #createProfile(
    request: Record<string, unknown>,
  ): Promise<DenoNostrSignerAccount> {
    const secretKey = generateSecretKey();
    const displayName = readOptionalBoundedString(
      request.displayName,
      "displayName",
      200,
    );
    const account: DenoNostrSignerAccount = {
      id: this.#createAccountId(),
      label: displayName ?? "Nostr profile",
      pubkey: getPublicKey(secretKey),
      kind: "local",
    };
    await this.#persistAccount(account, {
      version: 1,
      kind: "local",
      secretKeyHex: encodeHex(secretKey),
    });
    return copyAccount(account);
  }

  async #connectRemote(
    request: Record<string, unknown>,
  ): Promise<DenoNostrSignerAccount> {
    const bunkerUrl = readBoundedString(request.bunkerUrl, "bunkerUrl", 8_192);
    const clientSecretKey = generateSecretKey();
    const signer = await this.#nip46.connect({
      bunkerUrl,
      clientSecretKey,
      ...(this.#options.onRemoteAuthRequired
        ? { onauth: this.#options.onRemoteAuthRequired }
        : {}),
    });
    const pubkey = readPubkey(await signer.getPublicKey());
    const account: DenoNostrSignerAccount = {
      id: this.#createAccountId(),
      label:
        readOptionalBoundedString(request.label, "label", 200) ??
        "Remote Nostr signer",
      pubkey,
      kind: "nip46",
    };
    try {
      await this.#persistAccount(account, {
        version: 1,
        kind: "nip46",
        bunkerUrl,
        clientSecretKeyHex: encodeHex(clientSecretKey),
      });
      this.#remoteSessions.set(account.id, signer);
      return copyAccount(account);
    } catch (error) {
      await signer.close();
      throw error;
    }
  }

  async #importPrivateKey(
    request: Record<string, unknown>,
  ): Promise<DenoNostrSignerAccount> {
    const secretKey = readPrivateKey(request.privateKey);
    try {
      const account: DenoNostrSignerAccount = {
        id: this.#createAccountId(),
        label:
          readOptionalBoundedString(request.label, "label", 200) ??
          "Imported Nostr key",
        pubkey: getPublicKey(secretKey),
        kind: "local",
      };
      await this.#persistAccount(account, {
        version: 1,
        kind: "local",
        secretKeyHex: encodeHex(secretKey),
      });
      return copyAccount(account);
    } finally {
      secretKey.fill(0);
    }
  }

  async #signEvent(
    account: DenoNostrSignerAccount,
    template: EventTemplate,
  ): Promise<VerifiedEvent> {
    let signed: VerifiedEvent;
    if (account.kind === "local") {
      const credential = await this.#loadCredential(account);
      if (credential.kind !== "local") throw invalidCredential();
      signed = finalizeEvent(
        template,
        decodeSecretKey(credential.secretKeyHex),
      );
    } else {
      signed = await (await this.#remoteSigner(account)).signEvent(template);
    }
    assertSignedEvent(account, template, signed);
    return signed;
  }

  async #nip44Encrypt(
    account: DenoNostrSignerAccount,
    pubkey: string,
    plaintext: string,
  ): Promise<string> {
    if (account.kind === "nip46") {
      return await (
        await this.#remoteSigner(account)
      ).nip44Encrypt(pubkey, plaintext);
    }
    const credential = await this.#loadCredential(account);
    if (credential.kind !== "local") throw invalidCredential();
    const conversationKey = nip44.utils.getConversationKey(
      decodeSecretKey(credential.secretKeyHex),
      pubkey,
    );
    return nip44.encrypt(plaintext, conversationKey);
  }

  async #nip44Decrypt(
    account: DenoNostrSignerAccount,
    pubkey: string,
    ciphertext: string,
  ): Promise<string> {
    if (account.kind === "nip46") {
      return await (
        await this.#remoteSigner(account)
      ).nip44Decrypt(pubkey, ciphertext);
    }
    const credential = await this.#loadCredential(account);
    if (credential.kind !== "local") throw invalidCredential();
    const conversationKey = nip44.utils.getConversationKey(
      decodeSecretKey(credential.secretKeyHex),
      pubkey,
    );
    return nip44.decrypt(ciphertext, conversationKey);
  }

  async #remoteSigner(
    account: DenoNostrSignerAccount,
  ): Promise<DenoNip46Signer> {
    const cached = this.#remoteSessions.get(account.id);
    if (cached) return cached;
    const credential = await this.#loadCredential(account);
    if (credential.kind !== "nip46") throw invalidCredential();
    const signer = await this.#nip46.connect({
      bunkerUrl: credential.bunkerUrl,
      clientSecretKey: decodeSecretKey(credential.clientSecretKeyHex),
      ...(this.#options.onRemoteAuthRequired
        ? { onauth: this.#options.onRemoteAuthRequired }
        : {}),
    });
    if ((await signer.getPublicKey()) !== account.pubkey) {
      await signer.close();
      throw new Error(
        "Remote signer public key changed for the stored account",
      );
    }
    this.#remoteSessions.set(account.id, signer);
    return signer;
  }

  async #persistAccount(
    account: DenoNostrSignerAccount,
    credential: StoredCredential,
  ): Promise<void> {
    await this.#options.credentials.put(account.id, JSON.stringify(credential));
    try {
      await this.#options.accounts.put(account);
    } catch (error) {
      await this.#options.credentials.delete(account.id);
      throw error;
    }
  }

  async #loadCredential(
    account: DenoNostrSignerAccount,
  ): Promise<StoredCredential> {
    return parseCredential(
      await this.#options.credentials.get(account.id),
      account.kind,
    );
  }

  async #requireAccount(accountId: string): Promise<DenoNostrSignerAccount> {
    const account = await this.#options.accounts.get(accountId);
    if (!account) throw new Error(`Unknown Nostr signer account: ${accountId}`);
    return account;
  }

  #authorize(payload: Record<string, unknown>): void {
    const token = readBoundedString(payload.sessionToken, "sessionToken", 256);
    if (!this.#sessionToken || token !== this.#sessionToken) {
      throw new Error("Nostr signer session is unauthorized");
    }
  }

  #createAccountId(): string {
    return this.#options.randomId?.() ?? `nostr-${crypto.randomUUID()}`;
  }
}

export class JsonDenoNostrSignerAccountStore
  implements DenoNostrSignerAccountStore
{
  readonly #path: string;
  #writeQueue: Promise<void> = Promise.resolve();

  constructor(userDataPath: string) {
    this.#path = join(userDataPath, "nostr-accounts.json");
  }

  async list(): Promise<DenoNostrSignerAccount[]> {
    await this.#writeQueue;
    return [...(await this.#read()).values()].map(copyAccount);
  }

  async get(accountId: string): Promise<DenoNostrSignerAccount | null> {
    await this.#writeQueue;
    const account = (await this.#read()).get(accountId);
    return account ? copyAccount(account) : null;
  }

  async put(account: DenoNostrSignerAccount): Promise<void> {
    this.#writeQueue = this.#writeQueue.then(async () => {
      const accounts = await this.#read();
      accounts.set(account.id, copyAccount(account));
      await this.#write(accounts);
    });
    await this.#writeQueue;
  }

  async #read(): Promise<Map<string, DenoNostrSignerAccount>> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await Deno.readTextFile(this.#path));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return new Map();
      throw new Error("Unable to read Nostr account metadata", {
        cause: error,
      });
    }
    if (!Array.isArray(parsed))
      throw new Error("Invalid Nostr account metadata");
    const accounts = parsed.map(parseAccount);
    return new Map(accounts.map((account) => [account.id, account]));
  }

  async #write(accounts: Map<string, DenoNostrSignerAccount>): Promise<void> {
    const directory = this.#path.slice(0, this.#path.lastIndexOf("/"));
    await Deno.mkdir(directory, { recursive: true, mode: 0o700 });
    const temporaryPath = `${this.#path}.tmp`;
    await Deno.writeTextFile(
      temporaryPath,
      JSON.stringify([...accounts.values()]),
      { mode: 0o600 },
    );
    await Deno.rename(temporaryPath, this.#path);
  }
}

class DefaultDenoNip46SignerFactory implements DenoNip46SignerFactory {
  async connect(options: {
    bunkerUrl: string;
    clientSecretKey: Uint8Array;
    onauth?: (url: string) => void;
  }): Promise<DenoNip46Signer> {
    const pointer = await parseBunkerInput(options.bunkerUrl);
    if (!pointer) throw new Error("Invalid NIP-46 bunker URL or identifier");
    const signer = BunkerSigner.fromBunker(options.clientSecretKey, pointer, {
      ...(options.onauth ? { onauth: options.onauth } : {}),
    });
    await signer.connect({ name: "Lapis Notes" });
    return {
      getPublicKey: () => signer.getPublicKey(),
      signEvent: (event) => signer.signEvent(event),
      nip44Encrypt: (pubkey, plaintext) =>
        signer.nip44Encrypt(pubkey, plaintext),
      nip44Decrypt: (pubkey, ciphertext) =>
        signer.nip44Decrypt(pubkey, ciphertext),
      close: () => signer.close(),
    };
  }
}

function parseEventTemplate(value: unknown): EventTemplate {
  const event = readRecord(value, "event");
  if (!Number.isInteger(event.kind) || !Number.isInteger(event.created_at)) {
    throw new TypeError("Invalid Nostr event kind or timestamp");
  }
  if (!Array.isArray(event.tags) || event.tags.length > 1_000) {
    throw new TypeError("Invalid Nostr event tags");
  }
  const tags = event.tags.map((tag) => {
    if (
      !Array.isArray(tag) ||
      tag.length > 64 ||
      tag.some((part) => typeof part !== "string" || part.length > 8_192)
    ) {
      throw new TypeError("Invalid Nostr event tag");
    }
    return [...tag] as string[];
  });
  return {
    kind: event.kind as number,
    created_at: event.created_at as number,
    tags,
    content: readBoundedString(event.content, "content", 1_048_576, false),
  };
}

function assertSignedEvent(
  account: DenoNostrSignerAccount,
  template: EventTemplate,
  signed: VerifiedEvent,
): void {
  if (
    signed.pubkey !== account.pubkey ||
    signed.kind !== template.kind ||
    signed.created_at !== template.created_at ||
    signed.content !== template.content ||
    JSON.stringify(signed.tags) !== JSON.stringify(template.tags) ||
    !verifyEvent(signed)
  ) {
    throw new Error("Nostr signer returned an invalid or changed event");
  }
}

function parseCredential(
  serialized: string | null,
  expectedKind: DenoNostrSignerAccount["kind"],
): StoredCredential {
  if (!serialized) throw invalidCredential();
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw invalidCredential();
  }
  const record = readRecord(value, "credential");
  if (record.version !== 1 || record.kind !== expectedKind) {
    throw invalidCredential();
  }
  if (record.kind === "local") {
    return {
      version: 1,
      kind: "local",
      secretKeyHex: readSecretKey(record.secretKeyHex),
    };
  }
  if (record.kind === "nip46") {
    return {
      version: 1,
      kind: "nip46",
      bunkerUrl: readBoundedString(record.bunkerUrl, "bunkerUrl", 8_192),
      clientSecretKeyHex: readSecretKey(record.clientSecretKeyHex),
    };
  }
  throw invalidCredential();
}

function parseAccount(value: unknown): DenoNostrSignerAccount {
  const record = readRecord(value, "account");
  if (record.kind !== "local" && record.kind !== "nip46") {
    throw new Error("Invalid Nostr account metadata");
  }
  return {
    id: readBoundedString(record.id, "id", 200),
    label: readBoundedString(record.label, "label", 200),
    pubkey: readPubkey(record.pubkey),
    kind: record.kind,
  };
}

function readRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`Invalid Nostr signer ${label}`);
  }
  return value as Record<string, unknown>;
}

const readOptionalRecord = (value: unknown): Record<string, unknown> =>
  value === undefined ? {} : readRecord(value, "request");

function readBoundedString(
  value: unknown,
  label: string,
  maximumLength: number,
  trim = true,
): string {
  if (typeof value !== "string" || value.length > maximumLength) {
    throw new TypeError(`Invalid Nostr signer ${label}`);
  }
  const normalized = trim ? value.trim() : value;
  if (!normalized && trim) throw new TypeError(`Invalid Nostr signer ${label}`);
  return normalized;
}

function readOptionalBoundedString(
  value: unknown,
  label: string,
  maximumLength: number,
): string | undefined {
  if (value === undefined) return undefined;
  return readBoundedString(value, label, maximumLength);
}

function readPubkey(value: unknown): string {
  const pubkey = readBoundedString(value, "pubkey", 64);
  if (!/^[0-9a-f]{64}$/u.test(pubkey)) {
    throw new TypeError("Invalid Nostr signer pubkey");
  }
  return pubkey;
}

function readSecretKey(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/u.test(value)) {
    throw invalidCredential();
  }
  return value;
}

function readPrivateKey(value: unknown): Uint8Array {
  const input = readBoundedString(value, "privateKey", 4_096);
  if (/^[0-9a-f]{64}$/iu.test(input)) {
    return decodeSecretKey(input.toLowerCase());
  }
  try {
    const decoded = nip19.decode(input);
    if (decoded.type !== "nsec" || !(decoded.data instanceof Uint8Array)) {
      throw new TypeError("Invalid Nostr signer privateKey");
    }
    if (decoded.data.length !== 32) {
      throw new TypeError("Invalid Nostr signer privateKey");
    }
    return new Uint8Array(decoded.data);
  } catch {
    throw new TypeError(
      "Use an nsec or 64-character hexadecimal Nostr private key",
    );
  }
}

function decodeSecretKey(value: string): Uint8Array {
  return Uint8Array.from(value.match(/../gu) ?? [], (byte) =>
    Number.parseInt(byte, 16),
  );
}

const encodeHex = (bytes: Uint8Array): string =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

const copyAccount = (
  account: DenoNostrSignerAccount,
): DenoNostrSignerAccount => ({ ...account });

const invalidCredential = (): Error =>
  new Error("Nostr signer credential is unavailable or invalid");
