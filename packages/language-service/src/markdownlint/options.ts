/**
 * Lowercase-first Lapis tag at line start (whole line or prefix before
 * whitespace).
 */
export const TAG_PREFIX_PATTERN = /^( {0,3})#([a-z][a-z0-9_/-]*)(?:$|\s)/u;

/** ATX heading missing a space after the hash run (same shape as stock MD018). */
export const BAD_ATX_HEADING_PATTERN = /^( {0,3})(#{1,6})([^#\s].*)$/u;
export const MD018_RULE_ALIASES = [
  "MD018-lapis",
  "no-missing-space-atx-except-tags",
];

const md018AllowTagsRule = {
  names: MD018_RULE_ALIASES,
  description:
    "No space after hash on atx style heading, except lowercase Lapis tag lines",
  tags: ["atx", "headings", "spaces"],
  parser: "none" as const,
  function: (
    params: { lines: readonly string[] },
    onError: (error: {
      lineNumber: number;
      detail?: string;
      context?: string;
      fixInfo?: {
        editColumn?: number;
        insertText?: string;
      };
    }) => void,
  ) => {
    params.lines.forEach((line, index) => {
      if (TAG_PREFIX_PATTERN.test(line)) {
        return;
      }

      const match = BAD_ATX_HEADING_PATTERN.exec(line);
      if (!match) {
        return;
      }

      const indent = match[1] ?? "";
      const hashes = match[2] ?? "";

      onError({
        lineNumber: index + 1,
        detail: "Expected: space; Actual: no space",
        context: line,
        fixInfo: {
          editColumn: indent.length + hashes.length + 1,
          insertText: " ",
        },
      });
    });
  },
};

export const LAPIS_MARKDOWNLINT_DEFAULT_CONFIG = {
  default: true,
  MD013: false,
  MD018: false,
} as const;

export function createMarkdownlintLintOptions(
  rules?: Record<string, unknown>,
): {
  config: Record<string, unknown>;
  customRules: [typeof md018AllowTagsRule];
} {
  const config: Record<string, unknown> = {
    ...LAPIS_MARKDOWNLINT_DEFAULT_CONFIG,
    ...(rules ?? {}),
  };
  if (rules?.MD018 === false) {
    config["MD018-lapis"] = false;
    config["no-missing-space-atx-except-tags"] = false;
  }

  return {
    config,
    customRules: [md018AllowTagsRule],
  };
}
