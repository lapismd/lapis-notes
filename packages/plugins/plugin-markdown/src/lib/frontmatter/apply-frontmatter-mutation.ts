function setPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
) {
  const parts = path.split(".").filter(Boolean);
  if (parts.length === 0) return;
  let cursor: Record<string, unknown> = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index]!;
    const next = cursor[key];
    if (
      next === null ||
      next === undefined ||
      typeof next !== "object" ||
      Array.isArray(next)
    ) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]!] = value;
}

function unsetPath(target: Record<string, unknown>, path: string) {
  const parts = path.split(".").filter(Boolean);
  if (parts.length === 0) return;
  let cursor: Record<string, unknown> = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index]!;
    const next = cursor[key];
    if (
      next === null ||
      next === undefined ||
      typeof next !== "object" ||
      Array.isArray(next)
    ) {
      return;
    }
    cursor = next as Record<string, unknown>;
  }
  delete cursor[parts[parts.length - 1]!];
}

export function applyFrontmatterMutation(
  frontmatter: Record<string, unknown>,
  path: string,
  value: unknown,
) {
  if (value === null || value === undefined) {
    unsetPath(frontmatter, path);
    return;
  }
  setPath(frontmatter, path, value);
}
