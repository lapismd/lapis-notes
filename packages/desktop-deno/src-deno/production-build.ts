export const TURSO_WASM_BUNDLE_ESM =
  /@tursodatabase[\\/]database-wasm[\\/]bundle[\\/]main\.es\.js$/u;

export function rendererDistRoot(launchDirectory: string): string {
  const separator = launchDirectory.includes("\\") ? "\\" : "/";
  const root = launchDirectory.replace(/[\\/]+$/u, "");
  return `${root}${separator}dist`;
}
