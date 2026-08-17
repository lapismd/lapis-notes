export interface MarkdownLintRuleOption {
  id: string;
  alias: string;
  title: string;
}

export const MARKDOWN_LINT_RULES: readonly MarkdownLintRuleOption[] = [
  {
    id: "MD001",
    alias: "heading-increment",
    title: "Heading levels should only increment by one level at a time",
  },
  { id: "MD003", alias: "heading-style", title: "Heading style" },
  { id: "MD004", alias: "ul-style", title: "Unordered list style" },
  {
    id: "MD005",
    alias: "list-indent",
    title: "Inconsistent indentation for list items at the same level",
  },
  { id: "MD007", alias: "ul-indent", title: "Unordered list indentation" },
  { id: "MD009", alias: "no-trailing-spaces", title: "Trailing spaces" },
  { id: "MD010", alias: "no-hard-tabs", title: "Hard tabs" },
  { id: "MD011", alias: "no-reversed-links", title: "Reversed link syntax" },
  {
    id: "MD012",
    alias: "no-multiple-blanks",
    title: "Multiple consecutive blank lines",
  },
  { id: "MD013", alias: "line-length", title: "Line length" },
  {
    id: "MD014",
    alias: "commands-show-output",
    title: "Dollar signs used before commands without showing output",
  },
  {
    id: "MD018",
    alias: "no-missing-space-atx",
    title: "No space after hash on atx style heading (Lapis tag-aware)",
  },
  {
    id: "MD019",
    alias: "no-multiple-space-atx",
    title: "Multiple spaces after hash on atx style heading",
  },
  {
    id: "MD020",
    alias: "no-missing-space-closed-atx",
    title: "No space inside hashes on closed atx style heading",
  },
  {
    id: "MD021",
    alias: "no-multiple-space-closed-atx",
    title: "Multiple spaces inside hashes on closed atx style heading",
  },
  {
    id: "MD022",
    alias: "blanks-around-headings",
    title: "Headings should be surrounded by blank lines",
  },
  {
    id: "MD023",
    alias: "heading-start-left",
    title: "Headings must start at the beginning of the line",
  },
  {
    id: "MD024",
    alias: "no-duplicate-heading",
    title: "Multiple headings with the same content",
  },
  {
    id: "MD025",
    alias: "single-title",
    title: "Multiple top-level headings in the same document",
  },
  {
    id: "MD026",
    alias: "no-trailing-punctuation",
    title: "Trailing punctuation in heading",
  },
  {
    id: "MD027",
    alias: "no-multiple-space-blockquote",
    title: "Multiple spaces after blockquote symbol",
  },
  {
    id: "MD028",
    alias: "no-blanks-blockquote",
    title: "Blank line inside blockquote",
  },
  { id: "MD029", alias: "ol-prefix", title: "Ordered list item prefix" },
  { id: "MD030", alias: "list-marker-space", title: "Spaces after list markers" },
  {
    id: "MD031",
    alias: "blanks-around-fences",
    title: "Fenced code blocks should be surrounded by blank lines",
  },
  {
    id: "MD032",
    alias: "blanks-around-lists",
    title: "Lists should be surrounded by blank lines",
  },
  { id: "MD033", alias: "no-inline-html", title: "Inline HTML" },
  { id: "MD034", alias: "no-bare-urls", title: "Bare URL used" },
  { id: "MD035", alias: "hr-style", title: "Horizontal rule style" },
  {
    id: "MD036",
    alias: "no-emphasis-as-heading",
    title: "Emphasis used instead of a heading",
  },
  {
    id: "MD037",
    alias: "no-space-in-emphasis",
    title: "Spaces inside emphasis markers",
  },
  {
    id: "MD038",
    alias: "no-space-in-code",
    title: "Spaces inside code span elements",
  },
  { id: "MD039", alias: "no-space-in-links", title: "Spaces inside link text" },
  {
    id: "MD040",
    alias: "fenced-code-language",
    title: "Fenced code blocks should have a language specified",
  },
  {
    id: "MD041",
    alias: "first-line-heading",
    title: "First line in a file should be a top-level heading",
  },
  { id: "MD042", alias: "no-empty-links", title: "No empty links" },
  {
    id: "MD043",
    alias: "required-headings",
    title: "Required heading structure",
  },
  {
    id: "MD044",
    alias: "proper-names",
    title: "Proper names should have the correct capitalization",
  },
  {
    id: "MD045",
    alias: "no-alt-text",
    title: "Images should have alternate text (alt text)",
  },
  { id: "MD046", alias: "code-block-style", title: "Code block style" },
  {
    id: "MD047",
    alias: "single-trailing-newline",
    title: "Files should end with a single newline character",
  },
  { id: "MD048", alias: "code-fence-style", title: "Code fence style" },
  { id: "MD049", alias: "emphasis-style", title: "Emphasis style" },
  { id: "MD050", alias: "strong-style", title: "Strong style" },
  { id: "MD051", alias: "link-fragments", title: "Link fragments should be valid" },
  {
    id: "MD052",
    alias: "reference-links-images",
    title: "Reference links and images should use a label that is defined",
  },
  {
    id: "MD053",
    alias: "link-image-reference-definitions",
    title: "Link and image reference definitions should be needed",
  },
  { id: "MD054", alias: "link-image-style", title: "Link and image style" },
  { id: "MD055", alias: "table-pipe-style", title: "Table pipe style" },
  { id: "MD056", alias: "table-column-count", title: "Table column count" },
  {
    id: "MD058",
    alias: "blanks-around-tables",
    title: "Tables should be surrounded by blank lines",
  },
  {
    id: "MD059",
    alias: "descriptive-link-text",
    title: "Link text should be descriptive",
  },
  { id: "MD060", alias: "table-column-style", title: "Table column style" },
];

export function markdownLintRuleOptions(): {
  value: string;
  label: string;
  description: string;
}[] {
  return MARKDOWN_LINT_RULES.map((rule) => ({
    value: rule.id,
    label: `${rule.id} / ${rule.alias}`,
    description: rule.title,
  }));
}
