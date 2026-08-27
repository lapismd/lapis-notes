export const DESKTOP_RENDERER_EVENTS_PATH = "/__lapis/desktop-events";

export type DenoRendererNativeEvent = {
  channel?: unknown;
  payload?: unknown;
};

export type DesktopRendererEventSource = {
  onmessage: ((event: MessageEvent<string>) => void) | null;
  close(): void;
};

let lastDeliveredRendererEventId = 0;

function rendererEventSourceUrl(): string {
  return lastDeliveredRendererEventId > 0
    ? `${DESKTOP_RENDERER_EVENTS_PATH}?lastEventId=${lastDeliveredRendererEventId}`
    : DESKTOP_RENDERER_EVENTS_PATH;
}

export function parseDesktopRendererEvent(
  data: string,
): DenoRendererNativeEvent | null {
  try {
    const parsed = JSON.parse(data) as DenoRendererNativeEvent | null;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function connectDesktopRendererEvents(
  listener: (event: DenoRendererNativeEvent) => void,
  createSource: () => DesktopRendererEventSource = () =>
    new EventSource(rendererEventSourceUrl()),
  schedule: (task: () => void) => void = (task) =>
    globalThis.setTimeout(task, 0),
): () => void {
  const source = createSource();
  let active = true;
  source.onmessage = (rawEvent) => {
    const event = parseDesktopRendererEvent(rawEvent.data);
    if (!event) return;
    schedule(() => {
      if (!active) return;
      const eventId = Number(rawEvent.lastEventId);
      if (
        Number.isSafeInteger(eventId) &&
        eventId > lastDeliveredRendererEventId
      ) {
        lastDeliveredRendererEventId = eventId;
      }
      listener(event);
    });
  };
  return () => {
    active = false;
    source.close();
  };
}
