export type PluginDistributionErrorCode =
  | "canonical-json-invalid"
  | "compatibility-failed"
  | "hash-mismatch"
  | "invalid-path"
  | "metadata-invalid"
  | "reserved-id"
  | "signature-invalid"
  | "signature-key-not-found";

export class PluginDistributionError extends Error {
  readonly code: PluginDistributionErrorCode;
  readonly cause?: unknown;
  readonly details?: Record<string, unknown>;

  constructor(
    code: PluginDistributionErrorCode,
    message: string,
    options: {
      cause?: unknown;
      details?: Record<string, unknown>;
    } = {},
  ) {
    super(message);
    this.name = "PluginDistributionError";
    this.code = code;
    this.cause = options.cause;
    this.details = options.details;
  }
}

export const isPluginDistributionError = (
  error: unknown,
): error is PluginDistributionError => error instanceof PluginDistributionError;
