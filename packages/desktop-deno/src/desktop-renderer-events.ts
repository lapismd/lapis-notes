export const DESKTOP_RENDERER_EVENTS_PATH = "/__lapis/desktop-events";

export type DenoRendererNativeEvent = {
  channel?: unknown;
  payload?: unknown;
};

export type DesktopRendererEventSource = {
  onmessage: ((event: MessageEvent<string>) => void) | null;
  close(): void;
};

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
    new EventSource(DESKTOP_RENDERER_EVENTS_PATH),
  schedule: (task: () => void) => void = (task) =>
    globalThis.setTimeout(task, 0),
): () => void {
  const source = createSource();
  let active = true;
  source.onmessage = (rawEvent) => {
    const event = parseDesktopRendererEvent(rawEvent.data);
    if (!event) return;
    schedule(() => {
      if (active) listener(event);
    });
  };
  return () => {
    active = false;
    source.close();
  };
}
