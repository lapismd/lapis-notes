import { describe, expect, it } from "vitest";

import { classifyDesktopWindowOpen } from "./external-links";

describe("Deno renderer new-window policy", () => {
  it("reserves blank windows for the shared workspace popout", () => {
    expect(classifyDesktopWindowOpen(undefined)).toEqual({
      action: "blank-window",
    });
    expect(classifyDesktopWindowOpen("about:blank")).toEqual({
      action: "blank-window",
    });
  });

  it("routes complete HTTP and HTTPS URLs to the native host", () => {
    expect(
      classifyDesktopWindowOpen("https://example.com/a?b=one%20two#three"),
    ).toEqual({
      action: "external",
      url: "https://example.com/a?b=one%20two#three",
    });
    expect(classifyDesktopWindowOpen(new URL("http://example.com"))).toEqual({
      action: "external",
      url: "http://example.com/",
    });
  });

  it("denies relative, privileged, and unsupported targets", () => {
    for (const url of ["/notes", "file:///etc/passwd", "javascript:alert(1)"]) {
      expect(classifyDesktopWindowOpen(url)).toEqual({ action: "deny" });
    }
  });
});
