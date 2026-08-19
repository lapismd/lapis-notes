import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

type Pos = {
  start: { line: number; col: number; offset: number };
  end: { line: number; col: number; offset: number };
};

type CachedMetadata = {
  frontmatter?: Record<string, unknown>;
  frontmatterPosition?: Pos;
  headings?: Array<{ heading: string; level: number; position: Pos }>;
  links?: Array<{
    link: string;
    original: string;
    displayText: string;
    position: Pos;
    heading?: string;
  }>;
  tags?: Array<{ tag: string; position: Pos }>;
};

function posForMatch(
  data: string,
  startOffset: number,
  endOffset: number,
): Pos {
  const before = data.slice(0, startOffset);
  const startLine = before.split("\n").length - 1;
  const startCol = startOffset - (before.lastIndexOf("\n") + 1);
  const matched = data.slice(startOffset, endOffset);
  const matchedLines = matched.split("\n");
  const endLine = startLine + matchedLines.length - 1;
  const endCol =
    matchedLines.length === 1
      ? startCol + matched.length
      : matchedLines[matchedLines.length - 1]!.length;
  return {
    start: { line: startLine, col: startCol, offset: startOffset },
    end: { line: endLine, col: endCol, offset: endOffset },
  };
}

function decodeFrontMatter(block: string): Record<string, unknown> {
  try {
    const parsed = parseYaml(block);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Fall through to empty front matter on invalid YAML.
  }
  return {};
}

function encodeFrontMatter(data: Record<string, unknown>): string {
  return stringifyYaml(data, { lineWidth: 0 });
}

/**
 * Lightweight markdown metadata extract for this intake slice.
 * Production parse posts this function to a worker; tests and
 * worker-unavailable hosts call it on the current thread.
 */
export function extractMetadata(data: string): CachedMetadata {
  const cache: CachedMetadata = {};

  const fm = data.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  let bodyStart = 0;
  if (fm) {
    const block = fm[1] ?? "";
    cache.frontmatter = decodeFrontMatter(block);
    cache.frontmatterPosition = posForMatch(data, 0, fm[0]!.length);
    bodyStart = fm[0]!.length;
  }

  const body = data.slice(bodyStart);
  const lines = body.split("\n");
  let offset = bodyStart;
  let currentHeading: string | undefined;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]!;
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      currentHeading = heading[2]!.trim();
      cache.headings ||= [];
      cache.headings.push({
        heading: currentHeading,
        level: heading[1]!.length,
        position: posForMatch(data, offset, offset + line.length),
      });
    }

    const wikiRe = /\[\[([^\]]+)\]\]/g;
    for (const match of line.matchAll(wikiRe)) {
      const link = match[1] ?? "";
      const absoluteIndex = offset + (match.index ?? 0);
      const display = link.includes("|") ? link.split("|")[1]! : link;
      cache.links ||= [];
      cache.links.push({
        link,
        original: match[0]!,
        displayText: display,
        position: posForMatch(
          data,
          absoluteIndex,
          absoluteIndex + match[0]!.length,
        ),
        heading: currentHeading,
      });
    }

    const mdRe = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
    for (const match of line.matchAll(mdRe)) {
      const display = match[1] ?? "";
      const href = match[2] ?? "";
      const absoluteIndex = offset + (match.index ?? 0);
      cache.links ||= [];
      cache.links.push({
        link: href,
        original: match[0]!,
        displayText: display,
        position: posForMatch(
          data,
          absoluteIndex,
          absoluteIndex + match[0]!.length,
        ),
        heading: currentHeading,
      });
    }

    for (const match of line.matchAll(/(^|[\s([{])#([\w/-]+)/g)) {
      const tag = `#${match[2]}`;
      const absoluteIndex = offset + (match.index ?? 0) + (match[1]?.length ?? 0);
      cache.tags ||= [];
      cache.tags.push({
        tag,
        position: posForMatch(data, absoluteIndex, absoluteIndex + tag.length),
      });
    }

    offset += line.length + 1;
  }

  return cache;
}

export function writeFrontmatter(data: Record<string, unknown>): string {
  return encodeFrontMatter(data);
}
