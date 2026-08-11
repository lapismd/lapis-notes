import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export const REQUIREMENT_ID_PATTERN = /^LN-[A-Z]+-\d{3}$/;
export const REQUIREMENT_REFERENCE_PATTERN = /\bLN-[A-Z]+-\d{3}\b/g;
export const NORMATIVE_PATTERN = /\b(?:MUST|MUST NOT|SHOULD|SHOULD NOT|MAY)\b/;

export function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

export function relativePath(repoRoot, absolutePath) {
  return toPosix(path.relative(repoRoot, absolutePath));
}

function markdownFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return markdownFiles(absolutePath);
      if (!entry.isFile() || !entry.name.endsWith(".md")) return [];
      return [absolutePath];
    })
    .sort((left, right) => left.localeCompare(right));
}

export function splitMarkdownTableRow(line) {
  const source = line.trim();
  if (!source.startsWith("|") || !source.endsWith("|")) return null;

  const cells = [];
  let current = "";
  let escaped = false;
  let codeDelimiter = 0;
  for (let index = 1; index < source.length - 1; index += 1) {
    const character = source[index];
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\") {
      current += character;
      escaped = true;
      continue;
    }
    if (character === "`") {
      let runLength = 1;
      while (source[index + runLength] === "`") runLength += 1;
      if (codeDelimiter === 0) codeDelimiter = runLength;
      else if (codeDelimiter === runLength) codeDelimiter = 0;
      current += "`".repeat(runLength);
      index += runLength - 1;
      continue;
    }
    if (character === "|" && codeDelimiter === 0) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  cells.push(current.trim());
  return cells;
}

export function markdownToProse(source) {
  return source
    .replace(/!\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/`+([^`]+)`+/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_~>#]/g, " ")
    .replace(/\\([\\`*{}\[\]()#+.!|_-])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function proseMetrics(source) {
  const prose = markdownToProse(source);
  const words = prose.match(/[\p{L}\p{N}]+(?:['’/-][\p{L}\p{N}]+)*/gu) ?? [];
  const sentences = prose.match(/[.!?]+(?=\s|$)/g) ?? [];
  return { prose, words: words.length, sentences: sentences.length };
}

export function withoutFencedCode(source) {
  let fenced = false;
  return source
    .split(/\r?\n/)
    .map((line) => {
      if (/^\s*```/.test(line)) {
        fenced = !fenced;
        return "";
      }
      return fenced ? "" : line;
    })
    .join("\n");
}

function requirementSection(lines) {
  const start = lines.findIndex((line) => /^##\s+Requirements\s*$/.test(line));
  if (start < 0) return [];
  const endOffset = lines
    .slice(start + 1)
    .findIndex((line) => /^##\s+/.test(line));
  const end = endOffset < 0 ? lines.length : start + 1 + endOffset;
  return lines.slice(start + 1, end).map((line, index) => ({
    line,
    lineNumber: start + index + 2,
  }));
}

export function parseRequirementFile(file) {
  const lines = file.source.split(/\r?\n/);
  const definitions = [];
  const malformedRows = [];
  for (const entry of requirementSection(lines)) {
    if (!/^\s*\|/.test(entry.line)) continue;
    const cells = splitMarkdownTableRow(entry.line);
    if (!cells || cells.length !== 2) {
      malformedRows.push({ ...entry, reason: "expected exactly two table cells" });
      continue;
    }
    const [id, statement] = cells;
    if (id === "ID" || /^:?-+:?$/.test(id.replaceAll(" ", ""))) continue;
    definitions.push({
      id,
      statement,
      file: file.relativePath,
      line: entry.lineNumber,
      validId: REQUIREMENT_ID_PATTERN.test(id),
      ...proseMetrics(statement),
    });
  }
  return { definitions, malformedRows };
}

function acceptanceSectionEnd(lines, start) {
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^#{1,3}\s+/.test(lines[index])) return index;
  }
  return lines.length;
}

export function parseAcceptanceSections(file) {
  const lines = file.source.split(/\r?\n/);
  const sections = [];
  let fenced = false;
  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*```/.test(lines[index])) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const match = /^###\s+(LN-[A-Z]+-\d{3}) acceptance details\s*$/.exec(
      lines[index],
    );
    if (!match) continue;
    const end = acceptanceSectionEnd(lines, index);
    const body = lines.slice(index + 1, end);
    const firstBullet = body.findIndex((line) => /^-\s+/.test(line));
    const introduction = body
      .slice(0, firstBullet < 0 ? body.length : firstBullet)
      .some((line) => line.trim().length > 0);
    const bullets = [];
    for (let bodyIndex = 0; bodyIndex < body.length; bodyIndex += 1) {
      if (!/^-\s+/.test(body[bodyIndex])) continue;
      const startLine = index + bodyIndex + 2;
      const parts = [body[bodyIndex].replace(/^-\s+/, "")];
      while (
        bodyIndex + 1 < body.length &&
        !/^-\s+/.test(body[bodyIndex + 1]) &&
        !/^#{1,3}\s+/.test(body[bodyIndex + 1])
      ) {
        bodyIndex += 1;
        if (body[bodyIndex].trim()) parts.push(body[bodyIndex].trim());
      }
      const statement = parts.join(" ");
      bullets.push({
        statement,
        line: startLine,
        ...proseMetrics(statement),
      });
    }
    sections.push({
      id: match[1],
      file: file.relativePath,
      line: index + 1,
      introduction,
      bullets,
    });
  }
  return sections;
}

export function localMarkdownTargets(source) {
  const targets = [];
  for (const match of source.matchAll(/\[[^\]]*]\(([^)]+)\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, "");
    if (/^(?:https?:|mailto:|#|\?)/.test(target)) continue;
    targets.push(target);
  }
  return targets;
}

export function createSpecModel(repoRoot) {
  const sourceDirectory = path.join(repoRoot, "spec", "src");
  const files = markdownFiles(sourceDirectory).map((absolutePath) => ({
    absolutePath,
    relativePath: relativePath(repoRoot, absolutePath),
    chapterPath: toPosix(path.relative(sourceDirectory, absolutePath)),
    source: readFileSync(absolutePath, "utf8"),
  }));
  const canonicalFiles = files.filter(
    (file) => !["SUMMARY.md", "verification.md"].includes(file.chapterPath),
  );
  const parsedRequirements = canonicalFiles.map((file) => ({
    file,
    ...parseRequirementFile(file),
  }));
  const definitions = parsedRequirements.flatMap((entry) => entry.definitions);
  const acceptanceSections = canonicalFiles.flatMap(parseAcceptanceSections);
  return {
    repoRoot,
    sourceDirectory,
    files,
    canonicalFiles,
    parsedRequirements,
    definitions,
    acceptanceSections,
    definitionsById: Map.groupBy(definitions, (definition) => definition.id),
  };
}

export function diagnostic({ code, rule, file, line = 1, subject, message }) {
  return { code, rule, file, line, subject, message };
}

export function compareDiagnostics(left, right) {
  return (
    left.file.localeCompare(right.file) ||
    left.line - right.line ||
    left.code.localeCompare(right.code) ||
    (left.subject ?? "").localeCompare(right.subject ?? "") ||
    left.message.localeCompare(right.message)
  );
}

export function formatDiagnostic(finding) {
  const subject = finding.subject ? ` ${finding.subject}` : "";
  return `[${finding.code}] [${finding.rule}] ${finding.file}:${finding.line}${subject}: ${finding.message}`;
}
