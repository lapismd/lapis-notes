import path from "node:path";

const SUPPORTED_TARGETS = new Map([
  ["aarch64-apple-darwin", { platform: "macos", architecture: "arm64" }],
  ["x86_64-apple-darwin", { platform: "macos", architecture: "x64" }],
  ["aarch64-unknown-linux-gnu", { platform: "linux", architecture: "arm64" }],
  ["x86_64-unknown-linux-gnu", { platform: "linux", architecture: "x64" }],
]);

export function resolveCurrentDenoTarget(platform, architecture) {
  const key = `${platform}:${architecture}`;
  const targets = {
    "darwin:arm64": "aarch64-apple-darwin",
    "darwin:x64": "x86_64-apple-darwin",
    "linux:arm64": "aarch64-unknown-linux-gnu",
    "linux:x64": "x86_64-unknown-linux-gnu",
  };
  const target = targets[key];
  if (!target) {
    throw new Error(`Unsupported Deno desktop build host ${key}`);
  }
  return target;
}

export function readRequestedTarget(argv, platform, architecture) {
  const index = argv.indexOf("--target");
  if (index === -1) {
    return resolveCurrentDenoTarget(platform, architecture);
  }
  const target = argv[index + 1]?.trim();
  if (!target || target.startsWith("--")) {
    throw new Error("--target requires a Deno target triple");
  }
  if (!SUPPORTED_TARGETS.has(target)) {
    throw new Error(`Unsupported Deno desktop target ${target}`);
  }
  return target;
}

export function createDistributionPlan({
  packageDir,
  releaseDir,
  version,
  target,
}) {
  const targetInfo = SUPPORTED_TARGETS.get(target);
  if (!targetInfo) {
    throw new Error(`Unsupported Deno desktop target ${target}`);
  }
  const baseName = `Lapis-Notes-${version}-${targetInfo.platform}-${targetInfo.architecture}`;
  const sharedBuildDir = path.resolve(packageDir, "build");
  if (targetInfo.platform === "macos") {
    return {
      ...targetInfo,
      target,
      baseName,
      icon: path.join(sharedBuildDir, "icon.icns"),
      appBundle: path.join(releaseDir, `${baseName}.app`),
      archive: path.join(releaseDir, `${baseName}.zip`),
    };
  }
  return {
    ...targetInfo,
    target,
    baseName,
    icon: path.join(sharedBuildDir, "icon.png"),
    appImage: path.join(releaseDir, `${baseName}.AppImage`),
    archive: path.join(releaseDir, `${baseName}.tar.gz`),
    desktopEntry: "lapis-notes.desktop",
    executable: "lapis-notes",
    installedIcon: "lapis-notes.png",
  };
}

export function createLinuxDesktopEntry() {
  return [
    "[Desktop Entry]",
    "Type=Application",
    "Name=Lapis Notes",
    "Comment=Open a Lapis Notes vault",
    "Exec=lapis-notes %u",
    "Icon=lapis-notes",
    "Terminal=false",
    "Categories=Office;Utility;",
    "MimeType=x-scheme-handler/lapis;x-scheme-handler/lapis-notes;",
    "",
  ].join("\n");
}

export function createLinuxLauncher() {
  return [
    "#!/bin/sh",
    'application_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)',
    'exec "$application_dir/lib/lapis-notes/lapis-notes" "$@"',
    "",
  ].join("\n");
}

export function createMacSigningArguments({
  appBundle,
  identity,
  entitlements,
}) {
  const args = ["--force", "--deep"];
  if (identity === "-") {
    args.push("--sign", "-", appBundle);
    return args;
  }
  args.push(
    "--options",
    "runtime",
    "--timestamp",
    "--entitlements",
    entitlements,
    "--sign",
    identity,
    appBundle,
  );
  return args;
}

export function createLinuxSigningArguments({ artifact, keyId }) {
  return [
    "--batch",
    "--yes",
    "--armor",
    "--detach-sign",
    "--local-user",
    keyId,
    "--output",
    `${artifact}.asc`,
    artifact,
  ];
}
