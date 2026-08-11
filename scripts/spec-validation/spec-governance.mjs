import path from "node:path";

import {
  diagnostic,
  NORMATIVE_PATTERN,
  REQUIREMENT_REFERENCE_PATTERN,
  splitMarkdownTableRow,
  withoutFencedCode,
} from "./lib/spec-model.mjs";

export const name = "spec-governance";

function lineForOffset(source, offset) {
  return source.slice(0, offset).split(/\r?\n/).length;
}

function referenceFiles(context) {
  const extras = ["AGENTS.md", "MIGRATION.md"]
    .map((relativePath) => ({
      relativePath,
      absolutePath: path.join(context.model.repoRoot, relativePath),
    }))
    .filter((file) => context.readOptional(file.absolutePath) !== null)
    .map((file) => ({
      relativePath: file.relativePath,
      source: context.readOptional(file.absolutePath),
    }));
  return [...context.model.files, ...extras];
}

function validateChangeMap(context) {
  const file = context.model.canonicalFiles.find(
    (candidate) => candidate.chapterPath === "spec-governance.md",
  );
  if (!file) return [];
  const lines = file.source.split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+Change map\s*$/.test(line));
  if (start < 0) return [];
  const seen = new Map();
  const findings = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) break;
    const cells = splitMarkdownTableRow(lines[index]);
    if (!cells || cells.length !== 2 || cells[0] === "Protected area") continue;
    if (/^-+$/.test(cells[0].replaceAll(" ", ""))) continue;
    const key = cells[0].replace(/`/g, "").trim().toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, index + 1);
      continue;
    }
    findings.push(
      diagnostic({
        code: "SPEC-GOV-MAP-DUPLICATE",
        rule: "LN-GOV-017",
        file: file.relativePath,
        line: index + 1,
        message: `change-map area duplicates line ${seen.get(key)}: ${cells[0]}`,
      }),
    );
  }
  return findings;
}

export function validate(context) {
  const findings = [];
  for (const parsed of context.model.parsedRequirements) {
    for (const row of parsed.malformedRows) {
      findings.push(
        diagnostic({
          code: "SPEC-REQ-TABLE",
          rule: "LN-GOV-017",
          file: parsed.file.relativePath,
          line: row.lineNumber,
          message: row.reason,
        }),
      );
    }
  }

  for (const definition of context.model.definitions) {
    if (!definition.validId) {
      findings.push(
        diagnostic({
          code: "SPEC-REQ-ID",
          rule: "LN-GOV-002",
          file: definition.file,
          line: definition.line,
          subject: definition.id,
          message: "requirement ID must match LN-<AREA>-<three digits>",
        }),
      );
    }
    if (!NORMATIVE_PATTERN.test(definition.statement)) {
      findings.push(
        diagnostic({
          code: "SPEC-REQ-NORMATIVE",
          rule: "LN-GOV-010",
          file: definition.file,
          line: definition.line,
          subject: definition.id,
          message: "requirement statement needs a normative keyword",
        }),
      );
    }
    if (definition.words > 80) {
      findings.push(
        diagnostic({
          code: "SPEC-REQ-WORDS",
          rule: "LN-GOV-015",
          file: definition.file,
          line: definition.line,
          subject: definition.id,
          message: `${definition.words} words; maximum 80`,
        }),
      );
    }
    if (definition.sentences > 4) {
      findings.push(
        diagnostic({
          code: "SPEC-REQ-SENTENCES",
          rule: "LN-GOV-015",
          file: definition.file,
          line: definition.line,
          subject: definition.id,
          message: `${definition.sentences} sentences; maximum 4`,
        }),
      );
    }
  }

  for (const [id, definitions] of context.model.definitionsById) {
    if (definitions.length < 2) continue;
    for (const definition of definitions) {
      findings.push(
        diagnostic({
          code: "SPEC-REQ-DUPLICATE",
          rule: "LN-GOV-002",
          file: definition.file,
          line: definition.line,
          subject: id,
          message: `requirement ID is defined ${definitions.length} times`,
        }),
      );
    }
  }

  const sectionsById = Map.groupBy(
    context.model.acceptanceSections,
    (section) => section.id,
  );
  for (const section of context.model.acceptanceSections) {
    const definitions = context.model.definitionsById.get(section.id) ?? [];
    if (
      definitions.length !== 1 ||
      definitions[0].file !== section.file ||
      (sectionsById.get(section.id)?.length ?? 0) !== 1
    ) {
      findings.push(
        diagnostic({
          code: "SPEC-REQ-DETAILS-ID",
          rule: "LN-GOV-016",
          file: section.file,
          line: section.line,
          subject: section.id,
          message:
            "acceptance details must appear once in the chapter that defines the ID",
        }),
      );
    }
    if (!section.introduction || section.bullets.length < 3) {
      findings.push(
        diagnostic({
          code: "SPEC-REQ-DETAILS-LIST",
          rule: "LN-GOV-016",
          file: section.file,
          line: section.line,
          subject: section.id,
          message:
            "acceptance details need an introduction and at least three bullets",
        }),
      );
    }
    for (const bullet of section.bullets) {
      if (bullet.words > 80) {
        findings.push(
          diagnostic({
            code: "SPEC-REQ-WORDS",
            rule: "LN-GOV-015",
            file: section.file,
            line: bullet.line,
            subject: section.id,
            message: `${bullet.words} words; maximum 80`,
          }),
        );
      }
      if (bullet.sentences > 4) {
        findings.push(
          diagnostic({
            code: "SPEC-REQ-SENTENCES",
            rule: "LN-GOV-015",
            file: section.file,
            line: bullet.line,
            subject: section.id,
            message: `${bullet.sentences} sentences; maximum 4`,
          }),
        );
      }
    }
  }

  for (const file of referenceFiles(context)) {
    const source = withoutFencedCode(file.source);
    for (const match of source.matchAll(REQUIREMENT_REFERENCE_PATTERN)) {
      if (context.model.definitionsById.has(match[0])) continue;
      findings.push(
        diagnostic({
          code: "SPEC-REQ-UNKNOWN",
          rule: "LN-GOV-017",
          file: file.relativePath,
          line: lineForOffset(source, match.index),
          subject: match[0],
          message: "requirement reference has no definition",
        }),
      );
    }
  }

  findings.push(...validateChangeMap(context));
  return findings;
}
