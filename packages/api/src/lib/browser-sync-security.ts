import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/hashes/utils.js";
import type { SyncCryptoStatus } from "./sync-host-security";
import type { SyncCryptoEnrollmentRequest } from "./sync-host-security";
import type { SyncHostService } from "./sync-host";
import type { AppDatabase } from "./storage/app-database";

const BROWSER_CREDENTIAL_PREFIX = "sync-host:v1:browser-prf:";

export interface BrowserSyncPrfCredential {
  version: 1;
  credentialId: string;
  prfInput: string;
  hkdfSalt: string;
}

export interface BrowserStoragePersistenceStatus {
  supported: boolean;
  persisted: boolean;
}

export interface BrowserSyncUnlockInteraction {
  confirmPasskeyEnrollment(pluginId: string): Promise<boolean>;
  requestPassphrase(
    pluginId: string,
    mode: "enroll" | "unlock",
  ): Promise<string | null>;
}

type PrfExtensionResults = {
  prf?: {
    enabled?: boolean;
    results?: { first?: ArrayBuffer };
  };
};

export async function supportsBrowserWebAuthnPrf(): Promise<boolean> {
  if (typeof PublicKeyCredential === "undefined") return false;
  const getCapabilities = (
    PublicKeyCredential as typeof PublicKeyCredential & {
      getClientCapabilities?: () => Promise<Record<string, boolean>>;
    }
  ).getClientCapabilities;
  if (!getCapabilities) return false;
  try {
    const capabilities = await getCapabilities();
    return capabilities["extension:prf"] === true;
  } catch {
    return false;
  }
}

export async function requestBrowserStoragePersistence(
  storage: Pick<StorageManager, "persist" | "persisted"> | undefined =
    typeof navigator === "undefined" ? undefined : navigator.storage,
): Promise<BrowserStoragePersistenceStatus> {
  if (!storage?.persist || !storage.persisted) {
    return { supported: false, persisted: false };
  }
  if (await storage.persisted()) {
    return { supported: true, persisted: true };
  }
  return { supported: true, persisted: await storage.persist() };
}

export async function createBrowserSyncPrfCredential(options: {
  rpName: string;
  rpId?: string;
  userId: Uint8Array;
  userName: string;
  credentials?: CredentialsContainer;
}): Promise<{
  credential: BrowserSyncPrfCredential;
  wrappingKey: Uint8Array;
}> {
  const credentials =
    options.credentials ??
    (typeof navigator === "undefined" ? undefined : navigator.credentials);
  if (!credentials) throw new Error("WebAuthn is unavailable in this host");
  const prfInput = randomBytes(32);
  const hkdfSalt = randomBytes(32);
  const created = await credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: { name: options.rpName, id: options.rpId },
      user: {
        id: options.userId,
        name: options.userName,
        displayName: options.userName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
      },
      extensions: {
        prf: { eval: { first: prfInput } },
      } as AuthenticationExtensionsClientInputs,
    },
  });
  if (!(created instanceof PublicKeyCredential)) {
    throw new Error("WebAuthn credential creation was cancelled");
  }
  const results = created.getClientExtensionResults() as PrfExtensionResults;
  if (results.prf?.enabled !== true) {
    throw new Error("The selected authenticator does not support WebAuthn PRF");
  }
  const credential: BrowserSyncPrfCredential = {
    version: 1,
    credentialId: toBase64Url(new Uint8Array(created.rawId)),
    prfInput: toBase64Url(prfInput),
    hkdfSalt: toBase64Url(hkdfSalt),
  };
  return {
    credential,
    wrappingKey: await unlockBrowserSyncPrfCredential(credential, credentials),
  };
}

export async function unlockBrowserSyncPrfCredential(
  credential: BrowserSyncPrfCredential,
  credentials: CredentialsContainer | undefined =
    typeof navigator === "undefined" ? undefined : navigator.credentials,
): Promise<Uint8Array> {
  if (!credentials) throw new Error("WebAuthn is unavailable in this host");
  if (credential.version !== 1) {
    throw new Error("Unsupported browser sync credential version");
  }
  const assertion = await credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      allowCredentials: [
        {
          id: fromBase64Url(credential.credentialId),
          type: "public-key",
        },
      ],
      userVerification: "required",
      extensions: {
        prf: { eval: { first: fromBase64Url(credential.prfInput) } },
      } as AuthenticationExtensionsClientInputs,
    },
  });
  if (!(assertion instanceof PublicKeyCredential)) {
    throw new Error("WebAuthn unlock was cancelled");
  }
  const results = assertion.getClientExtensionResults() as PrfExtensionResults;
  const output = results.prf?.results?.first;
  if (!output || output.byteLength < 32) {
    throw new Error("WebAuthn PRF did not return wrapping material");
  }
  return hkdf(
    sha256,
    new Uint8Array(output),
    fromBase64Url(credential.hkdfSalt),
    new TextEncoder().encode("lapis-sync-v1:browser-wrapping-key"),
    32,
  );
}

/**
 * Build the host-owned browser unlock callback used by SyncHostService.
 * The callback returns only status to plugins; wrapping material stays in the
 * host flow and is zeroed immediately after enrollment or unlock.
 */
export function createBrowserSyncUnlockHandler(options: {
  database: AppDatabase;
  getSyncHost(): SyncHostService;
  interaction: BrowserSyncUnlockInteraction;
  rpName: string;
  rpId?: string;
  userName?: string;
  credentials?: CredentialsContainer;
}): (
  pluginId: string,
  status: SyncCryptoStatus,
  enrollment?: SyncCryptoEnrollmentRequest,
) => Promise<void> {
  return async (pluginId, status, enrollment) => {
    if (status.state === "unlocked") return;
    const recordKey = `${BROWSER_CREDENTIAL_PREFIX}${encodeKeyPart(pluginId)}`;
    const stored =
      (await options.database.getMeta<BrowserSyncPrfCredential>(recordKey)) ??
      null;

    if (stored) {
      const wrappingKey = await unlockBrowserSyncPrfCredential(
        stored,
        options.credentials,
      );
      try {
        if (status.state === "unenrolled") {
          await options.getSyncHost().enrollPluginCryptoWithWrappingKey(
            pluginId,
            wrappingKey,
            {
              name: "external",
              provider: "webauthn-prf",
              keyId: stored.credentialId,
            },
            enrollment,
          );
        } else {
          await options
            .getSyncHost()
            .unlockPluginCryptoWithWrappingKey(pluginId, wrappingKey);
        }
      } finally {
        wrappingKey.fill(0);
      }
      return;
    }

    if (
      status.state === "unenrolled" &&
      (await supportsBrowserWebAuthnPrf()) &&
      (await options.interaction.confirmPasskeyEnrollment(pluginId))
    ) {
      const userId = randomBytes(32);
      const created = await createBrowserSyncPrfCredential({
        rpName: options.rpName,
        rpId: options.rpId,
        userId,
        userName: options.userName ?? `sync:${pluginId}`,
        credentials: options.credentials,
      });
      try {
        await options.getSyncHost().enrollPluginCryptoWithWrappingKey(
          pluginId,
          created.wrappingKey,
          {
            name: "external",
            provider: "webauthn-prf",
            keyId: created.credential.credentialId,
          },
          enrollment,
        );
        await options.database.setMeta(recordKey, created.credential);
      } finally {
        created.wrappingKey.fill(0);
        userId.fill(0);
      }
      return;
    }

    const passphrase = await options.interaction.requestPassphrase(
      pluginId,
      status.state === "unenrolled" ? "enroll" : "unlock",
    );
    if (passphrase == null) throw new Error("Sync unlock was cancelled");
    if (status.state === "unenrolled") {
      await options
        .getSyncHost()
        .enrollPluginCrypto(pluginId, passphrase, enrollment);
    } else {
      await options.getSyncHost().unlockPluginCrypto(pluginId, passphrase);
    }
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function encodeKeyPart(value: string): string {
  return toBase64Url(new TextEncoder().encode(value));
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}
