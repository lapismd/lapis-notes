import { createHash } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const localPluginInstallArguments = [
  "install",
  "--no-frozen-lockfile",
  "--prefer-offline",
  "--force",
];

export function createLocalPluginInstallFingerprint(
  registryLockfile,
  releaseEntries,
) {
  return createHash("sha256")
    .update(registryLockfile)
    .update(
      JSON.stringify(
        releaseEntries.map(({ packageName, sha256, version }) => ({
          packageName,
          sha256,
          version,
        })),
      ),
    )
    .digest("hex");
}

export async function isCurrentLocalPluginInstall({
  expectedFingerprint,
  installStampPath,
  releaseEntries,
  repositoryRoot,
}) {
  try {
    const stamp = JSON.parse(await readFile(installStampPath, "utf8"));
    if (stamp.fingerprint !== expectedFingerprint) return false;
    for (const entry of releaseEntries) {
      const manifest = JSON.parse(
        await readFile(
          path.join(
            repositoryRoot,
            "node_modules",
            entry.packageName,
            "package.json",
          ),
          "utf8",
        ),
      );
      if (manifest.version !== entry.version) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function runPreservingFile(filePath, originalContent, operation) {
  try {
    await operation();
  } finally {
    await writeFile(filePath, originalContent);
  }
}

export async function invalidateLocalPluginConsumerCaches(cachePaths) {
  await Promise.all(
    cachePaths.map((cachePath) =>
      rm(cachePath, { force: true, recursive: true }),
    ),
  );
}
