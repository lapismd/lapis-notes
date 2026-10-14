/** Test-only scope; normal application startup never opts into acceptance. */
export function resolveDesktopAcceptanceMode(
  enabled: string | undefined,
  reportPath: string | undefined,
  requested: string | undefined,
): "core" | "full" | undefined {
  if (enabled !== "1" || !reportPath?.trim()) return undefined;
  return requested === "core" ? "core" : "full";
}
