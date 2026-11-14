import type { App } from "./context.svelte";
import { readInstalledPluginAsset } from "./plugin-asset-server";
import {
  isAgentSkillContribution,
  type PackagedSkill,
} from "./skill-management";

/**
 * Static packages supply data; installed packages are read through verified
 * asset metadata.
 */
export async function collectAppSkillPackages(
  app: App,
): Promise<PackagedSkill[]> {
  const bundles: PackagedSkill[] = [];
  const bundledSources = new Set<string>();
  for (const plugin of app.plugins.plugins.values()) {
    if (!plugin.enabled || !plugin.packagedAgentSkills?.length) continue;
    if (!app.plugins.isStaticPlugin(plugin.manifest.id)) continue;
    bundles.push(...plugin.packagedAgentSkills);
    bundledSources.add(plugin.manifest.id);
  }
  for (const installed of await app.pluginDistribution.listInstalled()) {
    if (installed.revoked || bundledSources.has(installed.pluginId)) continue;
    if (
      !app.plugins.isPluginEnabled(installed.pluginId) &&
      app.plugins.getCommunityPluginDiagnostics(installed.pluginId)?.state !==
        "enabled"
    )
      continue;
    const read = async (relativePath: string) =>
      new TextDecoder("utf-8", { fatal: true }).decode(
        (
          await readInstalledPluginAsset({
            adapter: app.vault.adapter,
            installedPlugin: installed,
            relativePath,
          })
        ).bytes,
      );
    const manifest = JSON.parse(await read("manifest.json"));
    if (
      manifest.id !== installed.pluginId ||
      manifest.version !== installed.installedVersion
    )
      throw new Error("Plugin skill installation identity changed");
    const contributions: unknown = manifest.lapis?.contributes?.agentSkills;
    if (contributions === undefined) continue;
    if (
      !Array.isArray(contributions) ||
      contributions.some((value) => !isAgentSkillContribution(value))
    )
      throw new Error("Invalid plugin skill contributions");
    for (const contribution of contributions) {
      const prefix = `${contribution.directory}/`;
      const files: Record<string, string> = Object.create(null);
      for (const file of installed.files)
        if (file.path.startsWith(prefix))
          files[file.path.slice(prefix.length)] = await read(file.path);
      bundles.push({
        name: contribution.name,
        source: installed.pluginId,
        version: installed.installedVersion,
        files,
      });
    }
  }
  return bundles;
}
