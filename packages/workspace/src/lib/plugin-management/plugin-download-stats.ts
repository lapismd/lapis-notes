export function formatApproximateDownloadCount(value: number): string {
  if (value < 1_000) return String(value);
  for (const [threshold, suffix] of [
    [1_000_000_000, "B"],
    [1_000_000, "M"],
    [1_000, "K"],
  ] as const) {
    if (value >= threshold) {
      const scaled = value / threshold;
      return `${scaled >= 10 ? Math.round(scaled) : scaled.toFixed(1).replace(/\.0$/, "")}${suffix}`;
    }
  }
  return String(value);
}
