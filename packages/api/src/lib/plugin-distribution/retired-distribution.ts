import { PluginDistributionError } from "./errors";
import type { PluginReleaseManifest } from "./types";

const retiredRepository = "lapismd/lapis-plugins";
const retiredPackage = "@lapis-notes/ai";

function refuseRetiredSharedAi(): never {
  throw new PluginDistributionError(
    "metadata-invalid",
    "The external shared AI distribution is retired. Use the AI bundled with your host.",
    { details: { repository: retiredRepository, package: retiredPackage } },
  );
}

/** Old signed catalogs can omit downloadUrl and address the artifact directly. */
export function assertActivePluginArchiveOrigin(
  pluginId: string,
  origin: string,
): void {
  if (pluginId !== "ai") return;
  let url: URL;
  let parts: string[];
  try {
    url = new URL(origin);
    parts = decodeURIComponent(url.pathname).split("/").filter(Boolean);
  } catch {
    return;
  }
  if (
    url.hostname.toLowerCase() === "github.com" &&
    parts.length === 6 &&
    `${parts[0]}/${parts[1]}`.toLowerCase() === retiredRepository &&
    parts[2] === "releases" &&
    parts[3] === "download" &&
    parts[4].startsWith("ai@") &&
    parts[5] === `ai-${parts[4].slice(3)}.lapis-plugin`
  )
    refuseRetiredSharedAi();
}

/** Verified source provenance also covers mirrors and portable bundle installs. */
export function assertActivePluginReleaseSource(
  manifest: PluginReleaseManifest,
): void {
  const source = manifest.source;
  const repository = source?.repo
    ?.trim()
    ?.replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git\/?$/i, "")
    .replace(/\/$/, "")
    .toLowerCase();
  if (
    repository === retiredRepository &&
    (source?.package === retiredPackage ||
      (!source?.package && manifest.pluginId === "ai"))
  )
    refuseRetiredSharedAi();
}
