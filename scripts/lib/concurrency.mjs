import { availableParallelism } from "node:os";

export function resolveTurboConcurrency(
  env = process.env,
  processorCount = availableParallelism(),
) {
  const override = env.TURBO_CONCURRENCY?.trim();
  if (override) {
    if (!/^[1-9]\d*$/.test(override) && !/^(?:100|[1-9]\d?)%$/.test(override)) {
      throw new Error(
        "TURBO_CONCURRENCY must be a positive integer or 1%-100%.",
      );
    }
    return override;
  }
  return String(Math.min(4, Math.max(1, Math.floor(processorCount / 2))));
}
