import { InMemorySpanExporter } from "@opentelemetry/sdk-trace-base";
import { describe, expect, it, vi } from "vitest";

import { createDesktopRendererTelemetry } from "./renderer-telemetry";
import type { DesktopRawInvoke } from "./renderer-telemetry";
import { createOtelDesktopRendererTelemetry } from "./renderer-telemetry-otel";

describe("desktop renderer telemetry", () => {
  it("keeps disabled mode no-op and payload-compatible", async () => {
    const telemetry = await createDesktopRendererTelemetry({
      enabled: false,
      version: "1.0.0",
    });
    const invoke = vi.fn(async (_command, payload) => payload);

    await expect(
      telemetry.invoke(invoke, "desktop_app_database_open", {
        databaseId: "db",
      }),
    ).resolves.toEqual({ databaseId: "db" });
    expect(telemetry.service.enabled).toBe(false);
    expect(invoke).toHaveBeenCalledWith("desktop_app_database_open", {
      databaseId: "db",
    });
  });

  it("exports selected bridge spans and keeps trace context outside business payload", async () => {
    const exporter = new InMemorySpanExporter();
    const telemetry = createOtelDesktopRendererTelemetry({
      endpoint: "http://127.0.0.1:4318/v1/traces",
      serviceName: "lapis-notes-renderer",
      version: "1.0.0",
      exporter,
      registerGlobal: false,
    });
    const invoke = vi.fn(async (_command, envelope) => {
      const wrapped = envelope?.__lapisDesktopInvoke;
      expect(wrapped.payload).toEqual({
        method: "searchDocuments",
        args: [],
      });
      expect(wrapped.payload).not.toHaveProperty("traceparent");
      expect(wrapped.trace.traceparent).toMatch(/^00-[0-9a-f-]+$/u);
      return [{ path: "not-exported.md" }];
    });

    await telemetry.invoke(
      invoke as DesktopRawInvoke,
      "desktop_app_database_invoke",
      {
        method: "searchDocuments",
        args: [],
      },
    );

    const [span] = exporter.getFinishedSpans();
    expect(span.name).toBe("desktop.bridge.request");
    expect(span.attributes).toMatchObject({
      "lapis.operation.scope": "database",
      "lapis.operation.name": "searchDocuments",
      "lapis.result.count": 1,
    });
    expect(span.resource.attributes).toMatchObject({
      "service.name": "lapis-notes-renderer",
      "service.namespace": "lapismd",
      "service.version": "1.0.0",
      "deployment.environment.name": "local",
    });
    expect(JSON.stringify(span.attributes)).not.toContain("not-exported.md");
    await telemetry.shutdown();
  });

  it("records sanitized errors and flushes service spans", async () => {
    const exporter = new InMemorySpanExporter();
    const telemetry = createOtelDesktopRendererTelemetry({
      endpoint: "http://127.0.0.1:4318/v1/traces",
      serviceName: "lapis-notes-renderer",
      version: "1.0.0",
      exporter,
      registerGlobal: false,
    });

    await expect(
      telemetry.invoke(
        async () => {
          throw new TypeError("private vault content");
        },
        "desktop_ls_diagnostics",
        {},
      ),
    ).rejects.toThrow("private vault content");
    telemetry.service.recordMeasurement({ name: "startup", value: 12 });

    const spans = exporter.getFinishedSpans();
    const serialized = JSON.stringify(
      spans.map((span) => ({
        name: span.name,
        attributes: span.attributes,
        events: span.events,
        status: span.status,
      })),
    );
    expect(serialized).toContain("TypeError");
    expect(serialized).not.toContain("private vault content");
    expect(serialized).toContain("metric.startup");
    await telemetry.shutdown();
  });
});
