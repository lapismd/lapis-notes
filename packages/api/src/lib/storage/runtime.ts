/** Application host identity, independent of optional database/model services. */
export type RuntimeTarget =
  | "web-pwa"
  | "deno-desktop"
  | "tauri-desktop"
  | "node-server"
  | "deno-server"
  | "test";

export function isNativeDesktopRuntime(
  runtime?: RuntimeTarget | null,
): runtime is "deno-desktop" | "tauri-desktop" {
  return runtime === "deno-desktop" || runtime === "tauri-desktop";
}
