import { expect, it } from "vitest";
import { decodeSyncValue, encodeSyncValue } from "./sync-security-protocol";

it("preserves exact canonical byte frames with native base64 or the portable fallback", () => {
  const bytes = new Uint8Array(256 * 1024);
  for (let index = 0; index < bytes.length; index++) bytes[index] = index % 251;
  const expected = encodeSyncValue(bytes);
  const encoder = Object.getOwnPropertyDescriptor(
      Uint8Array.prototype,
      "toBase64"
    ),
    decoder = Object.getOwnPropertyDescriptor(Uint8Array, "fromBase64"),
    buffer = Object.getOwnPropertyDescriptor(globalThis, "Buffer");
  try {
    Object.defineProperty(Uint8Array.prototype, "toBase64", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Uint8Array, "fromBase64", {
      configurable: true,
      value: undefined,
    });
    expect(encodeSyncValue(bytes)).toBe(expected);
    expect(decodeSyncValue(expected)).toEqual(bytes);
    expect(() => decodeSyncValue('["bytes","AQ"]')).toThrow(
      "Invalid native Sync payload"
    );
    const decoded = decodeSyncValue(
      encodeSyncValue(bytes.subarray(3, 7))
    ) as Uint8Array;
    expect(decoded).toEqual(bytes.subarray(3, 7));
    expect(decoded.byteOffset).toBe(0);
    expect(decoded.buffer.byteLength).toBe(decoded.byteLength);
    Object.defineProperty(globalThis, "Buffer", {
      configurable: true,
      value: undefined,
    });
    expect(encodeSyncValue(bytes)).toBe(expected);
    expect(decodeSyncValue(expected)).toEqual(bytes);
    expect(() => decodeSyncValue('["bytes","AQ"]')).toThrow(
      "Invalid native Sync payload"
    );
  } finally {
    if (buffer) Object.defineProperty(globalThis, "Buffer", buffer);
    else Reflect.deleteProperty(globalThis, "Buffer");
    if (encoder)
      Object.defineProperty(Uint8Array.prototype, "toBase64", encoder);
    else Reflect.deleteProperty(Uint8Array.prototype, "toBase64");
    if (decoder) Object.defineProperty(Uint8Array, "fromBase64", decoder);
    else Reflect.deleteProperty(Uint8Array, "fromBase64");
  }
  expect(encodeSyncValue(bytes)).toBe(expected);
  expect(decodeSyncValue(expected)).toEqual(bytes);
});
import { classifyDesktopTelemetryOperation } from "./telemetry-operations";

it.each([
  "desktop_sync_security_open",
  "desktop_sync_security_call",
  "desktop_sync_security_close",
  "desktop_sync_wrapping_key_get",
])("excludes %s from renderer and native operation telemetry", (command) => {
  expect(
    classifyDesktopTelemetryOperation(command, {
      passphrase: "private recovery phrase",
      args: "private content",
    })
  ).toBeNull();
});

it("round-trips binary security results and prototype-shaped metadata through JSON", () => {
  const metadata = JSON.parse(
    '{"__proto__":{"safe":true},"constructor":"note.md","tag":["bytes","aGVsbG8="],"objectTag":{"$syncBytes":"aGVsbG8="}}'
  );
  const value = {
    bytes: new Uint8Array([0, 127, 255]),
    metadata,
    missing: undefined,
    empty: null,
  };
  const decoded = decodeSyncValue(
    JSON.parse(JSON.stringify(encodeSyncValue(value)))
  ) as typeof value;
  expect(decoded).toEqual(value);
  expect(Object.getPrototypeOf(decoded.metadata)).toBe(Object.prototype);
  expect(({} as { safe?: unknown }).safe).toBeUndefined();
});

it.each([NaN, Infinity, 1n, () => 1, new Date(0)])(
  "rejects nonportable values without exposing them (%s)",
  (value) => {
    expect(() => encodeSyncValue(value)).toThrow("Invalid native Sync payload");
  }
);

it.each([
  "secret malformed JSON",
  '["bytes","not base64!"]',
  '["record",[["x",["null"]],["x",["null"]]]]',
  '["number",null]',
])("rejects malformed wire values with a content-free error", (value) => {
  expect(() => decodeSyncValue(value)).toThrow("Invalid native Sync payload");
});

it("bounds nested and cyclic metadata", () => {
  const cycle: unknown[] = [];
  cycle.push(cycle);
  expect(() => encodeSyncValue(cycle)).toThrow("Invalid native Sync payload");
  let deep: unknown = null;
  for (let i = 0; i < 40; i++) deep = [deep];
  expect(() => encodeSyncValue(deep)).toThrow("Invalid native Sync payload");
});
