import type { Plugin } from "vite";

const TURSO_BUNDLE_SUFFIX =
  "/node_modules/@tursodatabase/database-wasm/bundle/main.es.js";
const DATA_URL_PREFIX = 'new URL("data:application/wasm;base64,';
const URL_WRAPPER_PREFIX = "new URL(";
const URL_WRAPPER_SUFFIX = ", import.meta.url).href";

/**
 * Turso's prebuilt browser bundle already embeds its WASM as a complete data
 * URL. Removing the redundant URL constructor prevents Vite's worker scanner
 * from tokenizing the generated 15 MB module recursively during production
 * builds, without changing the URL passed to fetch at runtime.
 */
export function unwrapTursoBundleDataUrl(code: string, id: string): string {
  const normalizedId = id.split("?", 1)[0]?.replaceAll("\\", "/") ?? id;
  if (!normalizedId.endsWith(TURSO_BUNDLE_SUFFIX)) return code;

  const expressionStart = code.indexOf(DATA_URL_PREFIX);
  if (expressionStart < 0) {
    return code.replaceAll("new Worker(", "new globalThis.Worker(");
  }
  const wrapperEnd = code.indexOf(URL_WRAPPER_SUFFIX, expressionStart);
  if (wrapperEnd < 0) {
    return code.replaceAll("new Worker(", "new globalThis.Worker(");
  }

  return (
    code.slice(0, expressionStart) +
    code.slice(expressionStart + URL_WRAPPER_PREFIX.length, wrapperEnd) +
    code.slice(wrapperEnd + URL_WRAPPER_SUFFIX.length)
  ).replaceAll("new Worker(", "new globalThis.Worker(");
}

export function tursoBundleBuildPlugin() {
  return {
    name: "lapis-api-turso-bundle-data-url",
    enforce: "pre",
    transform(code: string, id: string): { code: string; map: null } | null {
      const transformed = unwrapTursoBundleDataUrl(code, id);
      return transformed === code ? null : { code: transformed, map: null };
    },
  } satisfies Plugin;
}
