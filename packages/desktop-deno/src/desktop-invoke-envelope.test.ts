import { describe, expect, it } from "vitest";

import {
  createDesktopInvokeEnvelope,
  unwrapDesktopInvokeEnvelope,
} from "./desktop-invoke-envelope";

const TRACE = {
  traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  tracestate: "vendor=value",
};

describe("desktop invocation envelope", () => {
  it("round-trips business payload and W3C trace context separately", () => {
    const result = unwrapDesktopInvokeEnvelope(
      createDesktopInvokeEnvelope({ method: "searchDocuments" }, TRACE),
    );

    expect(result).toEqual({
      payload: { method: "searchDocuments" },
      trace: TRACE,
      enveloped: true,
    });
    expect(result.payload).not.toHaveProperty("traceparent");
  });

  it("accepts legacy payloads without adding telemetry metadata", () => {
    const payload = { method: "searchDocuments" };
    expect(unwrapDesktopInvokeEnvelope(payload)).toEqual({
      payload,
      enveloped: false,
    });
  });

  it.each([
    { __lapisDesktopInvoke: { version: 2, payload: {} } },
    { __lapisDesktopInvoke: { version: 1, payload: "content" } },
    {
      __lapisDesktopInvoke: {
        version: 1,
        payload: {},
        trace: { traceparent: "invalid" },
      },
    },
  ])("rejects malformed reserved envelopes", (payload) => {
    expect(() => unwrapDesktopInvokeEnvelope(payload)).toThrow();
  });
});
