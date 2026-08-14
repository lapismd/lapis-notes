export type SummaryConfig = Record<string, string> | undefined;

export type ConfiguredSummary = {
  propertyId: string;
  summaryKey: string;
};

export function resolveConfiguredSummaries(
  order: string[],
  baseSummaries?: SummaryConfig,
  viewSummaries?: SummaryConfig,
): ConfiguredSummary[] {
  const merged = {
    ...(baseSummaries ?? {}),
    ...(viewSummaries ?? {}),
  };

  return order.flatMap((propertyId) => {
    const summaryKey = merged[propertyId];
    return summaryKey ? [{ propertyId, summaryKey }] : [];
  });
}

export function formatSummaryLabel(summaryKey: string): string {
  if (!summaryKey) return "";

  return summaryKey
    .replaceAll(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
