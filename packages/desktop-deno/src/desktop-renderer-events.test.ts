import { describe, expect, it, vi } from "vitest";

import {
  connectDesktopRendererEvents,
  parseDesktopRendererEvent,
  type DesktopRendererEventSource,
} from "./desktop-renderer-events";

describe("desktop renderer event stream", () => {
  it("parses only JSON object events", () => {
    expect(
      parseDesktopRendererEvent(
        JSON.stringify({ channel: "desktop_test", payload: { ok: true } }),
      ),
    ).toEqual({ channel: "desktop_test", payload: { ok: true } });
    expect(parseDesktopRendererEvent("not-json")).toBeNull();
    expect(parseDesktopRendererEvent("null")).toBeNull();
  });

  it("delivers stream messages and closes the source", () => {
    const source: DesktopRendererEventSource = {
      onmessage: null,
      close: vi.fn(),
    };
    const listener = vi.fn();
    const scheduled: Array<() => void> = [];
    const dispose = connectDesktopRendererEvents(
      listener,
      () => source,
      (task) => scheduled.push(task),
    );

    source.onmessage?.(
      new MessageEvent("message", {
        data: JSON.stringify({ channel: "desktop_test", payload: 1 }),
      }),
    );
    source.onmessage?.(new MessageEvent("message", { data: "invalid" }));
    expect(listener).not.toHaveBeenCalled();
    scheduled.splice(0).forEach((task) => task());
    dispose();

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({
      channel: "desktop_test",
      payload: 1,
    });
    expect(source.close).toHaveBeenCalledOnce();
  });

  it("suppresses scheduled delivery after disposal", () => {
    const source: DesktopRendererEventSource = {
      onmessage: null,
      close: vi.fn(),
    };
    const scheduled: Array<() => void> = [];
    const listener = vi.fn();
    const dispose = connectDesktopRendererEvents(
      listener,
      () => source,
      (task) => scheduled.push(task),
    );
    source.onmessage?.(
      new MessageEvent("message", {
        data: JSON.stringify({ channel: "desktop_test" }),
      }),
    );

    dispose();
    scheduled.splice(0).forEach((task) => task());

    expect(listener).not.toHaveBeenCalled();
  });
});
