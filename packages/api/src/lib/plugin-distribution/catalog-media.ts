import {
  resolveRegistryMedia,
  type RegistryMediaV2,
} from "@lapismd/lapis-community/registry/schema";
import { verifySha256 } from "./hashes";
import { PluginDistributionError } from "./errors";

export { resolveRegistryMedia };
export type { RegistryMediaV2 };

export async function fetchVerifiedPluginImage(
  reference: ReturnType<typeof resolveRegistryMedia>,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<Blob> {
  if (reference.size > 5 * 1024 * 1024 || reference.size < 1)
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin image exceeds the supported size.",
    );
  const response = await fetchImpl(reference.url, { signal });
  if (!response.ok || !response.body)
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin image request failed.",
    );
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > reference.size) {
        await reader.cancel();
        throw new PluginDistributionError(
          "metadata-invalid",
          "Plugin image size does not match signed metadata.",
        );
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  if (size !== reference.size)
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin image size does not match signed metadata.",
    );
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  await verifySha256(bytes, reference.sha256);
  return new Blob([bytes], { type: reference.mediaType });
}
