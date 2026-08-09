import type { HeadingCache } from "@lapis-notes/api";

export interface OutlineNode {
  id: string;
  label: string;
  heading: HeadingCache;
  children: OutlineNode[];
}

export function cleanHeadingLabel(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/!\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/gu, "$1")
    .replace(
      /\[\[([^\]|#]+)(?:\|([^\]]+))?[^\]]*\]\]/gu,
      (_match, target: string, label: string | undefined) => label ?? target,
    )
    .replace(/`([^`]+)`/gu, "$1")
    .replace(/<[^>]+>/gu, "")
    .replace(/[*_~]+/gu, "")
    .replace(/\\([\\`*_[\]{}()#+.!-])/gu, "$1")
    .replace(/\s+/gu, " ")
    .trim();
}

export function buildOutlineTree(headings: HeadingCache[]): OutlineNode[] {
  const roots: OutlineNode[] = [];
  const stack: OutlineNode[] = [];
  for (const heading of [...headings].sort(
    (left, right) => left.position.start.offset - right.position.start.offset,
  )) {
    const node: OutlineNode = {
      id: `${heading.level}:${heading.position.start.line}`,
      label: cleanHeadingLabel(heading.heading),
      heading,
      children: [],
    };
    while (
      stack.length &&
      stack[stack.length - 1]!.heading.level >= heading.level
    ) {
      stack.pop();
    }
    if (stack.length) stack[stack.length - 1]!.children.push(node);
    else roots.push(node);
    stack.push(node);
  }
  return roots;
}

export function filterOutlineTree(
  nodes: OutlineNode[],
  query: string,
): OutlineNode[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return nodes;
  return nodes.flatMap((node) => {
    const children = filterOutlineTree(node.children, normalized);
    return node.label.toLocaleLowerCase().includes(normalized) || children.length
      ? [{ ...node, children }]
      : [];
  });
}

export function expandableOutlineIds(nodes: OutlineNode[]): string[] {
  return nodes.flatMap((node) =>
    node.children.length
      ? [node.id, ...expandableOutlineIds(node.children)]
      : [],
  );
}
