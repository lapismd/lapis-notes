import { PluginDistributionError } from "./errors";
import { verifySha256 } from "./hashes";
import type { PluginImageReference } from "./types";

export const MAX_PLUGIN_IMAGE_BYTES = 5 * 1024 * 1024;

type FetchLike = typeof fetch;

const imageCache = new Map<string, Promise<Blob>>();
const supportedMediaTypes = new Set([
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

export function clearVerifiedPluginImageCache(): void {
  imageCache.clear();
}

export async function fetchVerifiedPluginImage(
  reference: PluginImageReference,
  fetchImpl: FetchLike = fetch,
): Promise<Blob> {
  validateReference(reference);
  const cacheKey = referenceCacheKey(reference);
  let pending = imageCache.get(cacheKey);
  if (!pending) {
    pending = fetchAndVerify(reference, fetchImpl).catch((error) => {
      imageCache.delete(cacheKey);
      throw error;
    });
    imageCache.set(cacheKey, pending);
  }
  return pending;
}

function validateReference(reference: PluginImageReference): void {
  if (
    !supportedMediaTypes.has(reference.mediaType) ||
    !Number.isInteger(reference.size) ||
    reference.size < 1 ||
    reference.size > MAX_PLUGIN_IMAGE_BYTES ||
    !Number.isInteger(reference.width) ||
    reference.width < 1 ||
    reference.width > 4096 ||
    !Number.isInteger(reference.height) ||
    reference.height < 1 ||
    reference.height > 4096 ||
    !/^[a-fA-F0-9]{64}$/.test(reference.sha256)
  ) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin image reference is invalid or exceeds the supported bounds.",
      { details: { url: reference.url, size: reference.size } },
    );
  }
  for (const [label, value] of [
    ["registry", reference.url],
    ["source", reference.sourceUrl],
  ] as const) {
    try {
      if (new URL(value).protocol !== "https:") throw new Error("not HTTPS");
    } catch (error) {
      throw new PluginDistributionError(
        "metadata-invalid",
        `Plugin image ${label} URL must use HTTPS.`,
        { cause: error, details: { url: value } },
      );
    }
  }
}

async function fetchAndVerify(
  reference: PluginImageReference,
  fetchImpl: FetchLike,
): Promise<Blob> {
  let response: Response;
  try {
    response = await fetchImpl(reference.url, {
      headers: { Accept: reference.mediaType },
    });
  } catch (error) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin image request failed.",
      { cause: error, details: { url: reference.url } },
    );
  }
  if (!response.ok) {
    throw new PluginDistributionError(
      "metadata-invalid",
      `Plugin image request failed with HTTP ${response.status}.`,
      { details: { url: reference.url, status: response.status } },
    );
  }
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (contentType && contentType !== reference.mediaType) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin image response media type does not match signed metadata.",
      {
        details: {
          url: reference.url,
          expectedMediaType: reference.mediaType,
          actualMediaType: contentType,
        },
      },
    );
  }
  const declaredLength = Number(response.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    (declaredLength !== reference.size || declaredLength > MAX_PLUGIN_IMAGE_BYTES)
  ) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin image response size does not match signed metadata.",
      {
        details: {
          url: reference.url,
          expectedSize: reference.size,
          actualSize: declaredLength,
        },
      },
    );
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (
    bytes.byteLength !== reference.size ||
    bytes.byteLength > MAX_PLUGIN_IMAGE_BYTES
  ) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin image bytes do not match the signed size.",
      {
        details: {
          url: reference.url,
          expectedSize: reference.size,
          actualSize: bytes.byteLength,
        },
      },
    );
  }
  await verifySha256(bytes, reference.sha256);
  return new Blob([bytes], { type: reference.mediaType });
}

function referenceCacheKey(reference: PluginImageReference): string {
  return [
    reference.url,
    reference.sourceUrl,
    reference.sha256.toLowerCase(),
    reference.size,
    reference.mediaType,
    reference.width,
    reference.height,
  ].join("\u0000");
}
