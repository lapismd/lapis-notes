export type HarperLanguage = "markdown" | "plaintext" | "typst";

export interface HarperSpan {
  start: number;
  end: number;
}

export interface HarperSuggestionLike {
  get_replacement_text(): string;
}

export interface HarperLintLike {
  span(): HarperSpan;
  message(): string;
  lint_kind?(): string;
  lintKind?(): string;
  get_lint_kind?(): string;
  suggestions(): HarperSuggestionLike[];
}

export interface HarperLintOptions {
  language?: HarperLanguage;
  isolateEnglish?: boolean;
  ignore_link_title?: boolean;
  regex_mask?: string;
}

export interface HarperLinterLike {
  setup(): Promise<void>;
  lint(text: string, options?: HarperLintOptions): Promise<HarperLintLike[]>;
  organizedLints?(
    text: string,
    options?: HarperLintOptions,
  ): Promise<Record<string, HarperLintLike[]>>;
  applySuggestion(
    text: string,
    lint: HarperLintLike,
    suggestion: HarperSuggestionLike,
  ): Promise<string>;
  setDialect(dialect: number): Promise<void>;
  getDefaultLintConfig(): Promise<Record<string, boolean | null | undefined>>;
  setLintConfig(
    config: Record<string, boolean | null | undefined>,
  ): Promise<void>;
  importWords(words: string[]): Promise<void>;
  clearWords(): Promise<void>;
  importIgnoredLints(json: string): Promise<void>;
  clearIgnoredLints(): Promise<void>;
  contextHash(source: string, lint: HarperLintLike): Promise<bigint>;
  dispose?(): Promise<void>;
}

export const HARPER_DIALECT = {
  american: 0,
  british: 1,
  australian: 2,
  canadian: 3,
  indian: 4,
} as const;

export function lintKind(lint: HarperLintLike): string {
  if (typeof lint.lint_kind === "function") {
    return String(lint.lint_kind());
  }
  if (typeof lint.lintKind === "function") {
    return String(lint.lintKind());
  }
  if (typeof lint.get_lint_kind === "function") {
    return String(lint.get_lint_kind());
  }
  return "Miscellaneous";
}

export function isNodeHarperRuntime(): boolean {
  const nodeProcess = (globalThis as {
    process?: { versions?: { node?: string } };
  }).process;
  return Boolean(nodeProcess?.versions?.node) && typeof window === "undefined";
}

export async function createHarperLinter(): Promise<HarperLinterLike> {
  const harper = await import("harper.js");
  const { binary } = await import("harper.js/binary");
  const Ctor = isNodeHarperRuntime() ? harper.LocalLinter : harper.WorkerLinter;
  const linter = new Ctor({ binary });
  await linter.setup();
  return linter as HarperLinterLike;
}
