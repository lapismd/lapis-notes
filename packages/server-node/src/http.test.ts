import { afterEach, describe, expect, it, vi } from "vitest";
import { startLapisNodeServer } from "./http.ts";
import type { LapisNodeServer } from "./server.ts";

const running: Awaited<ReturnType<typeof startLapisNodeServer>>[] = [];
afterEach(async () => {
  await Promise.all(running.splice(0).map((server) => server.close()));
});
function app(
  handler: LapisNodeServer["handler"],
  stop: () => void = () => undefined,
) {
  return {
    config: { hostname: "127.0.0.1", port: 0 },
    handler,
    stop,
    close: vi.fn(async () => undefined),
  } as unknown as LapisNodeServer;
}

describe("Node Fetch HTTP boundary", () => {
  it("preserves streamed uploads, response headers and the actual peer address", async () => {
    let peer: string | undefined;
    const host = app(async (request, address) => {
      peer = address;
      return new Response(await request.text(), {
        headers: { "x-lapis-test": "streamed" },
      });
    });
    const server = await startLapisNodeServer(host);
    running.push(server);
    const response = await fetch(server.url, {
      method: "POST",
      headers: { "x-forwarded-for": "forged" },
      body: "streamed upload",
    });
    expect(await response.text()).toBe("streamed upload");
    expect(response.headers.get("x-lapis-test")).toBe("streamed");
    expect(peer).toBe("127.0.0.1");
  });

  it("propagates response cancellation back to the owning Fetch stream", async () => {
    const cancelled = vi.fn();
    const host = app(
      async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array([1]));
            },
            cancel: cancelled,
          }),
        ),
    );
    const server = await startLapisNodeServer(host, 100);
    running.push(server);
    const abort = new AbortController();
    const response = await fetch(server.url, { signal: abort.signal });
    const reader = response.body!.getReader();
    await reader.read();
    abort.abort();
    await reader.cancel().catch(() => undefined);
    await expect.poll(() => cancelled.mock.calls.length).toBe(1);
  });

  it("ends live streams before closing services and makes close idempotent", async () => {
    let stream!: ReadableStreamDefaultController<Uint8Array>;
    const host = app(
      async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              stream = controller;
              controller.enqueue(new Uint8Array([1]));
            },
          }),
        ),
      () => stream.close(),
    );
    const server = await startLapisNodeServer(host);
    running.push(server);
    const response = await fetch(server.url);
    const closing = server.close();
    expect(server.close()).toBe(closing);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([1]),
    );
    await closing;
    expect(host.close).toHaveBeenCalledOnce();
  });
});
