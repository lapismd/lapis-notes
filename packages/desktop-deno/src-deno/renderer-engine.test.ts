import { describe, expect, it } from "vitest";

import { resolveDesktopRendererEngine } from "./renderer-engine";

describe("Deno desktop renderer engine", () => {
  it("maps the default and system webview backends to WebKit", () => {
    expect(resolveDesktopRendererEngine(undefined)).toBe("webkit");
    expect(resolveDesktopRendererEngine("webview")).toBe("webkit");
  });

  it("maps the CEF backend to Blink", () => {
    expect(resolveDesktopRendererEngine("cef")).toBe("blink");
  });
});
