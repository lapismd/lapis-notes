type FetchLike = typeof fetch;

const readmeCache = new Map<string, Promise<string>>();

export type PluginReadmeLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; url: string; markdown: string }
  | { status: "missing" }
  | { status: "error"; message: string };

export function clearPluginReadmeCache(): void {
  readmeCache.clear();
}

export async function fetchPluginReadmeMarkdown(
  url: string,
  options: { pluginId: string; detailUrl: string },
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const artifactUrl = buildPluginReadmeMarkdownUrl(url, options);
  let cached = readmeCache.get(artifactUrl);
  if (!cached) {
    cached = fetchMarkdown(artifactUrl, fetchImpl).then((markdown) =>
      resolveReadmeRelativeUrls(markdown, artifactUrl),
    );
    readmeCache.set(artifactUrl, cached);
  }
  return cached;
}

export function buildPluginReadmeMarkdownUrl(
  _readmeUrl: string,
  options: { pluginId: string; detailUrl: string },
): string {
  return new URL(
    `../readmes/${encodeURIComponent(options.pluginId)}/README.md`,
    options.detailUrl,
  ).toString();
}

export function resolveReadmeRelativeUrls(
  markdown: string,
  readmeUrl: string,
): string {
  return markdown.replace(
    /(!?\[[^\]]*\]\()(<)?(?![a-z][a-z0-9+.-]*:|\/\/|\/)([^)\s>]+)(>)?([^)]*\))/gi,
    (
      match,
      prefix: string,
      openingAngle: string | undefined,
      target: string,
      closingAngle: string | undefined,
      suffix: string,
    ) => {
      try {
        const resolved = new URL(target, readmeUrl).toString();
        return `${prefix}${openingAngle ?? ""}${resolved}${closingAngle ?? ""}${suffix}`;
      } catch {
        return match;
      }
    },
  );
}

async function fetchMarkdown(
  url: string,
  fetchImpl: FetchLike,
): Promise<string> {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`README request failed with HTTP ${response.status}`);
  }
  return response.text();
}
