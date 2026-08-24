import { lstat, readlink, stat, symlink } from "node:fs/promises";
import path from "node:path";

export const desktopDevSiblingLinks = [
  { name: "lapis-notes", target: "../.." },
  { name: "ai-host", target: "../../../ai-host" },
  { name: "terminal-host", target: "../../../terminal-host" },
];

export function createDenoDesktopDevArgs(backend) {
  return [
    "desktop",
    "--hmr",
    "--inspect=127.0.0.1:9229",
    "--no-check",
    "--sloppy-imports",
    "--exclude",
    "node_modules",
    "--exclude",
    "dist",
    "--exclude",
    "src",
    ...(backend === "cef" || backend === "webview" ? ["--backend", backend] : []),
    "-A",
    "src-deno/main.ts",
  ];
}

export async function ensureDesktopDevSiblingLinks(packageRoot) {
  for (const link of desktopDevSiblingLinks) {
    const linkPath = path.join(packageRoot, link.name);
    const targetPath = path.resolve(packageRoot, link.target);

    try {
      const targetStat = await stat(targetPath);
      if (!targetStat.isDirectory()) {
        throw new Error(
          `Desktop dev source target must be a directory for ${link.name}: ${targetPath}`,
        );
      }
    } catch (error) {
      if (error && error.code === "ENOENT") {
        throw new Error(
          `Missing desktop dev source target for ${link.name}: ${targetPath}`,
        );
      }
      throw error;
    }

    try {
      const stat = await lstat(linkPath);
      if (!stat.isSymbolicLink()) {
        throw new Error(
          `Refusing to replace non-symlink desktop dev sibling path: ${linkPath}`,
        );
      }

      const currentTarget = await readlink(linkPath);
      if (currentTarget !== link.target) {
        throw new Error(
          `Refusing to replace desktop dev sibling link ${linkPath}; expected ${link.target}, found ${currentTarget}`,
        );
      }
    } catch (error) {
      if (error && error.code === "ENOENT") {
        await symlink(link.target, linkPath, "dir");
        continue;
      }
      throw error;
    }
  }
}
