import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Markdown file surface", () => {
  it("owns activation, persistence controls, and a single state-specific scroll owner", () => {
    const source = readFileSync(
      "src/lib/components/embed/markdown-file-surface.svelte",
      "utf8",
    );

    expect(source).toContain('activation !== "double-click"');
    expect(source).toContain("activateOnPreviewInteraction={activation === \"click\"}");
    expect(source).toContain("export function enter");
    expect(source).toContain("export async function flush");
    expect(source).toContain("export async function exit");
    expect(source).toContain('data-editing={editing ? "true" : "false"}');
    expect(source).toContain('data-mira-theme="obsidian"');
    expect(source).toContain('data-editing="false"');
    expect(source).toContain('data-editing="true"');
    expect(source).toContain("onEditingChange?.(editing)");
    expect(source).not.toContain(
      "onEditingChange={(next) => onEditingChange?.(next)}",
    );
  });
});
