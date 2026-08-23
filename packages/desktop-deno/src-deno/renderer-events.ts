export type RendererNativeEvent = {
  channel: string;
  payload: unknown;
};

export type RendererScriptExecutor = {
  executeJs(code: string): Promise<unknown>;
  isClosed(): boolean;
};

export function createRendererEventScript(event: RendererNativeEvent): string {
  const serialized = JSON.stringify(event);
  return `globalThis.dispatchEvent(new CustomEvent("lapis-deno-native-event", { detail: JSON.parse(${JSON.stringify(serialized)}) }))`;
}

export function createRendererEventEmitter(win: RendererScriptExecutor) {
  return async (event: RendererNativeEvent): Promise<void> => {
    if (win.isClosed()) return;
    await win.executeJs(createRendererEventScript(event));
  };
}
