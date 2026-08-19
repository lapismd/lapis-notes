import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Deno desktop launcher drag markers", () => {
  it("marks empty launcher chrome as a drag region", () => {
    const source = readFileSync(
      new URL("./DesktopVaultLauncher.svelte", import.meta.url),
      "utf8",
    );
    expect(source).toMatch(
      /data-desktop-vault-launcher[\s\S]*data-desktop-drag-region/,
    );
    expect(source).toContain('data-desktop-drag-region="false"');
  });
});
