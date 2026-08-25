import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MarkdownEmbed", () => {
  it("applies the App Mira extension stack and file adapter", () => {
    const source = readFileSync(
      "src/lib/components/embed/markdown-embed.svelte",
      "utf8",
    );

    expect(source).toContain("resolveMarkdownMiraExtensions");
    expect(source).toContain("createLapisMiraFileAdapter");
    expect(source).toContain("htmlPolicy");
    expect(source).toContain("extensions={resolved.miraExtensions}");
  });

  it("keeps explicit embed frontmatter state independently collapsed", () => {
    for (const path of [
      "src/lib/components/embed/markdown-embed.svelte",
      "src/lib/components/embed/file-embed.svelte",
    ]) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain("frontmatterOpen = false");
      expect(source).toContain("{frontmatterOpen}");
      expect(source).not.toContain("frontmatterDefaultOpen");
    }
  });
});
