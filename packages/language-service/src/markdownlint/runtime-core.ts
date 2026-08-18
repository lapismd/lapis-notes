import type {
  LanguageServiceCodeAction,
  LanguageServiceDiagnostic,
  LanguageServiceRange,
  VirtualDocument,
} from "@lapis-notes/api/language-service";

type MarkdownLintIssue = {
  lineNumber?: number;
  errorRange?: [number, number] | null;
  ruleNames?: string[];
  ruleName?: string;
  ruleDescription?: string;
  errorDetail?: string | null;
  errorContext?: string | null;
  fixInfo?: {
    lineNumber?: number;
    editColumn?: number;
    deleteCount?: number;
    insertText?: string;
  } | null;
};

export const MARKDOWN_LINT_DISABLE_RULE_COMMAND = "markdown-lint:disable-rule";

export function markdownlintActionTitle(
  kind: "fixThis" | "fixAll" | "disableLine" | "disableFile" | "disableVault",
  rulePath: string,
): string {
  switch (kind) {
    case "fixThis":
      return `Fix this violation of \`${rulePath}\``;
    case "fixAll":
      return `Fix all violations of \`${rulePath}\` in the document`;
    case "disableLine":
      return `Disable ${rulePath} for this line`;
    case "disableFile":
      return `Disable ${rulePath} for this file`;
    case "disableVault":
      return `Disable ${rulePath} in this vault`;
  }
}

export function markdownCodeActionsFromIssues(
  document: VirtualDocument,
  requestedRange: LanguageServiceRange,
  issues: MarkdownLintIssue[],
  applyFixesForIssues: (issues: MarkdownLintIssue[]) => string,
  md018RuleAliases: string[] = [],
): LanguageServiceCodeAction[] {
  const intersecting: Array<{
    issue: MarkdownLintIssue;
    diagnostic: LanguageServiceDiagnostic;
    code: string;
  }> = [];

  for (const issue of issues) {
    const diagnostic = toDiagnostic(issue);
    if (!rangesIntersect(diagnostic.range, requestedRange)) {
      continue;
    }
    intersecting.push({
      issue,
      diagnostic,
      code: diagnostic.code != null ? String(diagnostic.code) : "issue",
    });
  }

  const groups = new Map<string, typeof intersecting>();
  for (const entry of intersecting) {
    const group = groups.get(entry.code) ?? [];
    group.push(entry);
    groups.set(entry.code, group);
  }

  const actions: LanguageServiceCodeAction[] = [];
  for (const [code, group] of groups) {
    const diagnostics = group.map((entry) => entry.diagnostic);
    const rulePath = markdownlintRulePath(group[0].issue);

    for (const entry of group) {
      if (!entry.issue.fixInfo) continue;
      const updatedText = applyFixesForIssues([entry.issue]);
      const change = toSingleReplacement(document.text, updatedText);
      if (change) {
        actions.push({
          title: markdownlintActionTitle("fixThis", rulePath),
          kind: "quickfix",
          diagnostics: [entry.diagnostic],
          edit: { changes: [change] },
        });
      }
    }

    const documentFixable = issues.filter(
      (issue) =>
        (markdownlintDiagnosticCode(issue.ruleNames, issue.ruleName) ??
          "issue") === code && issue.fixInfo,
    );
    if (documentFixable.length > 1) {
      const updatedText = applyFixesForIssues(documentFixable);
      const change = toSingleReplacement(document.text, updatedText);
      if (change) {
        actions.push({
          title: markdownlintActionTitle("fixAll", rulePath),
          kind: "quickfix",
          diagnostics,
          edit: { changes: [change] },
        });
      }
    }

    if (code === "issue") {
      continue;
    }

    const ignoreNextLineChange = createIgnoreNextLineChange(
      document.text,
      group[0].diagnostic.range.start.line,
      code,
    );
    if (ignoreNextLineChange) {
      actions.push({
        title: markdownlintActionTitle("disableLine", rulePath),
        kind: "quickfix",
        diagnostics,
        edit: { changes: [ignoreNextLineChange] },
      });
    }

    const ignoreFileChange = createIgnoreFileChange(
      document.text,
      code,
      md018RuleAliases,
    );
    if (ignoreFileChange) {
      actions.push({
        title: markdownlintActionTitle("disableFile", rulePath),
        kind: "quickfix",
        diagnostics,
        edit: { changes: [ignoreFileChange] },
      });
    }

    actions.push({
      title: markdownlintActionTitle("disableVault", rulePath),
      kind: "quickfix",
      diagnostics,
      command: {
        id: MARKDOWN_LINT_DISABLE_RULE_COMMAND,
        arguments: [code],
      },
    });
  }

  return actions;
}

export function markdownDiagnosticsFromIssues(
  issues: MarkdownLintIssue[],
): LanguageServiceDiagnostic[] {
  return issues.map((issue) => toDiagnostic(issue));
}

export function markdownlintDiagnosticCode(
  ruleNames: string[] | undefined,
  ruleName: string | undefined,
): string | undefined {
  const code = ruleNames?.[0] ?? ruleName;
  if (code === "MD018-lapis" || code === "no-missing-space-atx-except-tags") {
    return "MD018";
  }
  return code;
}

function toDiagnostic(issue: MarkdownLintIssue): LanguageServiceDiagnostic {
  const startLine = Math.max(0, (issue.lineNumber ?? 1) - 1);
  const range = issue.errorRange;
  const startColumn = Math.max(0, range ? range[0] - 1 : 0);
  const length = Math.max(1, range ? range[1] : 1);
  return {
    range: {
      start: { line: startLine, character: startColumn },
      end: { line: startLine, character: startColumn + length },
    },
    source: "markdownlint",
    code: markdownlintDiagnosticCode(issue.ruleNames, issue.ruleName),
    severity: "warning",
    message: formatMarkdownlintMessage(issue),
  };
}

function markdownlintRulePath(issue: MarkdownLintIssue): string {
  const names = (
    issue.ruleNames ?? (issue.ruleName ? [issue.ruleName] : [])
  ).map((name) => (name === "MD018-lapis" ? "MD018" : name));
  const unique = [...new Set(names)];
  if (unique.length === 0) {
    return (
      markdownlintDiagnosticCode(issue.ruleNames, issue.ruleName) ?? "issue"
    );
  }
  return unique.join("/");
}

export function formatMarkdownlintMessage(issue: MarkdownLintIssue): string {
  const description = issue.ruleDescription?.trim();
  if (!description) {
    return issue.errorDetail ?? "Markdown lint issue";
  }
  const path = markdownlintRulePath(issue);
  const detail = issue.errorDetail?.trim();
  return detail
    ? `${path}: ${description} [${detail}]`
    : `${path}: ${description}`;
}

function createIgnoreNextLineChange(
  text: string,
  targetLine: number,
  code: string,
): { from: number; to: number; insert: string } | null {
  const lines = parseLines(text);
  if (
    targetLine < 0 ||
    targetLine >= lines.length ||
    isLineInsideLeadingYamlFrontmatter(text, targetLine)
  ) {
    return null;
  }

  const lineBreak = detectLineBreak(lines);
  const disableCodes = [code];
  if (
    firstContentLineIndex(text) === targetLine &&
    !disableCodes.includes("MD041")
  ) {
    disableCodes.push("MD041");
  }

  return {
    from: lines[targetLine].start,
    to: lines[targetLine].start,
    insert: `<!-- markdownlint-disable-next-line ${disableCodes.join(" ")} -->${lineBreak}`,
  };
}

function createIgnoreFileChange(
  text: string,
  code: string,
  md018RuleAliases: string[] = [],
): { from: number; to: number; insert: string } | null {
  const lines = parseLines(text);
  const lineBreak = detectLineBreak(lines);
  const targetLine = firstContentLineIndex(text);
  const disableCodes = [code];
  if (targetLine === 0 && !disableCodes.includes("MD041")) {
    disableCodes.push("MD041");
  }
  if (code === "MD018") {
    for (const alias of md018RuleAliases) {
      if (!disableCodes.includes(alias)) {
        disableCodes.push(alias);
      }
    }
  }

  if (targetLine === null) {
    const prefix =
      text.length === 0 || hasTrailingLineBreak(text) ? "" : lineBreak;
    return {
      from: text.length,
      to: text.length,
      insert: `${prefix}<!-- markdownlint-disable-file ${disableCodes.join(" ")} -->`,
    };
  }

  return {
    from: lines[targetLine].start,
    to: lines[targetLine].start,
    insert: `<!-- markdownlint-disable-file ${disableCodes.join(" ")} -->${lineBreak}`,
  };
}

export function isLineInsideLeadingYamlFrontmatter(
  text: string,
  lineIndex: number,
): boolean {
  const endLine = leadingYamlFrontmatterEndLine(text);
  return endLine !== null && lineIndex <= endLine;
}

export function firstContentLineIndex(text: string): number | null {
  const lines = parseLines(text);
  const frontmatterEndLine = leadingYamlFrontmatterEndLine(text);
  let index = frontmatterEndLine === null ? 0 : frontmatterEndLine + 1;
  while (index < lines.length && lines[index].text.trim().length === 0) {
    index += 1;
  }
  return index < lines.length ? index : null;
}

export function leadingYamlFrontmatterEndLine(text: string): number | null {
  const lines = parseLines(text);
  if (!lines.length || lines[0].text.trim() !== "---") {
    return null;
  }

  for (let index = 1; index < lines.length; index += 1) {
    const trimmed = lines[index].text.trim();
    if (trimmed === "---" || trimmed === "...") {
      return index;
    }
  }

  return lines.length - 1;
}

type ParsedLine = {
  text: string;
  start: number;
  end: number;
  fullEnd: number;
  newline: string;
};

function parseLines(text: string): ParsedLine[] {
  if (text.length === 0) {
    return [{ text: "", start: 0, end: 0, fullEnd: 0, newline: "" }];
  }

  const lines: ParsedLine[] = [];
  let start = 0;
  while (start <= text.length) {
    let end = start;
    while (end < text.length && text[end] !== "\n" && text[end] !== "\r") {
      end += 1;
    }

    let fullEnd = end;
    if (fullEnd < text.length) {
      if (text[fullEnd] === "\r" && text[fullEnd + 1] === "\n") {
        fullEnd += 2;
      } else {
        fullEnd += 1;
      }
    }

    lines.push({
      text: text.slice(start, end),
      start,
      end,
      fullEnd,
      newline: text.slice(end, fullEnd),
    });

    if (fullEnd >= text.length) {
      break;
    }
    start = fullEnd;
  }

  return lines;
}

function detectLineBreak(lines: ParsedLine[]): string {
  for (const line of lines) {
    if (line.newline) {
      return line.newline;
    }
  }
  return "\n";
}

function hasTrailingLineBreak(text: string): boolean {
  return /(?:\r\n|\n|\r)$/u.test(text);
}

export function normalizeMarkdownlintDirectiveAliases(
  text: string,
  md018RuleAliases: string[] = [],
): string {
  return text.replace(
    /<!--\s*(markdownlint-[a-z-]+)(\s+[^>]*)?-->/gu,
    (match, directive, rawRules = "") => {
      const rules = rawRules.trim().split(/\s+/u).filter(Boolean);
      if (!rules.includes("MD018")) {
        return match;
      }

      const expandedRules = [...rules];
      for (const alias of md018RuleAliases) {
        if (!expandedRules.includes(alias)) {
          expandedRules.push(alias);
        }
      }

      return `<!-- ${directive} ${expandedRules.join(" ")} -->`;
    },
  );
}

function rangesIntersect(
  left: LanguageServiceRange,
  right: LanguageServiceRange,
): boolean {
  return (
    comparePositions(left.start, right.end) <= 0 &&
    comparePositions(right.start, left.end) <= 0
  );
}

function comparePositions(
  left: LanguageServiceRange["start"],
  right: LanguageServiceRange["start"],
): number {
  if (left.line !== right.line) {
    return left.line - right.line;
  }
  return left.character - right.character;
}

export function toSingleReplacement(
  before: string,
  after: string,
): { from: number; to: number; insert: string } | null {
  if (before === after) {
    return null;
  }

  let start = 0;
  while (
    start < before.length &&
    start < after.length &&
    before[start] === after[start]
  ) {
    start += 1;
  }

  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (
    beforeEnd > start &&
    afterEnd > start &&
    before[beforeEnd - 1] === after[afterEnd - 1]
  ) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }

  return {
    from: start,
    to: beforeEnd,
    insert: after.slice(start, afterEnd),
  };
}
