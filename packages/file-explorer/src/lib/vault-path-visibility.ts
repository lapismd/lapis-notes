export function isHiddenExplorerPath(path: string): boolean {
  return path
    .replace(/^\/+/, "")
    .split("/")
    .some((segment) => segment.startsWith("."));
}

export function isVisibleExplorerPath(
  path: string,
  options: { showHidden?: boolean } = {},
): boolean {
  return options.showHidden === true || !isHiddenExplorerPath(path);
}
