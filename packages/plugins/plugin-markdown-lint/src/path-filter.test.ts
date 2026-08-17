import { describe, expect, it, vi } from "vitest";

vi.mock("@lapis-notes/api", () => ({
  matchesEditorAssociationGlob: (pattern: string, path: string) => {
    if (pattern.includes("node_modules")) {
      return /(^|\/)node_modules\//.test(path);
    }
    if (pattern.includes(".obsidian")) {
      return /(^|\/)\.obsidian(\/|$)/.test(path);
    }
    if (pattern.endsWith(".md") || pattern.includes("{md")) {
      return /\.(md|markdown)$/iu.test(path);
    }
    return false;
  },
}));

import { shouldLintMarkdownPath, vaultPathFromDocumentUri } from "./path-filter";
import {
  DEFAULT_MARKDOWN_LINT_EXCLUDE_GLOBS,
  DEFAULT_MARKDOWN_LINT_INCLUDE_GLOBS,
  type MarkdownLintSettings,
} from "./settings";

const defaults: MarkdownLintSettings = {
  disabledRules: ["MD013"],
  includeGlobs: [...DEFAULT_MARKDOWN_LINT_INCLUDE_GLOBS],
  excludeGlobs: [...DEFAULT_MARKDOWN_LINT_EXCLUDE_GLOBS],
};

describe("markdown lint path filter", () => {
  it("reads vault paths from document URIs and lints untitled documents", () => {
    expect(vaultPathFromDocumentUri("vault:///Notes/Loft%20boarding.md")).toBe(
      "Notes/Loft boarding.md",
    );
    expect(shouldLintMarkdownPath(null, defaults)).toBe(true);
    expect(shouldLintMarkdownPath("Notes/Welcome.md", defaults)).toBe(true);
  });

  it("skips excluded open paths and unmatched includes", () => {
    expect(
      shouldLintMarkdownPath("node_modules/pkg/README.md", defaults),
    ).toBe(false);
    expect(shouldLintMarkdownPath(".obsidian/app.json", defaults)).toBe(false);
    expect(
      shouldLintMarkdownPath("Notes/readme.txt", {
        ...defaults,
        includeGlobs: ["**/*.md"],
      }),
    ).toBe(false);
  });

  it("lints remaining Markdown when include globs are empty", () => {
    expect(
      shouldLintMarkdownPath("Notes/readme.txt", {
        ...defaults,
        includeGlobs: [],
      }),
    ).toBe(true);
  });
});
