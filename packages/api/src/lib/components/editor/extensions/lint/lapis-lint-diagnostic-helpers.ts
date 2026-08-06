export interface LapisLintDiagnosticMeta {
  code?: string | number;
  ruleId?: string;
  ruleUrl?: string;
  sourceLabel?: string;
}

const DEFAULT_MARKDOWNLINT_RULE_URL_TEMPLATE =
  "https://github.com/DavidAnson/markdownlint/blob/main/doc/{rule}.md";

/** Build a markdownlint documentation URL for a rule code such as `MD041`. */
export function markdownlintRuleUrl(
  code: string | number,
  template: string = DEFAULT_MARKDOWNLINT_RULE_URL_TEMPLATE,
): string {
  const raw = String(code);
  const rule = /^MD(\d+)$/i.test(raw) ? `md${raw.slice(2)}` : raw.toLowerCase();
  return template.replace("{rule}", rule);
}
