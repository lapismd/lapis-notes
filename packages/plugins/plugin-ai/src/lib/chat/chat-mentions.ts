import { isLapisInternalPath } from "@lapis-notes/api/path";

export type VaultFileRef = {
  path: string;
  name: string;
};

const TRAILING_MENTION_PATTERN = /(^|\s)@(?:"([^"]*)"|([^\s"]*))$/;
const MENTION_PATTERN = /(^|\s)@(?:"([^"]+)"|([^\s]+))/g;

export function normalizeMentionPath(path: string): string {
  const normalized = path.trim().replaceAll("\\", "/");
  return normalized.startsWith("./") ? normalized.slice(2) : normalized;
}

export function formatFileMention(path: string): string {
  const normalized = normalizeMentionPath(path);
  return /\s/.test(normalized)
    ? `@"${normalized.replaceAll('"', '\\"')}"`
    : `@${normalized}`;
}

export function extractMentionQuery(input: string): string | null {
  const match = TRAILING_MENTION_PATTERN.exec(input);
  if (!match) return null;
  return (match[2] ?? match[3] ?? "").trim();
}

export function extractMentionPaths(input: string): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();
  for (const match of input.matchAll(MENTION_PATTERN)) {
    const path = normalizeMentionPath((match[2] ?? match[3] ?? "").trim());
    if (!path || seen.has(path)) continue;
    seen.add(path);
    paths.push(path);
  }
  return paths;
}

export function mergeAttachmentPaths(
  ...lists: Array<Iterable<string> | undefined>
): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const list of lists) {
    if (!list) continue;
    for (const raw of list) {
      const path = normalizeMentionPath(raw);
      if (!path || seen.has(path)) continue;
      seen.add(path);
      paths.push(path);
    }
  }
  return paths;
}

export function mentionTokensFromText(text: string): Array<{
  value: string;
  label: string;
  variant: "secondary";
}> {
  return extractMentionPaths(text).map((path) => ({
    value: formatFileMention(path),
    label: path,
    variant: "secondary",
  }));
}

export function searchVaultFiles(
  files: Iterable<VaultFileRef>,
  query: string,
  limit = 20,
): VaultFileRef[] {
  const needle = query.trim().toLowerCase();
  const matches: VaultFileRef[] = [];
  for (const file of files) {
    const path = normalizeMentionPath(file.path);
    if (
      !path ||
      path.startsWith("..") ||
      path.includes("://") ||
      isLapisInternalPath(path)
    ) {
      continue;
    }
    const name = file.name || path.split("/").at(-1) || path;
    if (
      needle &&
      !path.toLowerCase().includes(needle) &&
      !name.toLowerCase().includes(needle)
    ) {
      continue;
    }
    matches.push({ path, name });
    if (matches.length >= limit) break;
  }
  return matches;
}
