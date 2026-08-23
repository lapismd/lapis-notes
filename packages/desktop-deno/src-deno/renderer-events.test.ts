import { describe, expect, it, vi } from "vitest";

import {
  createRendererEventEmitter,
  createRendererEventScript,
} from "./renderer-events";

describe("Deno renderer native events", () => {
  it("double-encodes event data before executing it in the renderer", () => {
    const script = createRendererEventScript({
      channel: "desktop_test",
      payload: { text: '"; globalThis.pwned = true; //', line: "a\u2028b" },
    });
    expect(script).toContain("JSON.parse");
    expect(script).not.toContain('globalThis.pwned = true; //"');
  });

  it("does not execute events after the window closes", async () => {
    const executeJs = vi.fn(async () => undefined);
    const emit = createRendererEventEmitter({
      executeJs,
      isClosed: () => true,
    });
    await emit({ channel: "desktop_test", payload: null });
    expect(executeJs).not.toHaveBeenCalled();
  });
});
