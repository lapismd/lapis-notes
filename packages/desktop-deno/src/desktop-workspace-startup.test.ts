import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("Deno desktop workspace startup branding", () => {
  it("uses the Lapis logo visual for saved-vault and session loading", () => {
    const startup = readSource("./DesktopWorkspaceStartup.svelte");
    const host = readSource("./DesktopVaultHost.svelte");
    const session = readSource("./DesktopWorkspaceSession.svelte");

    expect(startup).toContain('from "./assets/lapis-logo.svg"');
    expect(startup).toContain('title="Opening Lapis Notes"');
    expect(startup).toContain("loadingVisual={lapisVisual}");
    expect(startup).toContain('data-ui-part="logo"');
    expect(startup).toContain('alt=""');

    for (const consumer of [host, session]) {
      expect(consumer).toContain(
        'import DesktopWorkspaceStartup from "./DesktopWorkspaceStartup.svelte"',
      );
      expect(consumer).toContain("<DesktopWorkspaceStartup");
      expect(consumer).not.toContain(
        '<WorkspaceStartup title="Opening Lapis Notes"',
      );
    }
  });
});
