import { canonicalJson } from "./canonical-json";
import { PluginDistributionError } from "./errors";
import type {
  SignatureRecord,
  SignedEnvelope,
  TrustedSigningKey,
} from "./types";

export const verifySignedEnvelope = async <T>(
  envelope: SignedEnvelope<T>,
  trustedKeys: TrustedSigningKey[],
): Promise<T> => {
  const payload = new TextEncoder().encode(canonicalJson(envelope.signed));

  for (const signature of envelope.signatures) {
    const key = trustedKeys.find(
      (candidate) =>
        candidate.keyId === signature.keyId && candidate.alg === signature.alg,
    );
    if (!key) continue;

    const ok = await verifySignature(payload, signature, key);
    if (ok) return envelope.signed;

    throw new PluginDistributionError(
      "signature-invalid",
      `Signature ${signature.keyId} did not verify.`,
      { details: { keyId: signature.keyId } },
    );
  }

  throw new PluginDistributionError(
    "signature-key-not-found",
    "No trusted signing key matched the envelope signatures.",
    {
      details: {
        signatureKeyIds: envelope.signatures.map(
          (signature) => signature.keyId,
        ),
        trustedKeyIds: trustedKeys.map((key) => key.keyId),
      },
    },
  );
};

export const verifySignature = async (
  payload: Uint8Array,
  signature: SignatureRecord,
  trustedKey: TrustedSigningKey,
): Promise<boolean> => {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    base64ToBytes(trustedKey.publicKey),
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  return globalThis.crypto.subtle.verify(
    { name: "Ed25519" },
    key,
    base64ToBytes(signature.sig),
    payload,
  );
};

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};
