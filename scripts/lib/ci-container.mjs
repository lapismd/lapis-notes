import path from "node:path";

const workdir = "/workspace";

export function hasCompleteRemoteCache(env = process.env) {
  return [
    "TURBO_API",
    "TURBO_TEAM",
    "TURBO_TOKEN",
    "TURBO_REMOTE_CACHE_SIGNATURE_KEY",
  ].every((key) => env[key]?.trim());
}

export function buildContainerArgs({
  root,
  image,
  lockfileSha256,
  packageDirectories,
  platform,
  pull = false,
  shell = false,
  command = ["pnpm", "ci:release"],
  remoteCache = false,
}) {
  const key = lockfileSha256.slice(0, 16);
  const args = ["run", "--rm", "--ipc=host"];
  if (pull) args.push("--pull=always");
  if (platform) args.push("--platform", platform);
  if (shell) args.push("-it");

  args.push(
    "-v",
    `${root}:${workdir}`,
    "-v",
    `lapis-notes-node-modules-${key}:${workdir}/node_modules`,
    "-v",
    `lapis-notes-pnpm-store-${key}:/pnpm/store`,
    "-v",
    `lapis-notes-turbo-${key}:${workdir}/.turbo`,
  );
  for (const directory of [...packageDirectories].sort()) {
    args.push(
      "-v",
      `lapis-notes-${directory}-node-modules-${key}:${workdir}/packages/${directory}/node_modules`,
    );
  }

  args.push(
    "-w",
    workdir,
    "-e",
    "CI=true",
    "-e",
    "PLAYWRIGHT_BROWSERS_PATH=/ms-playwright",
  );
  if (process.env.TURBO_CONCURRENCY?.trim())
    args.push("-e", "TURBO_CONCURRENCY");
  if (remoteCache) {
    for (const keyName of [
      "TURBO_API",
      "TURBO_TEAM",
      "TURBO_TOKEN",
      "TURBO_REMOTE_CACHE_SIGNATURE_KEY",
    ]) {
      args.push("-e", keyName);
    }
  }

  args.push(image);
  if (shell) {
    args.push("bash");
  } else {
    args.push(
      "bash",
      "-lc",
      `pnpm install --frozen-lockfile --prefer-offline && ${command.map(shellQuote).join(" ")}`,
    );
  }
  return args;
}

export function nativeLinuxPlatform(architecture = process.arch) {
  if (architecture === "arm64") return "linux/arm64";
  if (architecture === "x64") return "linux/amd64";
  throw new Error(`Unsupported local architecture: ${architecture}`);
}

export function packageDirectoryFromManifest(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");
  const match = normalized.match(/^packages\/([^/]+)\/package\.json$/);
  return match?.[1];
}

function shellQuote(value) {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}
