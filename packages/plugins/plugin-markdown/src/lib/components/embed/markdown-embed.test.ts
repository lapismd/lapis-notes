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
});
