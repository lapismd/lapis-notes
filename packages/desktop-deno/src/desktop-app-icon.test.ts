import { describe, expect, it, vi } from "vitest";

import { installDesktopAppIconAppearanceSync } from "./desktop-app-icon";

function createMediaQuery(initial: boolean) {
  let listener: (() => void) | undefined;
  const media = {
    matches: initial,
    addEventListener: vi.fn((_type: "change", next: () => void) => {
      listener = next;
    }),
    removeEventListener: vi.fn(),
  };
  return {
    media,
    setDark(matches: boolean) {
      media.matches = matches;
      listener?.();
    },
  };
}

describe("desktop application icon appearance sync", () => {
  it("applies the current macOS appearance and follows system changes", () => {
    const query = createMediaQuery(false);
    const apply = vi.fn();
    const dispose = installDesktopAppIconAppearanceSync({
      platform: "macos",
      matchMedia: vi.fn(() => query.media),
      apply,
    });

    expect(apply).toHaveBeenCalledWith("light");
    query.setDark(true);
    expect(apply).toHaveBeenLastCalledWith("dark");
    dispose();
    query.setDark(false);
    expect(apply).toHaveBeenCalledTimes(2);
    expect(query.media.removeEventListener).toHaveBeenCalledOnce();
  });

  it("does not install native icon behavior on other platforms", () => {
    const query = createMediaQuery(false);
    const apply = vi.fn();
    installDesktopAppIconAppearanceSync({
      platform: "linux",
      matchMedia: vi.fn(() => query.media),
      apply,
    });

    expect(apply).not.toHaveBeenCalled();
    expect(query.media.addEventListener).not.toHaveBeenCalled();
  });
});
