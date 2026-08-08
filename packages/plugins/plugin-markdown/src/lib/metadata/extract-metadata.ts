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

function parseScalar(raw: string): unknown {
  const value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~" || value === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((part) => String(parseScalar(part)))
      .filter((part) => part.length > 0);
  }
  return value;
}

function decodeFrontMatter(block: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = block.split("\n");
  let index = 0;
  while (index < lines.length) {
    const line = lines[index]!;
    if (!line.trim() || line.trimStart().startsWith("#")) {
      index += 1;
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!match) {
      index += 1;
      continue;
    }
    const key = match[1]!;
    const rest = match[2] ?? "";
    if (rest.length === 0) {
      const items: string[] = [];
      let cursor = index + 1;
      while (cursor < lines.length) {
        const nested = lines[cursor]!;
        const item = nested.match(/^\s+-\s+(.*)$/);
        if (!item) break;
        items.push(String(parseScalar(item[1] ?? "")));
        cursor += 1;
      }
      if (items.length > 0) {
        result[key] = items;
        index = cursor;
        continue;
      }
      result[key] = null;
      index += 1;
      continue;
    }
    result[key] = parseScalar(rest);
    index += 1;
  }
  return result;
}

function encodeFrontMatter(data: Record<string, unknown>): string {
  const lines = Object.entries(data).map(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return `${key}: []`;
      return [`${key}:`, ...value.map((item) => `  - ${String(item)}`)].join(
        "\n",
      );
    }
    if (value === null || value === undefined) return `${key}:`;
    if (typeof value === "string" && /[:#\n]/.test(value)) {
      return `${key}: "${value.replaceAll('"', '\\"')}"`;
    }
    return `${key}: ${String(value)}`;
  });
  return `${lines.join("\n")}\n`;
}

/**
 * Lightweight markdown metadata extract for this intake slice.
 * Full-repo remark/worker pipeline remains deferred in PARITY.md.
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
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]!;
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      cache.headings ||= [];
      cache.headings.push({
        heading: heading[2]!.trim(),
        level: heading[1]!.length,
        position: posForMatch(data, offset, offset + line.length),
      });
    }
    offset += line.length + 1;
  }

  for (const match of body.matchAll(/\[\[([^\]]+)\]\]/g)) {
    const link = match[1] ?? "";
    const absoluteIndex = bodyStart + (match.index ?? 0);
    const display = link.includes("|") ? link.split("|")[1]! : link;
    cache.links ||= [];
    cache.links.push({
      link,
      original: match[0]!,
      displayText: display,
      position: posForMatch(data, absoluteIndex, absoluteIndex + match[0]!.length),
    });
  }

  for (const match of body.matchAll(/(^|[\s([{])#([\w/-]+)/g)) {
    const tag = `#${match[2]}`;
    const absoluteIndex =
      bodyStart + (match.index ?? 0) + (match[1]?.length ?? 0);
    cache.tags ||= [];
    cache.tags.push({
      tag,
      position: posForMatch(data, absoluteIndex, absoluteIndex + tag.length),
    });
  }

  return cache;
}

export function writeFrontmatter(data: Record<string, unknown>): string {
  return encodeFrontMatter(data);
}
