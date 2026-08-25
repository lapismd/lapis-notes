const DEFAULT_OTLP_ENDPOINT = "http://127.0.0.1:4318";
const DEFAULT_NATIVE_SERVICE_NAME = "lapis-notes-desktop";
const DEFAULT_RENDERER_SERVICE_NAME = "lapis-notes-renderer";
const RENDERER_TELEMETRY_ENVIRONMENT_KEYS = [
  "VITE_LAPIS_DESKTOP_TELEMETRY",
  "VITE_LAPIS_DESKTOP_OTLP_TRACES_ENDPOINT",
  "VITE_LAPIS_DESKTOP_TELEMETRY_SERVICE_NAME",
  "VITE_LAPIS_DESKTOP_TELEMETRY_VERSION",
];

function normalizeLoopbackEndpoint(value) {
  const endpoint = new URL(value);
  if (endpoint.protocol !== "http:") {
    throw new Error(
      `Desktop telemetry is local-only and requires an HTTP loopback OTLP endpoint, received ${endpoint.protocol}`,
    );
  }
  if (endpoint.hostname !== "127.0.0.1" && endpoint.hostname !== "localhost") {
    throw new Error(
      `Desktop telemetry is local-only; refusing non-loopback OTLP host ${endpoint.hostname}`,
    );
  }
  endpoint.pathname = endpoint.pathname.replace(/\/$/u, "");
  endpoint.search = "";
  endpoint.hash = "";
  return endpoint.toString().replace(/\/$/u, "");
}

function mergeResourceAttributes(current, required) {
  const entries = current
    ? current
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
  const keys = new Set(
    entries.map((entry) => entry.slice(0, entry.indexOf("="))).filter(Boolean),
  );
  for (const [key, value] of Object.entries(required)) {
    if (!keys.has(key)) entries.push(`${key}=${value}`);
  }
  return entries.join(",");
}

export function createDesktopTelemetryEnvironment(
  sourceEnvironment,
  { enabled, version },
) {
  const environment = { ...sourceEnvironment };
  if (!enabled) return environment;

  const endpoint = normalizeLoopbackEndpoint(
    environment.OTEL_EXPORTER_OTLP_ENDPOINT ?? DEFAULT_OTLP_ENDPOINT,
  );
  const nativeServiceName =
    environment.OTEL_SERVICE_NAME ?? DEFAULT_NATIVE_SERVICE_NAME;
  const rendererServiceName =
    environment.LAPIS_DESKTOP_RENDERER_OTEL_SERVICE_NAME ??
    DEFAULT_RENDERER_SERVICE_NAME;

  environment.LAPIS_DESKTOP_TELEMETRY = "1";
  environment.OTEL_DENO ??= "true";
  environment.OTEL_SERVICE_NAME = nativeServiceName;
  environment.OTEL_EXPORTER_OTLP_PROTOCOL ??= "http/protobuf";
  environment.OTEL_EXPORTER_OTLP_ENDPOINT = endpoint;
  environment.OTEL_DENO_CONSOLE ??= "capture";
  environment.OTEL_RESOURCE_ATTRIBUTES = mergeResourceAttributes(
    environment.OTEL_RESOURCE_ATTRIBUTES,
    {
      "service.namespace": "lapismd",
      "service.version": version,
      "deployment.environment.name": "local",
    },
  );

  environment.VITE_LAPIS_DESKTOP_TELEMETRY = "1";
  environment.VITE_LAPIS_DESKTOP_OTLP_TRACES_ENDPOINT = `${endpoint}/v1/traces`;
  environment.VITE_LAPIS_DESKTOP_TELEMETRY_SERVICE_NAME = rendererServiceName;
  environment.VITE_LAPIS_DESKTOP_TELEMETRY_VERSION = version;
  return environment;
}

export function isDesktopTelemetryRequested(arguments_) {
  return arguments_.includes("--telemetry");
}

export function createDesktopRendererTelemetryDefines(
  environment,
  enabled,
) {
  return Object.fromEntries(
    RENDERER_TELEMETRY_ENVIRONMENT_KEYS.map((name) => {
      const value = enabled ? environment[name] : undefined;
      return [
        `import.meta.env.${name}`,
        value === undefined ? "undefined" : JSON.stringify(value),
      ];
    }),
  );
}
