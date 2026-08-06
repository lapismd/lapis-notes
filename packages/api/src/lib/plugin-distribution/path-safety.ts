import { PluginDistributionError } from "./errors";

export const assertSafePluginRelativePath = (path: string): void => {
  if (
    path.length === 0 ||
    path.startsWith("/") ||
    path.startsWith("\\") ||
    path.includes("\\") ||
    path.includes("\0") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new PluginDistributionError(
      "invalid-path",
      `Plugin release file path is not safe: ${path}`,
      { details: { path } },
    );
  }
};

export const isSafePluginRelativePath = (path: string): boolean => {
  try {
    assertSafePluginRelativePath(path);
    return true;
  } catch {
    return false;
  }
};
