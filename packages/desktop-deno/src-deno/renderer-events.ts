import { DESKTOP_RENDERER_EVENTS_PATH } from "../src/desktop-renderer-events.ts";

export type RendererNativeEvent = {
  channel: string;
  payload: unknown;
};

type Subscriber = {
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const MAX_BUFFERED_EVENTS = 4_096;
const encoder = new TextEncoder();

function encodeEvent(event: RendererNativeEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

export function createRendererEventStream() {
  const subscribers = new Set<Subscriber>();
  const buffered: RendererNativeEvent[] = [];
  let closed = false;

  const emit = (event: RendererNativeEvent): Promise<void> => {
    if (closed) return Promise.resolve();
    if (subscribers.size === 0) {
      buffered.push(event);
      if (buffered.length > MAX_BUFFERED_EVENTS) buffered.shift();
      return Promise.resolve();
    }
    const encoded = encodeEvent(event);
    for (const subscriber of [...subscribers]) {
      try {
        subscriber.controller.enqueue(encoded);
      } catch {
        subscribers.delete(subscriber);
      }
    }
    return Promise.resolve();
  };

  return {
    emit,
    respond(request: Request): Response | null {
      const url = new URL(request.url);
      if (url.pathname !== DESKTOP_RENDERER_EVENTS_PATH) return null;
      if (request.method !== "GET") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { allow: "GET" },
        });
      }
      if (closed) return new Response(null, { status: 204 });

      let subscriber: Subscriber | undefined;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          subscriber = { controller };
          subscribers.add(subscriber);
          for (const event of buffered.splice(0)) {
            controller.enqueue(encodeEvent(event));
          }
        },
        cancel() {
          if (subscriber) subscribers.delete(subscriber);
        },
      });
      return new Response(body, {
        headers: {
          "cache-control": "no-cache, no-store",
          connection: "keep-alive",
          "content-type": "text/event-stream; charset=utf-8",
          "x-accel-buffering": "no",
        },
      });
    },
    close(): void {
      if (closed) return;
      closed = true;
      buffered.length = 0;
      for (const subscriber of [...subscribers]) {
        subscribers.delete(subscriber);
        try {
          subscriber.controller.close();
        } catch {
          // The browser may already have closed its stream.
        }
      }
    },
  };
}
