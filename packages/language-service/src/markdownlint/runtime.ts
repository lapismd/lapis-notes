import type {
  LanguageServiceCodeAction,
  LanguageServiceDiagnostic,
  LanguageServiceRange,
  VirtualDocument,
} from "@lapis-notes/api/language-service";
import { applyFixes } from "markdownlint";
import { lint } from "markdownlint/sync";
import { createMarkdownlintLintOptions, MD018_RULE_ALIASES } from "./options";
import {
  markdownCodeActionsFromIssues,
  markdownDiagnosticsFromIssues,
  normalizeMarkdownlintDirectiveAliases,
} from "./runtime-core";

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

function getMarkdownLintIssues(
  document: VirtualDocument,
  rules?: Record<string, unknown>,
): MarkdownLintIssue[] {
  const text = normalizeMarkdownlintDirectiveAliases(
    document.text,
    MD018_RULE_ALIASES,
  );
  const result = lint({
    strings: { [document.uri]: text },
    ...createMarkdownlintLintOptions(rules),
  } as unknown as Parameters<typeof lint>[0]);
  return (result[document.uri] ?? []) as MarkdownLintIssue[];
}

export function markdownDiagnosticsForDocument(
  document: VirtualDocument,
  rules?: Record<string, unknown>,
): LanguageServiceDiagnostic[] {
  return markdownDiagnosticsFromIssues(getMarkdownLintIssues(document, rules));
}

export function markdownCodeActionsForDocument(
  document: VirtualDocument,
  requestedRange: LanguageServiceRange,
  rules?: Record<string, unknown>,
): LanguageServiceCodeAction[] {
  const issues = getMarkdownLintIssues(document, rules);
  return markdownCodeActionsFromIssues(
    document,
    requestedRange,
    issues,
    (issue) => applyFixes(document.text, [issue]),
    MD018_RULE_ALIASES,
  );
}
