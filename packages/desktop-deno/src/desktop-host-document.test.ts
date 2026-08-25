import { describe, expect, it, vi } from "vitest";

import { applyDesktopHostDocument } from "./desktop-host-document";

function createRoot() {
  return {
    classList: { toggle: vi.fn() },
    dataset: {} as DOMStringMap,
  };
}

describe("Deno desktop host document", () => {
  it.each([
    ["webkit", "webkit"],
    ["blink", "blink"],
    [undefined, "webkit"],
  ] as const)(
    "marks a %s renderer before mount",
    (rendererEngine, expected) => {
      const root = createRoot();

      applyDesktopHostDocument(
        {
          runtime: "deno-desktop",
          os: "macos",
          overlayWindowControls: true,
          rendererEngine,
        },
        root,
      );

      expect(root.dataset).toMatchObject({
        runtime: "deno-desktop",
        engine: expected,
      });
      expect(root.classList.toggle).toHaveBeenCalledWith(
        "lapis-desktop--macos",
        true,
      );
    },
  );
});
