export type DesktopTraceContext = {
  traceparent: string;
  tracestate?: string;
};

export type DesktopInvokeEnvelope = {
  __lapisDesktopInvoke: {
    version: 1;
    payload: Record<string, unknown>;
    trace?: DesktopTraceContext;
  };
};

const TRACEPARENT_PATTERN = /^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateDesktopTraceContext(
  value: unknown,
): DesktopTraceContext | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value) || typeof value.traceparent !== "string") {
    throw new Error("Invalid desktop telemetry trace context");
  }
  const traceparent = value.traceparent.toLowerCase();
  if (!TRACEPARENT_PATTERN.test(traceparent)) {
    throw new Error("Invalid desktop telemetry traceparent");
  }
  const [, traceId, spanId] = traceparent.split("-");
  if (/^0+$/u.test(traceId) || /^0+$/u.test(spanId)) {
    throw new Error("Invalid zero desktop telemetry trace identifier");
  }
  const tracestate = value.tracestate;
  if (
    tracestate !== undefined &&
    (typeof tracestate !== "string" ||
      tracestate.length > 512 ||
      /[\r\n]/u.test(tracestate))
  ) {
    throw new Error("Invalid desktop telemetry tracestate");
  }
  return tracestate ? { traceparent, tracestate } : { traceparent };
}

export function createDesktopInvokeEnvelope(
  payload: Record<string, unknown> = {},
  trace?: DesktopTraceContext,
): DesktopInvokeEnvelope {
  return {
    __lapisDesktopInvoke: {
      version: 1,
      payload,
      ...(trace ? { trace: validateDesktopTraceContext(trace) } : {}),
    },
  };
}

export function unwrapDesktopInvokeEnvelope(value: Record<string, unknown>): {
  payload: Record<string, unknown>;
  trace?: DesktopTraceContext;
  enveloped: boolean;
} {
  if (!("__lapisDesktopInvoke" in value)) {
    return { payload: value, enveloped: false };
  }
  const envelope = value.__lapisDesktopInvoke;
  if (
    !isRecord(envelope) ||
    envelope.version !== 1 ||
    !isRecord(envelope.payload)
  ) {
    throw new Error("Invalid desktop invocation envelope");
  }
  return {
    payload: envelope.payload,
    trace: validateDesktopTraceContext(envelope.trace),
    enveloped: true,
  };
}
