import { lstat, readlink, stat, symlink } from "node:fs/promises";
import path from "node:path";

export const desktopDevSiblingLinks = [
  { name: "lapis-notes", target: "../.." },
  { name: "ai-host", target: "../../../ai-host" },
  { name: "terminal-host", target: "../../../terminal-host" },
];

export function resolveDenoDesktopInspector(value, telemetryEnabled = false) {
  const requested = value?.trim() === "1";
  if (requested && telemetryEnabled) {
    throw new Error(
      "LAPIS_DENO_INSPECT=1 cannot be combined with desktop telemetry because Deno 2.9.5 logs binding payloads while its native inspector is enabled.",
    );
  }
  return requested;
}

export function createDenoDesktopDevArgs(backend, options = {}) {
  return [
    "desktop",
    "--quiet",
    "--hmr",
    ...(options.icon ? ["--icon", options.icon] : []),
    ...(options.inspect ? ["--inspect=127.0.0.1:9229"] : []),
    "--no-check",
    "--sloppy-imports",
    "--include",
    "build/icon-light.png",
    "--include",
    "build/icon-dark.png",
    "--exclude",
    "node_modules",
    "--exclude",
    "dist",
    "--exclude",
    "src",
    ...(backend === "cef" || backend === "webview"
      ? ["--backend", backend]
      : []),
    "-A",
    "src-deno/main.ts",
  ];
}

export function resolveDesktopDevIcon(packageRoot, platform) {
  return path.join(
    packageRoot,
    "build",
    platform === "darwin" ? "icon.icns" : "icon.png",
  );
}

export function resolveMacosDesktopDevHost(packageRoot, backend) {
  const selectedBackend = backend === "cef" ? "cef" : "webview";
  const root = path.join(packageRoot, "release", "dev-laufey");
  const bundle =
    selectedBackend === "cef"
      ? path.join(root, "cef", "build", "Release", "laufey.app")
      : path.join(root, "webview", "build", "laufey_webview.app");
  const executable = path.join(
    bundle,
    "Contents",
    "MacOS",
    selectedBackend === "cef" ? "laufey" : "laufey_webview",
  );
  return {
    backend: selectedBackend,
    root,
    bundle,
    executable,
    plist: path.join(bundle, "Contents", "Info.plist"),
    marker: path.join(root, `${selectedBackend}.json`),
  };
}

export function createDenoDesktopDevHostBuildArgs(options) {
  return [
    "desktop",
    "--quiet",
    "--output",
    options.output,
    "--backend",
    options.backend,
    "--icon",
    options.icon,
    "--no-check",
    "src-deno/application-info.ts",
  ];
}

export function isMacosDesktopDevHostCurrent(options) {
  return (
    options.executable === true &&
    options.bundleName === options.expected.name &&
    options.marker.denoVersion === options.expected.denoVersion &&
    options.marker.backend === options.expected.backend &&
    options.marker.name === options.expected.name &&
    options.marker.identifier === options.expected.identifier
  );
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
