import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
  BasicTracerProvider,
} from "@opentelemetry/sdk-trace-base";
import { describe, expect, it, vi } from "vitest";

import {
  createNativeDesktopTelemetry,
  writeStructuredRendererLog,
} from "./native-telemetry";

function fakeMeter() {
  return {
    createHistogram: vi.fn(() => ({ record: vi.fn() })),
    createCounter: vi.fn(() => ({ add: vi.fn() })),
  };
}

describe("native desktop telemetry", () => {
  it("continues a renderer W3C trace without recording business payload", async () => {
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    const telemetry = createNativeDesktopTelemetry({
      tracer: provider.getTracer("test"),
      meter: fakeMeter() as never,
      now: (() => {
        let value = 0;
        return () => ++value;
      })(),
    });
    const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
    const parentSpanId = "00f067aa0ba902b7";

    await expect(
      telemetry.run(
        { scope: "database", operation: "searchDocuments" },
        { traceparent: `00-${traceId}-${parentSpanId}-01` },
        async () => [{ path: "private.md" }],
      ),
    ).resolves.toHaveLength(1);
    await provider.forceFlush();

    const [span] = exporter.getFinishedSpans();
    expect(span.spanContext().traceId).toBe(traceId);
    expect(span.parentSpanContext?.spanId).toBe(parentSpanId);
    expect(span.attributes).toMatchObject({
      "lapis.operation.scope": "database",
      "lapis.operation.name": "searchDocuments",
      "lapis.result.count": 1,
    });
    expect(JSON.stringify(span.attributes)).not.toContain("private.md");
  });

  it("does not create spans for excluded high-volume operations", async () => {
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    const telemetry = createNativeDesktopTelemetry({
      tracer: provider.getTracer("test"),
      meter: fakeMeter() as never,
    });
    expect(telemetry.run(null, undefined, () => "written")).toBe("written");
    await provider.forceFlush();
    expect(exporter.getFinishedSpans()).toHaveLength(0);
  });

  it("accepts only bounded structured renderer logs", () => {
    const logger = {
      level: "info" as const,
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    writeStructuredRendererLog(
      {
        level: "info",
        event: "desktop.session.ready",
        attributes: {
          status: "ready",
          "files.total": 20,
          query: "secret query",
        },
      },
      logger,
    );
    expect(logger.info).toHaveBeenCalledWith(
      "[desktop-telemetry] desktop.session.ready",
      { status: "ready", "files.total": 20 },
    );
    expect(() =>
      writeStructuredRendererLog(
        { level: "info", event: "arbitrary.user.message" },
        logger,
      ),
    ).toThrow("Invalid desktop telemetry log event");
  });
});
