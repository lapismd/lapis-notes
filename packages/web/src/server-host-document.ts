export function initializeServerHostDocument(
  runtime: "node-server" | "rust-server" = "node-server",
): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.runtime = runtime;
}
