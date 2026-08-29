import type {
  PluginDownloadCounts,
  PluginDownloadStatsSummary,
} from "./types";

export const PLUGIN_DOWNLOAD_STATS_MAX_AGE_DAYS = 5;

const ONE_DAY_MS = 86_400_000;

export function isUsablePluginDownloadStatsSummary(
  summary: PluginDownloadStatsSummary,
  now = new Date(),
): boolean {
  if (!summary.through || summary.trackedSince > summary.through) return false;
  if (
    Object.values(summary.periods).some(
      (period) => !period.from || !period.through,
    )
  ) {
    return false;
  }
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const through = Date.parse(`${summary.through}T00:00:00.000Z`);
  const ageDays = (today - through) / ONE_DAY_MS;
  return ageDays >= 0 && ageDays <= PLUGIN_DOWNLOAD_STATS_MAX_AGE_DAYS;
}

export function pluginDownloadCounts(
  summary: PluginDownloadStatsSummary,
  pluginId: string,
): PluginDownloadCounts {
  return {
    lifetime: summary.periods.lifetime.plugins[pluginId]?.total ?? 0,
    recent: summary.periods["30d"].plugins[pluginId]?.total ?? 0,
  };
}
