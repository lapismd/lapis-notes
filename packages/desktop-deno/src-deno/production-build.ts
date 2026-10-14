import { fileURLToPath } from "node:url";

export const TURSO_WASM_BUNDLE_ESM =
  /@tursodatabase[\\/]database-wasm[\\/]bundle[\\/]main\.es\.js$/u;

export function rendererDistRoot(nativeModuleUrl: string): string {
  return fileURLToPath(new URL("../dist/", nativeModuleUrl));
}
