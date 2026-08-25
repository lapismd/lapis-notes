import {
  context,
  createTraceState,
  metrics,
  SpanStatusCode,
  trace,
  type Attributes,
  type Context,
  type Meter,
  type Tracer,
} from "@opentelemetry/api";

import type { DesktopTraceContext } from "../src/desktop-invoke-envelope.ts";
import {
  readTelemetryResultCount,
  type DesktopTelemetryOperation,
} from "../src/telemetry-operations.ts";
import type { DesktopLogger } from "./desktop-logging.ts";

const STRUCTURED_LOG_EVENTS = new Set([
  "desktop.session.ready",
  "desktop.session.failed",
  "metadata.reconcile.complete",
  "metadata.reconcile.failed",
  "metadata.reconcile.cancelled",
  "search.reconcile.complete",
  "search.reconcile.failed",
  "search.reconcile.cancelled",
]);

const STRUCTURED_LOG_ATTRIBUTES = new Set([
  "phase",
  "status",
  "reason",
  "checkpoint",
  "retrieval.mode",
  "files.total",
  "files.processed",
  "files.changed",
  "files.deleted",
  "results.count",
  "providers.failed",
  "task",
]);

function parentContext(traceContext: DesktopTraceContext | undefined): Context {
  if (!traceContext) return context.active();
  const [, traceId, spanId, flags] = traceContext.traceparent.split("-");
  let traceState;
  try {
    traceState = traceContext.tracestate
      ? createTraceState(traceContext.tracestate)
      : undefined;
  } catch {
    traceState = undefined;
  }
  return trace.setSpanContext(context.active(), {
    traceId,
    spanId,
    traceFlags: Number.parseInt(flags, 16),
    isRemote: true,
    traceState,
  });
}

function safeErrorName(error: unknown): string {
  if (error instanceof Error && error.name.trim())
    return error.name.slice(0, 80);
  return "Error";
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

function validateStructuredAttributes(value: unknown): Attributes {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const attributes: Attributes = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!STRUCTURED_LOG_ATTRIBUTES.has(key)) continue;
    if (typeof raw === "number" && Number.isFinite(raw)) attributes[key] = raw;
    else if (typeof raw === "boolean") attributes[key] = raw;
    else if (
      typeof raw === "string" &&
      raw.length <= 128 &&
      /^[a-zA-Z0-9._:-]+$/u.test(raw)
    ) {
      attributes[key] = raw;
    }
  }
  return attributes;
}

export function writeStructuredRendererLog(
  payload: Record<string, unknown>,
  logger: DesktopLogger,
): void {
  const level = payload.level;
  const event = payload.event;
  if (level !== "info" && level !== "warn" && level !== "error") {
    throw new Error("Invalid desktop telemetry log level");
  }
  if (typeof event !== "string" || !STRUCTURED_LOG_EVENTS.has(event)) {
    throw new Error("Invalid desktop telemetry log event");
  }
  const attributes = validateStructuredAttributes(payload.attributes);
  logger[level](`[desktop-telemetry] ${event}`, attributes);
}

export function createNativeDesktopTelemetry(
  options: {
    tracer?: Tracer;
    meter?: Meter;
    now?: () => number;
  } = {},
) {
  const tracer =
    options.tracer ?? trace.getTracer("lapis.desktop.native", "2026.31.5");
  const meter =
    options.meter ?? metrics.getMeter("lapis.desktop.native", "2026.31.5");
  const now = options.now ?? performance.now.bind(performance);
  const duration = meter.createHistogram("lapis.desktop.bridge.duration", {
    description: "Duration of selected desktop bridge operations",
    unit: "ms",
  });
  const failures = meter.createCounter("lapis.desktop.bridge.errors", {
    description: "Failures from selected desktop bridge operations",
  });
  const resultCount = meter.createHistogram("lapis.desktop.result.count", {
    description: "Bounded result counts from selected desktop operations",
    unit: "{item}",
  });

  return {
    run<T>(
      operation: DesktopTelemetryOperation | null,
      traceContext: DesktopTraceContext | undefined,
      callback: () => T,
    ): T {
      if (!operation) return callback();
      const attributes = {
        "lapis.operation.scope": operation.scope,
        "lapis.operation.name": operation.operation,
      } satisfies Attributes;
      const startedAt = now();
      const span = tracer.startSpan(
        "desktop.bridge.request",
        { attributes },
        parentContext(traceContext),
      );
      const activeContext = trace.setSpan(parentContext(traceContext), span);
      const finish = (result: unknown) => {
        const count = readTelemetryResultCount(result);
        if (count !== undefined) {
          span.setAttribute("lapis.result.count", count);
          resultCount.record(count, attributes);
        }
        span.setStatus({ code: SpanStatusCode.OK });
        duration.record(Math.max(0, now() - startedAt), {
          ...attributes,
          "lapis.operation.status": "ok",
        });
        span.end();
        return result;
      };
      const fail = (error: unknown): never => {
        const name = safeErrorName(error);
        span.recordException({ name, message: name });
        span.setStatus({ code: SpanStatusCode.ERROR, message: name });
        failures.add(1, attributes);
        duration.record(Math.max(0, now() - startedAt), {
          ...attributes,
          "lapis.operation.status": "error",
        });
        span.end();
        throw error;
      };

      try {
        const result = context.with(activeContext, callback);
        if (isPromiseLike(result)) {
          return Promise.resolve(result).then(finish, fail) as T;
        }
        return finish(result) as T;
      } catch (error) {
        return fail(error);
      }
    },
  };
}
