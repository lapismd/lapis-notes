import { PluginDistributionError } from "./errors";
import { verifySha256 } from "./hashes";
import type { PluginMarkdownReference } from "./types";

export const MAX_PLUGIN_MARKDOWN_BYTES = 256 * 1024;

type FetchLike = typeof fetch;

const markdownCache = new Map<string, Promise<string>>();

export function clearVerifiedPluginMarkdownCache(): void {
  markdownCache.clear();
}

export async function fetchVerifiedPluginMarkdown(
  reference: PluginMarkdownReference,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  validateReference(reference);
  const cacheKey = referenceCacheKey(reference);
  let pending = markdownCache.get(cacheKey);
  if (!pending) {
    pending = fetchAndVerify(reference, fetchImpl).catch((error) => {
      markdownCache.delete(cacheKey);
      throw error;
    });
    markdownCache.set(cacheKey, pending);
  }
  return pending;
}

function validateReference(reference: PluginMarkdownReference): void {
  if (
    reference.mediaType !== "text/markdown" ||
    !Number.isInteger(reference.size) ||
    reference.size < 0 ||
    reference.size > MAX_PLUGIN_MARKDOWN_BYTES ||
    !/^[a-fA-F0-9]{64}$/.test(reference.sha256)
  ) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin Markdown reference is invalid or exceeds the supported size.",
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
        `Plugin Markdown ${label} URL must use HTTPS.`,
        { cause: error, details: { url: value } },
      );
    }
  }
}

async function fetchAndVerify(
  reference: PluginMarkdownReference,
  fetchImpl: FetchLike,
): Promise<string> {
  let response: Response;
  try {
    response = await fetchImpl(reference.url, {
      headers: { Accept: "text/markdown" },
    });
  } catch (error) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin Markdown request failed.",
      { cause: error, details: { url: reference.url } },
    );
  }
  if (!response.ok) {
    throw new PluginDistributionError(
      "metadata-invalid",
      `Plugin Markdown request failed with HTTP ${response.status}.`,
      { details: { url: reference.url, status: response.status } },
    );
  }
  const declaredLength = Number(response.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    (declaredLength !== reference.size ||
      declaredLength > MAX_PLUGIN_MARKDOWN_BYTES)
  ) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin Markdown response size does not match signed metadata.",
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
    bytes.byteLength > MAX_PLUGIN_MARKDOWN_BYTES
  ) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin Markdown bytes do not match the signed size.",
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
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    throw new PluginDistributionError(
      "metadata-invalid",
      "Plugin Markdown is not valid UTF-8.",
      { cause: error, details: { url: reference.url } },
    );
  }
}

function referenceCacheKey(reference: PluginMarkdownReference): string {
  return [
    reference.url,
    reference.sourceUrl,
    reference.sha256.toLowerCase(),
    reference.size,
    reference.mediaType,
  ].join("\u0000");
}
