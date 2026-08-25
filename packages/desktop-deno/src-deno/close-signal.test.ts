import { describe, expect, it } from "vitest";

import {
  createDesktopCloseSignal,
  DESKTOP_CLOSE_SIGNAL_PATH,
} from "./close-signal";

describe("Deno desktop close signal", () => {
  it("holds the renderer request until native close is requested", async () => {
    const signal = createDesktopCloseSignal();
    const response = signal.respond(
      new Request(`http://127.0.0.1${DESKTOP_CLOSE_SIGNAL_PATH}`),
    );
    expect(response).toBeInstanceOf(Promise);

    signal.requestClose();
    const settled = await response;
    expect(settled?.status).toBe(200);
    expect(await settled?.text()).toBe("close");
  });

  it("returns immediately after close has already been requested", async () => {
    const signal = createDesktopCloseSignal();
    signal.requestClose();
    const response = await signal.respond(
      new Request(`http://127.0.0.1${DESKTOP_CLOSE_SIGNAL_PATH}`),
    );
    expect(response?.status).toBe(200);
  });

  it("ignores unrelated paths and rejects mutation methods", async () => {
    const signal = createDesktopCloseSignal();
    expect(signal.respond(new Request("http://127.0.0.1/notes"))).toBeNull();
    const response = await signal.respond(
      new Request(`http://127.0.0.1${DESKTOP_CLOSE_SIGNAL_PATH}`, {
        method: "POST",
      }),
    );
    expect(response?.status).toBe(405);
  });

  it("releases pending renderer requests during shutdown", async () => {
    const signal = createDesktopCloseSignal();
    const response = signal.respond(
      new Request(`http://127.0.0.1${DESKTOP_CLOSE_SIGNAL_PATH}`),
    );
    signal.close();
    expect((await response)?.status).toBe(204);
  });
});
