import {
  context,
  SpanStatusCode,
  trace,
  type Context,
  type Span,
  type Tracer,
} from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  type SpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import {
  createTelemetryConfiguration,
  createTelemetryDiagnosticsSnapshot,
  type TelemetryAttributeValue,
  type TelemetryAttributes,
  type TelemetryConfiguration,
  type TelemetryDiagnosticsSnapshot,
  type TelemetryMeasurement,
  type TelemetryMeasurementOptions,
  type TelemetryService,
  type TelemetrySpan,
  type TelemetrySpanOptions,
} from "@lapis-notes/api/telemetry";
import { writable, type Readable } from "svelte/store";

import { createDesktopInvokeEnvelope } from "./desktop-invoke-envelope";
import {
  classifyDesktopTelemetryOperation,
  readTelemetryResultCount,
} from "./telemetry-operations";
import type {
  DesktopRawInvoke,
  DesktopRendererTelemetryController,
  DesktopTelemetryLogLevel,
} from "./renderer-telemetry";

type OtelDesktopRendererTelemetryOptions = {
  endpoint: string;
  serviceName: string;
  version: string;
  exporter?: SpanExporter;
  registerGlobal?: boolean;
};

function setSpanAttributes(
  span: Span,
  attributes: TelemetryAttributes | undefined,
): void {
  if (!attributes) return;
  for (const [name, value] of Object.entries(attributes)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      span.setAttribute(name, value);
    }
  }
}

function safeErrorName(error: unknown): string {
  if (error instanceof Error && error.name.trim())
    return error.name.slice(0, 80);
  return "Error";
}

class OtelTelemetrySpan implements TelemetrySpan {
  readonly startedAt = performance.now();
  readonly spanContext: Context;
  private ended = false;

  constructor(
    readonly name: string,
    readonly rawSpan: Span,
    parentContext: Context,
  ) {
    this.spanContext = trace.setSpan(parentContext, rawSpan);
  }

  setAttribute(name: string, value: TelemetryAttributeValue): void {
    setSpanAttributes(this.rawSpan, { [name]: value });
  }

  addEvent(name: string, attributes?: TelemetryAttributes): void {
    const safeAttributes: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(attributes ?? {})) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        safeAttributes[key] = value;
      }
    }
    this.rawSpan.addEvent(name, safeAttributes);
  }

  recordException(error: unknown, attributes?: TelemetryAttributes): void {
    const name = safeErrorName(error);
    this.rawSpan.recordException({ name, message: name });
    setSpanAttributes(this.rawSpan, attributes);
    this.rawSpan.setStatus({ code: SpanStatusCode.ERROR, message: name });
  }

  end(attributes?: TelemetryAttributes): void {
    if (this.ended) return;
    this.ended = true;
    setSpanAttributes(this.rawSpan, attributes);
    this.rawSpan.end();
  }
}

class OtelTelemetryService implements TelemetryService {
  enabled = true;
  readonly diagnostics: Readable<TelemetryDiagnosticsSnapshot>;
  private readonly diagnosticsStore;
  private readonly config: TelemetryConfiguration;

  constructor(
    private readonly tracer: Tracer,
    endpoint: string,
  ) {
    this.config = createTelemetryConfiguration({
      enabled: true,
      otlpEndpoint: endpoint,
      sampleRate: 1,
    });
    this.diagnosticsStore = writable(
      createTelemetryDiagnosticsSnapshot({
        enabled: true,
        sampleRate: 1,
        otlpConfigured: true,
      }),
    );
    this.diagnostics = { subscribe: this.diagnosticsStore.subscribe };
  }

  getConfiguration(): TelemetryConfiguration {
    return { ...this.config };
  }

  configure(): void {
    throw new Error(
      "Desktop renderer telemetry is configured by its development launcher",
    );
  }

  clearDiagnostics(): void {
    this.diagnosticsStore.set(
      createTelemetryDiagnosticsSnapshot({
        enabled: true,
        sampleRate: 1,
        otlpConfigured: true,
      }),
    );
  }

  startSpan(name: string, options: TelemetrySpanOptions = {}): TelemetrySpan {
    const parentContext =
      options.parent instanceof OtelTelemetrySpan
        ? options.parent.spanContext
        : context.active();
    const rawSpan = this.tracer.startSpan(name, undefined, parentContext);
    setSpanAttributes(rawSpan, options.attributes);
    return new OtelTelemetrySpan(name, rawSpan, parentContext);
  }

  measure<T>(
    name: string,
    callback: (span: TelemetrySpan) => T,
    options: TelemetryMeasurementOptions = {},
  ): T {
    const span = this.startSpan(name, options) as OtelTelemetrySpan;
    return context.with(span.spanContext, () => {
      try {
        return callback(span);
      } catch (error) {
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  measureAsync<T>(
    name: string,
    callback: (span: TelemetrySpan) => Promise<T>,
    options: TelemetryMeasurementOptions = {},
  ): Promise<T> {
    const span = this.startSpan(name, options) as OtelTelemetrySpan;
    return context.with(span.spanContext, async () => {
      try {
        return await callback(span);
      } catch (error) {
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  recordEvent(name: string, attributes?: TelemetryAttributes): void {
    this.startSpan(`event.${name}`, { attributes }).end();
  }

  recordMeasurement(measurement: TelemetryMeasurement): void {
    this.startSpan(`metric.${measurement.name}`, {
      attributes: {
        "metric.name": measurement.name,
        "metric.value": measurement.value,
        "metric.unit": measurement.unit ?? "ms",
        ...measurement.attributes,
      },
    }).end();
  }
}

function createTraceCarrier(span: Span) {
  const spanContext = span.spanContext();
  const flags = spanContext.traceFlags.toString(16).padStart(2, "0");
  const tracestate = spanContext.traceState?.serialize();
  return {
    traceparent: `00-${spanContext.traceId}-${spanContext.spanId}-${flags}`,
    ...(tracestate ? { tracestate } : {}),
  };
}

class OtelDesktopRendererTelemetry
  implements DesktopRendererTelemetryController
{
  readonly enabled = true;
  readonly service: TelemetryService;
  private readonly tracer: Tracer;
  private shutdownPromise: Promise<void> | null = null;

  constructor(
    private readonly provider: WebTracerProvider,
    endpoint: string,
    version: string,
  ) {
    this.tracer = provider.getTracer("lapis.desktop.renderer", version);
    this.service = new OtelTelemetryService(this.tracer, endpoint);
  }

  async invoke<T>(
    rawInvoke: DesktopRawInvoke,
    command: string,
    payload: Record<string, unknown> = {},
  ): Promise<T> {
    const operation = classifyDesktopTelemetryOperation(command, payload);
    if (!operation) {
      return rawInvoke<T>(command, createDesktopInvokeEnvelope(payload));
    }

    const span = this.tracer.startSpan("desktop.bridge.request", {
      attributes: {
        "lapis.operation.scope": operation.scope,
        "lapis.operation.name": operation.operation,
      },
    });
    try {
      const result = await rawInvoke<T>(
        command,
        createDesktopInvokeEnvelope(payload, createTraceCarrier(span)),
      );
      const resultCount = readTelemetryResultCount(result);
      if (resultCount !== undefined) {
        span.setAttribute("lapis.result.count", resultCount);
      }
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const name = safeErrorName(error);
      span.recordException({ name, message: name });
      span.setStatus({ code: SpanStatusCode.ERROR, message: name });
      throw error;
    } finally {
      span.end();
    }
  }

  async log(
    rawInvoke: DesktopRawInvoke,
    level: DesktopTelemetryLogLevel,
    event: string,
    attributes?: TelemetryAttributes,
  ): Promise<void> {
    await this.invoke(rawInvoke, "desktop_telemetry_log", {
      level,
      event,
      attributes: attributes ?? {},
    });
  }

  async shutdown(): Promise<void> {
    this.shutdownPromise ??= (async () => {
      await this.provider.forceFlush();
      await this.provider.shutdown();
    })();
    await this.shutdownPromise;
  }
}

export function createOtelDesktopRendererTelemetry(
  options: OtelDesktopRendererTelemetryOptions,
): DesktopRendererTelemetryController {
  const exporter =
    options.exporter ?? new OTLPTraceExporter({ url: options.endpoint });
  const spanProcessor = options.exporter
    ? new SimpleSpanProcessor(exporter)
    : new BatchSpanProcessor(exporter);
  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      "service.name": options.serviceName,
      "service.namespace": "lapismd",
      "service.version": options.version,
      "deployment.environment.name": "local",
    }),
    spanProcessors: [spanProcessor],
  });
  if (options.registerGlobal !== false) provider.register();
  return new OtelDesktopRendererTelemetry(
    provider,
    options.endpoint,
    options.version,
  );
}
