import path from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

export function resolveAppRendererFilePath(
  rendererRoot: string,
  encodedPathname: string,
): string {
  let pathname: string;
  try {
    pathname = decodeURIComponent(encodedPathname);
  } catch {
    throw new Error("Invalid renderer path encoding");
  }
  if (pathname.includes("\0")) throw new Error("Invalid renderer path");

  const root = path.resolve(rendererRoot);
  const relativePath =
    pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Renderer path is outside the application bundle");
  }
  return filePath;
}

export function getAppRendererContentType(filePath: string): string {
  return (
    CONTENT_TYPES[path.extname(filePath).toLowerCase()] ??
    "application/octet-stream"
  );
}
