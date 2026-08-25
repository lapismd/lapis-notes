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
});
