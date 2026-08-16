/**
 * Normalize a vault-style path by removing redundant segments and separators.
 *
 * @public
 */
export function normalizePath(path: string): string {
  if (path.length === 0) {
    return "";
  }
  let parts: string[] = splitPath(path);
  parts = parts.reduce(reducer, []);
  return joinPath(...parts).replace(/^\.\//, "");
}

export function resolvePath(...paths: string[]): string {
  let result: string = "";
  for (let path of paths) {
    if (path.startsWith("/")) {
      result = path;
    } else {
      result = normalizePath(joinPath(result, path));
    }
  }
  return result;
}

export function joinPath(...parts: string[]): string {
  if (parts.length === 0) return "";
  let path: string = parts.join("/");
  path = path.replace(/\/{2,}/g, "/");
  return path;
}

export function splitPath(path: string): string[] {
  if (path.length === 0) return [];
  if (path === "/") return ["/"];
  let parts: string[] = path.split("/");
  if (parts[parts.length - 1] === "") {
    parts.pop();
  }
  if (path[0] === "/") {
    parts[0] = "/";
  } else {
    if (parts[0] !== ".") {
      parts.unshift(".");
    }
  }
  return parts;
}

export function dirname(path: string): string {
  const last: number = path.lastIndexOf("/");
  if (last === 0 || last === -1) return "/";
  return path.slice(0, last);
}

export function basename(path: string): string {
  if (path === "/") throw new Error(`Cannot get basename of "${path}"`);
  const last: number = path.lastIndexOf("/");
  if (last === -1) return path;
  return path.slice(last + 1);
}

/**
 * Returns whether a vault path belongs to Lapis' portable internal data.
 *
 * Internal data can occur beneath any folder-scoped feature root. Callers
 * that present ordinary vault content should hide these paths, while explicit
 * storage and indexing operations remain free to address them directly.
 *
 * @public
 */
export function isLapisInternalPath(path: string): boolean {
  return path
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .split("/")
    .includes(".lapis");
}

export function reducer(ancestors: string[], current: string): string[] {
  if (ancestors.length === 0) {
    ancestors.push(current);
    return ancestors;
  }

  if (current === ".") return ancestors;

  if (current === "..") {
    if (ancestors.length === 1) {
      if (ancestors[0] === "/") {
        throw new Error(
          "Unable to normalize path - traverses above root directory",
        );
      }
      if (ancestors[0] === ".") {
        ancestors.push(current);
        return ancestors;
      }
    }
    if (ancestors[ancestors.length - 1] === "..") {
      ancestors.push("..");
      return ancestors;
    } else {
      ancestors.pop();
      return ancestors;
    }
  }

  ancestors.push(current);
  return ancestors;
}
