export function initializeServerHostDocument(): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.runtime = "deno-server";
}
