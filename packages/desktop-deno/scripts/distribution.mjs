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
      desktopOutput: path.join(releaseDir, baseName),
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
    "set -eu",
    "launcher=$0",
    "links=0",
    'while [ -L "$launcher" ]; do',
    "  links=$((links + 1))",
    '  [ "$links" -le 40 ] || { echo "Lapis Notes launcher contains a symbolic-link cycle" >&2; exit 1; }',
    '  directory=$(CDPATH= cd -- "$(dirname -- "$launcher")" && pwd)',
    '  link=$(readlink "$launcher")',
    '  case "$link" in /*) launcher=$link ;; *) launcher=$directory/$link ;; esac',
    "done",
    'application_dir=$(CDPATH= cd -- "$(dirname -- "$launcher")" && pwd)',
    "if command -v ldconfig >/dev/null 2>&1; then",
    "  library_cache=$(ldconfig -p)",
    "elif [ -x /sbin/ldconfig ]; then",
    "  library_cache=$(/sbin/ldconfig -p)",
    "else",
    '  echo "Lapis Notes requires ldconfig to check its Linux system libraries" >&2',
    "  exit 1",
    "fi",
    "missing=",
    "for library in libwebkit2gtk-4.1.so.0 libgtk-3.so.0 libayatana-appindicator3.so.1; do",
    '  case "$library_cache" in *"$library ("*) ;; *) missing="$missing $library" ;; esac',
    "done",
    'if [ -n "$missing" ]; then',
    '  echo "Lapis Notes is missing Linux system libraries:$missing" >&2',
    '  echo "On Ubuntu 24.04 run: sudo apt-get install libwebkit2gtk-4.1-0 libgtk-3-0t64 libayatana-appindicator3-1" >&2',
    "  exit 1",
    "fi",
    '[ "${1:-}" != --check-runtime ] || exit 0',
    'exec "$application_dir/lib/lapis-notes/lapis-notes" "$@"',
    "",
  ].join("\n");
}

export function createMacApplicationMetadata(version) {
  return {
    CFBundleIdentifier: "notes.lapis.desktop",
    CFBundleName: "Lapis Notes",
    CFBundleShortVersionString: version,
    CFBundleVersion: version,
    LSMinimumSystemVersion: "15.0",
  };
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
