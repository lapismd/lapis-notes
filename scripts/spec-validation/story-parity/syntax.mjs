import ts from "typescript";
import { posix } from "node:path";
export const unknown = Symbol("unresolved source expression");
export function unbox(node) {
  while (
    node &&
    (ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node))
  )
    node = node.expression;
  return node;
}
export const key = (node) => node?.text ?? node?.escapedText;
export function targetPath(known, file, path) {
  if (!path.startsWith(".")) return path;
  const base = posix.normalize(posix.join(posix.dirname(file), path));
  return (
    [
      base,
      base.replace(/\.js$/, ".ts"),
      ...[".ts", ".mjs", ".js", ".svelte", "/index.ts"].map((x) => base + x),
    ].find((x) => known.has(x)) ?? null
  );
}
