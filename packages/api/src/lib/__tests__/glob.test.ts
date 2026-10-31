import { describe, expect, it } from "vitest";
import { Platform } from "../platform";
import {
  compileEditorAssociationGlob,
  compareEditorAssociationPatternSpecificity,
  hasEditorAssociationGlobMagic,
  matchesEditorAssociationGlob,
  validateEditorAssociationGlob,
} from "../glob";

describe("editor association glob matching", () => {
  it("matches basename patterns in nested vault paths", () => {
    expect(matchesEditorAssociationGlob("*.md", "Daily.md")).toBe(true);
    expect(matchesEditorAssociationGlob("*.md", "Notes/Daily.md")).toBe(true);
    expect(matchesEditorAssociationGlob("*.md", "Notes/Daily.txt")).toBe(false);
  });

  it("supports VS Code-style glob syntax", () => {
    expect(
      matchesEditorAssociationGlob("notes/**/*.{md,markdown}", "notes/a/b.md"),
    ).toBe(true);
    expect(matchesEditorAssociationGlob("example.[0-9]", "example.7")).toBe(
      true,
    );
    expect(matchesEditorAssociationGlob("example.[!0-9]", "example.a")).toBe(
      true,
    );
    expect(matchesEditorAssociationGlob("example.[!0-9]", "example.7")).toBe(
      false,
    );
  });

  it("normalizes backslash paths", () => {
    expect(
      matchesEditorAssociationGlob("notes/**/*.md", "notes\\daily\\today.md"),
    ).toBe(true);
  });

  it("matches dotfiles and treats comment, negation, and extglob syntax literally", () => {
    expect(matchesEditorAssociationGlob("*.md", ".draft.md")).toBe(true);
    for (const name of ["#note.md", "!note.md", "+(a|b).md"]) {
      expect(matchesEditorAssociationGlob(name, `Notes/${name}`)).toBe(true);
      expect(matchesEditorAssociationGlob(name, "Notes/other.md")).toBe(false);
    }
  });

  it("reuses a compiled matcher across normalized vault paths", () => {
    const matcher = compileEditorAssociationGlob("  notes\\**\\*.{md,txt}  ", {
      caseSensitive: true,
    });
    expect(matcher).not.toBeNull();
    expect(matcher?.match("notes/a/b.md")).toBe(true);
    expect(matcher?.match("notes/.draft.txt")).toBe(true);
    expect(matcher?.match("other/b.md")).toBe(false);
  });

  it("detects braces and character classes while retaining literal filenames", () => {
    expect(hasEditorAssociationGlobMagic("notes/{a,b}.md")).toBe(true);
    expect(hasEditorAssociationGlobMagic("note.[0-9]")).toBe(true);
    const original = { isMacOS: Platform.isMacOS, isWin: Platform.isWin };
    try {
      Object.assign(Platform, { isMacOS: false, isWin: false });
      expect(hasEditorAssociationGlobMagic("notes/daily.md")).toBe(false);
      expect(hasEditorAssociationGlobMagic("!note.md")).toBe(false);
      Platform.isMacOS = true;
      expect(hasEditorAssociationGlobMagic("notes/daily.md")).toBe(true);
    } finally {
      Object.assign(Platform, original);
    }
  });

  it("honors platform-sensitive case options", () => {
    expect(
      matchesEditorAssociationGlob("*.md", "Daily.MD", {
        caseSensitive: true,
      }),
    ).toBe(false);
    expect(
      matchesEditorAssociationGlob("*.md", "Daily.MD", {
        caseSensitive: false,
      }),
    ).toBe(true);
  });

  it("validates non-empty patterns", () => {
    expect(validateEditorAssociationGlob("")).toEqual({
      valid: false,
      message: "Glob pattern must not be empty.",
    });
    expect(validateEditorAssociationGlob("*.md")).toEqual({ valid: true });
  });

  it("rejects oversized patterns without throwing or matching", () => {
    const pattern = "x".repeat(65_537);
    expect(validateEditorAssociationGlob(pattern)).toEqual({
      valid: false,
      message: "Glob pattern is invalid.",
    });
    expect(matchesEditorAssociationGlob(pattern, "note.md")).toBe(false);
    expect(hasEditorAssociationGlobMagic(pattern)).toBe(false);
    expect(compileEditorAssociationGlob("   ")).toBeNull();
  });

  it("orders exact and more specific patterns ahead of broad patterns", () => {
    expect(
      compareEditorAssociationPatternSpecificity("Notes/Daily.md", "*.md"),
    ).toBeGreaterThan(0);
    expect(
      compareEditorAssociationPatternSpecificity("notes/**/*.md", "*.md"),
    ).toBeGreaterThan(0);
    expect(
      compareEditorAssociationPatternSpecificity("notes/a*.md", "notes/*?.md"),
    ).toBeGreaterThan(0);
  });
});
