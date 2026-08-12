declare module "markdownlint" {
  export type MarkdownLintFixInfo = {
    lineNumber?: number;
    editColumn?: number;
    deleteCount?: number;
    insertText?: string;
  };

  export function applyFix(
    content: string,
    fixInfo?: MarkdownLintFixInfo | null,
    lineEnding?: string,
  ): string;

  export function applyFixes(
    content: string,
    issues: Array<{ fixInfo?: MarkdownLintFixInfo | null }>,
    lineEnding?: string,
  ): string;
}
