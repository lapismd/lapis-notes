import { describe, expect, it } from "vitest";
import {
  compareEditorAssociationPatternSpecificity,
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
