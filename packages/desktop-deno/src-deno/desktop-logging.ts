export type DesktopLogLevel = "debug" | "info" | "warn" | "error" | "silent";

export interface DesktopLogSink {
  debug(...data: unknown[]): void;
  info(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
}

export interface DesktopLogger extends DesktopLogSink {
  readonly level: DesktopLogLevel;
}

const LOG_LEVEL_PRIORITY: Record<DesktopLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50,
};

export function normalizeDesktopLogLevel(
  value: string | undefined,
): DesktopLogLevel {
  const normalized = value?.trim().toLowerCase();
  if (
    normalized === "debug" ||
    normalized === "info" ||
    normalized === "warn" ||
    normalized === "error" ||
    normalized === "silent"
  ) {
    return normalized;
  }
  return "info";
}

export function createDesktopLogger(options?: {
  level?: string;
  sink?: DesktopLogSink;
}): DesktopLogger {
  const level = normalizeDesktopLogLevel(options?.level);
  const sink = options?.sink ?? console;
  const shouldWrite = (messageLevel: Exclude<DesktopLogLevel, "silent">) =>
    LOG_LEVEL_PRIORITY[messageLevel] >= LOG_LEVEL_PRIORITY[level];

  return {
    level,
    debug(...data: unknown[]) {
      if (shouldWrite("debug")) sink.debug(...data);
    },
    info(...data: unknown[]) {
      if (shouldWrite("info")) sink.info(...data);
    },
    warn(...data: unknown[]) {
      if (shouldWrite("warn")) sink.warn(...data);
    },
    error(...data: unknown[]) {
      if (shouldWrite("error")) sink.error(...data);
    },
  };
}
