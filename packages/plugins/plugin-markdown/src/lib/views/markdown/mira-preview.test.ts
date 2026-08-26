import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Mira reading preview", () => {
  it("delegates scrolling to the shared Design Core ScrollArea", () => {
    const source = readFileSync(
      new URL("./mira-preview.svelte", import.meta.url),
      "utf8",
    );

    expect(source).toContain(
      'import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area"',
    );
    expect(source).toContain(
      '<ScrollArea class="markdown-view__reading-scroll">',
    );
    expect(source).not.toMatch(
      /\.markdown-view__reading\s*\{[^}]*overflow:\s*auto/s,
    );
    expect(source).toMatch(
      /\.mira-markdown-preview\)\s*\{[^}]*overflow:\s*visible/s,
    );
  });

  it("anchors the floating outline to the visible Reading pane", () => {
    const source = readFileSync(
      new URL("./mira-preview.svelte", import.meta.url),
      "utf8",
    );

    expect(source).toMatch(
      /\.markdown-view__reading\s*\{[^}]*transform:\s*translateZ\(0\)/s,
    );
    expect(source).toMatch(
      /\.mira-markdown-outline--floating\)\s*\{[^}]*position:\s*fixed/s,
    );
    expect(source).toMatch(
      /scroll-padding-block-start:\s*var\(--mira-preview-padding,\s*2rem\)/,
    );
    expect(source).toMatch(
      /padding-inline-end:\s*max\(var\(--mira-preview-padding,\s*2rem\),\s*4rem\)/,
    );
  });

  it("passes the live vault-backed frontmatter config to Reading mode", () => {
    const source = readFileSync(
      new URL("./mira-preview.svelte", import.meta.url),
      "utf8",
    );

    expect(source).toContain("createLapisFrontmatterPropertyManager(app).config");
    expect(source).toContain("{frontmatterConfig}");
  });
});
