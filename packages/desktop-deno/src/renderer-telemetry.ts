import {
  NoopTelemetryService,
  type TelemetryAttributes,
  type TelemetryService,
} from "@lapis-notes/api/telemetry";

export type DesktopRawInvoke = <T = unknown>(
  command: string,
  payload?: Record<string, unknown>,
) => Promise<T>;

export type DesktopTelemetryLogLevel = "info" | "warn" | "error";

export interface DesktopRendererTelemetryController {
  readonly enabled: boolean;
  readonly service: TelemetryService;
  invoke<T>(
    rawInvoke: DesktopRawInvoke,
    command: string,
    payload?: Record<string, unknown>,
  ): Promise<T>;
  log(
    rawInvoke: DesktopRawInvoke,
    level: DesktopTelemetryLogLevel,
    event: string,
    attributes?: TelemetryAttributes,
  ): Promise<void>;
  shutdown(): Promise<void>;
}

export type DesktopRendererTelemetryOptions = {
  enabled: boolean;
  endpoint?: string;
  serviceName?: string;
  version: string;
  rawInvoke?: DesktopRawInvoke;
};

class DisabledDesktopRendererTelemetry
  implements DesktopRendererTelemetryController
{
  readonly enabled = false;
  readonly service = new NoopTelemetryService();

  invoke<T>(
    rawInvoke: DesktopRawInvoke,
    command: string,
    payload?: Record<string, unknown>,
  ): Promise<T> {
    return rawInvoke<T>(command, payload);
  }

  async log(
    _rawInvoke: DesktopRawInvoke,
    _level: DesktopTelemetryLogLevel,
    _event: string,
    _attributes?: TelemetryAttributes,
  ): Promise<void> {}

  async shutdown(): Promise<void> {}
}

export async function createDesktopRendererTelemetry(
  options: DesktopRendererTelemetryOptions,
): Promise<DesktopRendererTelemetryController> {
  if (!options.enabled) return new DisabledDesktopRendererTelemetry();
  if (!options.endpoint || !options.serviceName) {
    throw new Error("Desktop renderer telemetry configuration is incomplete");
  }
  const { createOtelDesktopRendererTelemetry } = await import(
    "./renderer-telemetry-otel"
  );
  return createOtelDesktopRendererTelemetry({
    endpoint: options.endpoint,
    serviceName: options.serviceName,
    version: options.version,
    rawInvoke: options.rawInvoke,
  });
}
