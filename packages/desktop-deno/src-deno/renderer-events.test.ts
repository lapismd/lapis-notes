import { describe, expect, it } from "vitest";

import { DESKTOP_RENDERER_EVENTS_PATH } from "../src/desktop-renderer-events";
import { createRendererEventStream } from "./renderer-events";

async function readNextEvent(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Renderer event response is missing a body");
  const result = await reader.read();
  await reader.cancel();
  return new TextDecoder().decode(result.value);
}

describe("Deno renderer native events", () => {
  it("buffers ordered JSON events until the renderer connects", async () => {
    const events = createRendererEventStream();
    await events.emit({
      channel: "desktop_test",
      payload: { text: '"; globalThis.pwned = true; //', sequence: 1 },
    });
    await events.emit({
      channel: "desktop_test",
      payload: { sequence: 2 },
    });

    const response = events.respond(
      new Request(`http://127.0.0.1${DESKTOP_RENDERER_EVENTS_PATH}`),
    );

    expect(response?.headers.get("content-type")).toContain(
      "text/event-stream",
    );
    const reader = response?.body?.getReader();
    const first = new TextDecoder().decode((await reader?.read())?.value);
    const second = new TextDecoder().decode((await reader?.read())?.value);
    await reader?.cancel();
    expect(first).toContain('"sequence":1');
    expect(first).toContain("globalThis.pwned");
    expect(second).toContain('"sequence":2');
  });

  it("streams later events without awaiting renderer execution", async () => {
    const events = createRendererEventStream();
    const response = events.respond(
      new Request(`http://127.0.0.1${DESKTOP_RENDERER_EVENTS_PATH}`),
    );
    const next = readNextEvent(response!);

    await events.emit({ channel: "desktop_test", payload: { sequence: 1 } });

    await expect(next).resolves.toContain('"sequence":1');
  });

  it("rejects writes and closes active renderer streams", async () => {
    const events = createRendererEventStream();
    expect(
      events.respond(
        new Request(`http://127.0.0.1${DESKTOP_RENDERER_EVENTS_PATH}`, {
          method: "POST",
        }),
      )?.status,
    ).toBe(405);
    const response = events.respond(
      new Request(`http://127.0.0.1${DESKTOP_RENDERER_EVENTS_PATH}`),
    );
    const reader = response?.body?.getReader();

    events.close();

    await expect(reader?.read()).resolves.toMatchObject({ done: true });
    await events.emit({ channel: "desktop_test", payload: null });
    expect(
      events.respond(
        new Request(`http://127.0.0.1${DESKTOP_RENDERER_EVENTS_PATH}`),
      )?.status,
    ).toBe(204);
  });
});
