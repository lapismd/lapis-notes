import {
  diagnostic,
  REQUIREMENT_ID_PATTERN,
  splitMarkdownTableRow,
} from "./lib/spec-model.mjs";

export const name = "verification";
const ALLOWED_STATUSES = new Set(["Implemented", "In progress", "Partial"]);

function parseVerification(file) {
  const rows = [];
  const malformed = [];
  for (const [index, line] of file.source.split(/\r?\n/).entries()) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = splitMarkdownTableRow(line);
    if (
      cells?.[0] === "ID" ||
      (cells?.[0] && /^:?-+:?$/.test(cells[0].replaceAll(" ", "")))
    ) {
      continue;
    }
    if (!cells || cells.length !== 4 || !REQUIREMENT_ID_PATTERN.test(cells[0])) {
      malformed.push({ line: index + 1 });
      continue;
    }
    rows.push({
      id: cells[0],
      chapter: cells[1],
      status: cells[2],
      evidence: cells[3],
      line: index + 1,
    });
  }
  return { rows, malformed };
}

export function validate(context) {
  const findings = [];
  const file = context.model.files.find(
    (candidate) => candidate.chapterPath === "verification.md",
  );
  if (!file) {
    findings.push(
      diagnostic({
        code: "SPEC-VERIFY-MISSING",
        rule: "LN-GOV-002",
        file: "spec/src/verification.md",
        message: "verification matrix is missing",
      }),
    );
    return findings;
  }

  const { rows, malformed } = parseVerification(file);
  for (const entry of malformed) {
    findings.push(
      diagnostic({
        code: "SPEC-VERIFY-TABLE",
        rule: "LN-GOV-017",
        file: file.relativePath,
        line: entry.line,
        message: "verification row must contain ID, chapter, status, and evidence",
      }),
    );
  }
  const rowsById = Map.groupBy(rows, (row) => row.id);
  for (const definition of context.model.definitions) {
    const count = rowsById.get(definition.id)?.length ?? 0;
    if (count === 1) continue;
    findings.push(
      diagnostic({
        code: count === 0 ? "SPEC-VERIFY-UNMAPPED" : "SPEC-VERIFY-DUPLICATE",
        rule: "LN-GOV-002",
        file: definition.file,
        line: definition.line,
        subject: definition.id,
        message:
          count === 0
            ? "requirement has no verification row"
            : `requirement has ${count} verification rows`,
      }),
    );
  }
  for (const row of rows) {
    if (!context.model.definitionsById.has(row.id)) {
      findings.push(
        diagnostic({
          code: "SPEC-VERIFY-ORPHAN",
          rule: "LN-GOV-002",
          file: file.relativePath,
          line: row.line,
          subject: row.id,
          message: "verification row has no requirement definition",
        }),
      );
    }
    if (!row.chapter || !row.evidence) {
      findings.push(
        diagnostic({
          code: "SPEC-VERIFY-EVIDENCE",
          rule: "LN-GOV-017",
          file: file.relativePath,
          line: row.line,
          subject: row.id,
          message: "chapter and evidence cells must both be non-empty",
        }),
      );
    }
    if (!ALLOWED_STATUSES.has(row.status)) {
      findings.push(
        diagnostic({
          code: "SPEC-VERIFY-STATUS",
          rule: "LN-GOV-017",
          file: file.relativePath,
          line: row.line,
          subject: row.id,
          message: `unsupported status: ${row.status || "(empty)"}`,
        }),
      );
    }
  }
  return findings;
}
