import { DESKTOP_RENDERER_EVENTS_PATH } from "../src/desktop-renderer-events.ts";

export type RendererNativeEvent = {
  channel: string;
  payload: unknown;
};

type Subscriber = {
  controller: ReadableStreamDefaultController<Uint8Array>;
};

type RetainedRendererEvent = {
  id: number;
  event: RendererNativeEvent;
};

const MAX_BUFFERED_EVENTS = 4_096;
const encoder = new TextEncoder();

function encodeEvent(record: RetainedRendererEvent): Uint8Array {
  return encoder.encode(
    `id: ${record.id}\ndata: ${JSON.stringify(record.event)}\n\n`,
  );
}

function requestedLastEventId(request: Request): number {
  const url = new URL(request.url);
  const value =
    request.headers.get("last-event-id") ?? url.searchParams.get("lastEventId");
  if (!value || !/^\d+$/u.test(value)) return 0;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : 0;
}

export function createRendererEventStream() {
  const subscribers = new Set<Subscriber>();
  const retained: RetainedRendererEvent[] = [];
  let nextEventId = 0;
  let closed = false;

  const emit = (event: RendererNativeEvent): Promise<void> => {
    if (closed) return Promise.resolve();
    const record = { id: ++nextEventId, event };
    retained.push(record);
    if (retained.length > MAX_BUFFERED_EVENTS) retained.shift();
    const encoded = encodeEvent(record);
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
      const lastEventId = requestedLastEventId(request);
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          subscriber = { controller };
          subscribers.add(subscriber);
          for (const record of retained) {
            if (record.id > lastEventId)
              controller.enqueue(encodeEvent(record));
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
      retained.length = 0;
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
