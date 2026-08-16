import { isLapisInternalPath } from "@lapis-notes/api/path";

export function isVisibleExplorerPath(path: string): boolean {
  const first = path.replace(/^\/+/, "").split("/", 1)[0];
  return (
    first !== ".obsidian" && first !== ".trash" && !isLapisInternalPath(path)
  );
}
