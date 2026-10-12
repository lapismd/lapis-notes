import { registryReleaseChangelogSchema } from "./catalog-v1.js";

export function registryChangelogFromMarkdown(
  name: string,
  version: string,
  markdown: string,
  override?: unknown,
) {
  if (override !== undefined)
    return registryReleaseChangelogSchema.parse(override);
  const lines = markdown.split(/\r?\n/u);
  const start = lines.findIndex((line) => {
    const heading = /^##\s+\[?v?([^\]\s]+)\]?/u.exec(line);
    return heading?.[1] === version;
  });
  if (start < 0) return undefined;
  const end = lines.findIndex(
    (line, index) => index > start && /^##\s/u.test(line),
  );
  const description = lines
    .slice(start + 1, end < 0 ? undefined : end)
    .join("\n")
    .trim();
  return registryReleaseChangelogSchema.parse({
    title: `${name} ${version}`,
    ...(description ? { description } : {}),
  });
}
