import { describe, expect, it, vi } from "vitest";

vi.mock("@lapis-notes/api", () => ({
  matchesEditorAssociationGlob: (pattern: string, path: string) => {
    if (pattern.includes("node_modules")) {
      return /(^|\/)node_modules\//.test(path);
    }
    if (pattern.includes("{md") || pattern.includes("txt")) {
      return /\.(md|markdown|mdown|mkd|mdwn|mdtxt|mdtext|txt|text)$/iu.test(
        path,
      );
    }
    return false;
  },
}));

import {
  documentExceedsMaxLength,
  fileTypeFromPath,
  shouldCheckSpellcheckPath,
  vaultPathFromDocumentUri,
} from "./path-filter";
import {
  DEFAULT_SPELLCHECK_EXCLUDE_GLOBS,
  DEFAULT_SPELLCHECK_INCLUDE_GLOBS,
  type SpellcheckSettings,
} from "./settings";

const defaults: SpellcheckSettings = {
  dialect: "american",
  automaticChecking: true,
  disabledRules: [],
  userDictionary: [],
  ignoreWords: [],
  ignoredLints: [],
  isolateEnglish: false,
  ignoreLinkTitle: false,
  maxFileLength: 120000,
  numSuggestions: 8,
  checkFrontmatter: false,
  diagnosticSeverity: null,
  enabledFileTypes: ["markdown", "plaintext"],
  includeGlobs: [...DEFAULT_SPELLCHECK_INCLUDE_GLOBS],
  excludeGlobs: [...DEFAULT_SPELLCHECK_EXCLUDE_GLOBS],
};

describe("spellcheck path filter", () => {
  it("decodes vault URIs and file types", () => {
    expect(vaultPathFromDocumentUri("vault:///Notes/Welcome.md")).toBe(
      "Notes/Welcome.md",
    );
    expect(fileTypeFromPath("Notes/Welcome.md")).toBe("markdown");
    expect(fileTypeFromPath("Notes/shortcuts.txt")).toBe("plaintext");
  });

  it("skips excluded paths, paused checking, and oversized documents", () => {
    expect(
      shouldCheckSpellcheckPath("Notes/Welcome.md", defaults),
    ).toBe(true);
    expect(
      shouldCheckSpellcheckPath("node_modules/pkg/README.md", defaults),
    ).toBe(false);
    expect(
      shouldCheckSpellcheckPath("Notes/Welcome.md", {
        ...defaults,
        automaticChecking: false,
      }),
    ).toBe(false);
    expect(
      shouldCheckSpellcheckPath("Notes/shortcuts.txt", {
        ...defaults,
        enabledFileTypes: ["markdown"],
      }),
    ).toBe(false);
    expect(documentExceedsMaxLength("abc", 2)).toBe(true);
    expect(documentExceedsMaxLength("abc", 10)).toBe(false);
  });
});
