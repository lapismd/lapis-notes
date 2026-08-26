import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./desktop-host.css", import.meta.url),
  "utf8",
);

describe("desktop host workspace safe area", () => {
  it("maps macOS ribbon geometry to the Design Core main-pane token", () => {
    expect(source).toMatch(
      /\.ui-app-shell:has\([^}]+--ui-workspace-window-controls-inline-start:\s*var\(\s*--lapis-desktop-window-controls-after-ribbon/u,
    );
    expect(source).toMatch(
      /\.ui-app-shell:not\(:has\([^}]+--ui-workspace-window-controls-inline-start:\s*var\(\s*--lapis-desktop-window-controls-left/u,
    );
  });

  it("keeps the open sidebar inset separate from the main-pane token", () => {
    expect(source).toContain(
      "--lapis-desktop-window-controls-sidebar-after-ribbon",
    );
    expect(source).toContain("--lapis-desktop-window-controls-sidebar-left");
    expect(source).not.toContain('[data-ui-part="left-toggle"]');
  });

  it("leaves the open sidebar header at Design Core's native position", () => {
    expect(source).not.toContain("window-controls-block-offset");
    expect(source).not.toMatch(
      /\[data-workspace-sidebar-side="left"\][\s\S]+translateY/u,
    );
  });
});
