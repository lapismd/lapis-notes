import { PluginDistributionError } from "./errors";

export const sha256Hex = async (
  input: string | ArrayBuffer | Uint8Array,
): Promise<string> => {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : toUint8(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const verifySha256 = async (
  input: string | ArrayBuffer | Uint8Array,
  expectedSha256: string,
): Promise<void> => {
  const actualSha256 = await sha256Hex(input);
  if (actualSha256.toLowerCase() !== expectedSha256.toLowerCase()) {
    throw new PluginDistributionError(
      "hash-mismatch",
      `SHA-256 mismatch: expected ${expectedSha256}, got ${actualSha256}.`,
      { details: { expectedSha256, actualSha256 } },
    );
  }
};

const toUint8 = (input: ArrayBuffer | Uint8Array): Uint8Array =>
  input instanceof Uint8Array ? input : new Uint8Array(input);
