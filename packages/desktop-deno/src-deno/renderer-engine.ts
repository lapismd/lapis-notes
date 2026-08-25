export type DesktopRendererEngine = "webkit" | "blink";

export function resolveDesktopRendererEngine(
  backend: string | undefined,
): DesktopRendererEngine {
  return backend === "cef" ? "blink" : "webkit";
}
