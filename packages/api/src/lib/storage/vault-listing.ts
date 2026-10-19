import { compileEditorAssociationGlob } from "../glob";
import { normalizePath } from "./path";

export const DEFAULT_VAULT_EXCLUDES: readonly string[] = Object.freeze([
  ".git",
  ".jj",
]);

/** Discovery projection only; explicit resources and adapter IO stay unchanged. */
export function createVaultListingFilter(
  readPatterns: () => readonly string[],
): () => (path: string) => boolean {
  let signature: string | undefined;
  let matchers: NonNullable<ReturnType<typeof compileEditorAssociationGlob>>[] =
    [];
  return () => {
    const value = readPatterns();
    const patterns = Array.isArray(value) ? value : DEFAULT_VAULT_EXCLUDES;
    const next = JSON.stringify(patterns);
    if (signature !== next) {
      matchers = patterns
        .filter((pattern): pattern is string => typeof pattern === "string")
        .map((pattern) =>
          compileEditorAssociationGlob(pattern, { caseSensitive: true }),
        )
        .filter(
          (matcher): matcher is NonNullable<typeof matcher> => matcher !== null,
        );
      signature = next;
    }
    const current = matchers;
    return (path) => {
      const relative = normalizePath(path).replace(/^\/+|\/+$/gu, "");
      if (!relative) return true;
      const parts = relative.split("/");
      for (let length = 1; length <= parts.length; length++) {
        const ancestor = parts.slice(0, length).join("/");
        if (current.some((matcher) => matcher.match(ancestor))) return false;
      }
      return true;
    };
  };
}
