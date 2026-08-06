import { writable, type Readable } from "svelte/store";

export type TelemetryAttributeValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type TelemetryAttributes = Record<string, TelemetryAttributeValue>;

export interface TelemetrySpanOptions {
  attributes?: TelemetryAttributes;
  parent?: TelemetrySpan | null;
  slowThresholdMs?: number;
}

export interface TelemetryMeasurementOptions extends TelemetrySpanOptions {}

export interface TelemetrySpan {
  readonly name: string;
  readonly startedAt: number;

  setAttribute(name: string, value: TelemetryAttributeValue): void;
  addEvent(name: string, attributes?: TelemetryAttributes): void;
  recordException(error: unknown, attributes?: TelemetryAttributes): void;
  end(attributes?: TelemetryAttributes): void;
}

export interface TelemetryMeasurement {
  name: string;
  value: number;
  unit?: string;
  attributes?: TelemetryAttributes;
}

export interface TelemetryConfiguration {
  enabled: boolean;
  captureWebVitals: boolean;
  debugLogging: boolean;
  persistDiagnostics: boolean;
  sampleRate: number;
  slowSpanThresholdMs: number;
  otlpEndpoint?: string;
}

export interface TelemetryDiagnosticSpan {
  id: number;
  name: string;
  durationMs: number;
  capturedAt: number;
  attributes: TelemetryAttributes;
}

export interface TelemetryDiagnosticTraceSpan {
  id: string;
  traceId: string;
  parentSpanId: string | null;
  name: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  attributes: TelemetryAttributes;
  isSlow: boolean;
  status: "ok" | "error";
  errorMessage?: string;
}

export interface TelemetryDiagnosticTrace {
  id: string;
  rootSpanId: string | null;
  rootSpanName: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  spanCount: number;
  slowSpanCount: number;
  spans: TelemetryDiagnosticTraceSpan[];
}

export interface TelemetryDiagnosticMeasurement {
  id: number;
  name: string;
  value: number;
  unit: string;
  capturedAt: number;
  attributes: TelemetryAttributes;
  kind: "measurement" | "web-vital";
}

export interface TelemetryDiagnosticsSnapshot {
  enabled: boolean;
  debugLogging: boolean;
  captureWebVitals: boolean;
  sampleRate: number;
  slowSpanThresholdMs: number;
  otlpConfigured: boolean;
  recentSlowSpans: TelemetryDiagnosticSpan[];
  recentTraces: TelemetryDiagnosticTrace[];
  recentMeasurements: TelemetryDiagnosticMeasurement[];
}

export function createTelemetryDiagnosticsSnapshot(
  overrides: Partial<TelemetryDiagnosticsSnapshot> = {},
): TelemetryDiagnosticsSnapshot {
  return {
    enabled: false,
    debugLogging: false,
    captureWebVitals: false,
    sampleRate: 1,
    slowSpanThresholdMs: 250,
    otlpConfigured: false,
    recentSlowSpans: [],
    recentTraces: [],
    recentMeasurements: [],
    ...overrides,
  };
}

export function createTelemetryConfiguration(
  overrides: Partial<TelemetryConfiguration> = {},
): TelemetryConfiguration {
  return {
    enabled: false,
    captureWebVitals: false,
    debugLogging: false,
    persistDiagnostics: false,
    sampleRate: 1,
    slowSpanThresholdMs: 250,
    ...overrides,
  };
}

export interface TelemetryService {
  enabled: boolean;
  readonly diagnostics: Readable<TelemetryDiagnosticsSnapshot>;
  getConfiguration(): TelemetryConfiguration;
  configure(config: Partial<TelemetryConfiguration>): void | Promise<void>;
  clearDiagnostics(): void | Promise<void>;

  startSpan(name: string, options?: TelemetrySpanOptions): TelemetrySpan;
  measure<T>(
    name: string,
    callback: (span: TelemetrySpan) => T,
    options?: TelemetryMeasurementOptions,
  ): T;
  measureAsync<T>(
    name: string,
    callback: (span: TelemetrySpan) => Promise<T>,
    options?: TelemetryMeasurementOptions,
  ): Promise<T>;
  recordEvent(name: string, attributes?: TelemetryAttributes): void;
  recordMeasurement(measurement: TelemetryMeasurement): void;
  dispose?(): void;
}

class NoopTelemetrySpan implements TelemetrySpan {
  readonly startedAt = performance.now();

  constructor(readonly name: string) {}

  setAttribute(_name: string, _value: TelemetryAttributeValue): void {}

  addEvent(_name: string, _attributes?: TelemetryAttributes): void {}

  recordException(_error: unknown, _attributes?: TelemetryAttributes): void {}

  end(_attributes?: TelemetryAttributes): void {}
}

export class NoopTelemetryService implements TelemetryService {
  enabled = false;
  readonly diagnostics: Readable<TelemetryDiagnosticsSnapshot>;
  private readonly diagnosticsStore;
  private config: TelemetryConfiguration;

  constructor(config: Partial<TelemetryConfiguration> = {}) {
    this.config = createTelemetryConfiguration(config);
    this.enabled = this.config.enabled;
    this.diagnosticsStore = writable(createTelemetryDiagnosticsSnapshot());
    this.diagnostics = { subscribe: this.diagnosticsStore.subscribe };
    this.updateDiagnostics();
  }

  getConfiguration(): TelemetryConfiguration {
    return { ...this.config };
  }

  configure(config: Partial<TelemetryConfiguration>): void {
    this.config = createTelemetryConfiguration({ ...this.config, ...config });
    this.enabled = this.config.enabled;
    this.updateDiagnostics();
  }

  startSpan(name: string): TelemetrySpan {
    return new NoopTelemetrySpan(name);
  }

  measure<T>(
    name: string,
    callback: (span: TelemetrySpan) => T,
    _options?: TelemetryMeasurementOptions,
  ): T {
    const span = this.startSpan(name);
    try {
      return callback(span);
    } catch (error) {
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  async measureAsync<T>(
    name: string,
    callback: (span: TelemetrySpan) => Promise<T>,
    _options?: TelemetryMeasurementOptions,
  ): Promise<T> {
    const span = this.startSpan(name);
    try {
      return await callback(span);
    } catch (error) {
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  recordEvent(_name: string, _attributes?: TelemetryAttributes): void {}

  recordMeasurement(_measurement: TelemetryMeasurement): void {}

  dispose(): void {}

  private updateDiagnostics(): void {
    this.diagnosticsStore.set(
      createTelemetryDiagnosticsSnapshot({
        enabled: this.config.enabled,
        debugLogging: this.config.debugLogging,
        captureWebVitals: this.config.captureWebVitals,
        sampleRate: this.config.sampleRate,
        slowSpanThresholdMs: this.config.slowSpanThresholdMs,
        otlpConfigured: !!this.config.otlpEndpoint,
      }),
    );
  }

  clearDiagnostics(): void {
    this.updateDiagnostics();
  }
}
