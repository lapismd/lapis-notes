/** Every wire node is tagged, including records, so user metadata cannot impersonate bytes. */
export const SYNC_SECURITY_METHODS = {
  crypto: [
    "status",
    "enrollNewVault",
    "requestUnlock",
    "getDevicePublicKey",
    "encryptObject",
    "decryptObject",
    "calculateContentId",
    "signEvent",
    "signDeviceEvent",
  ],
  syncIdentity: [
    "status",
    "initialize",
    "signEvent",
    "beginRotation",
    "commitRotation",
    "cancelRotation",
  ],
  pairing: [
    "beginOwner",
    "acceptInvite",
    "ingest",
    "confirm",
    "cancel",
    "createRelayProbe",
  ],
  membership: [
    "getSnapshot",
    "ingest",
    "renameDevice",
    "revokeDevice",
    "recoverOwner",
  ],
  recovery: ["exportBundle", "importBundle"],
} as const;
export type SyncSecurityGroup = keyof typeof SYNC_SECURITY_METHODS;
const MAX_CHARS = 48 * 1024 * 1024;
const MAX_BYTES = 32 * 1024 * 1024;
const invalid = () => new Error("Invalid native Sync payload");

function encodeBase64(bytes: Uint8Array): string {
  const native = (
    Uint8Array.prototype as Uint8Array & { toBase64?: () => string }
  ).toBase64;
  if (typeof native === "function") return native.call(bytes);
  const chunks: string[] = [];
  for (let start = 0; start < bytes.length; start += 16_384)
    chunks.push(String.fromCharCode(...bytes.subarray(start, start + 16_384)));
  return btoa(chunks.join(""));
}

function decodeBase64(value: string): Uint8Array {
  const native = (
    Uint8Array as typeof Uint8Array & {
      fromBase64?: (value: string) => Uint8Array;
    }
  ).fromBase64;
  const bytes =
    typeof native === "function"
      ? native.call(Uint8Array, value)
      : Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  if (bytes.length > MAX_BYTES || encodeBase64(bytes) !== value)
    throw invalid();
  return bytes;
}

export function encodeSyncValue(value: unknown): string {
  let nodes = 0,
    chars = 0;
  const seen = new Set<object>();
  const visit = (value: unknown, depth: number): unknown => {
    if (++nodes > 100_000 || depth > 32) throw invalid();
    if (value === null) return ["null"];
    if (value === undefined) return ["undefined"];
    if (typeof value === "boolean") return ["boolean", value];
    if (typeof value === "number" && Number.isFinite(value))
      return ["number", value];
    if (typeof value === "string") {
      chars += value.length;
      if (chars > MAX_CHARS) throw invalid();
      return ["string", value];
    }
    if (value instanceof Uint8Array) {
      if (value.byteLength > MAX_BYTES) throw invalid();
      chars += Math.ceil(value.byteLength / 3) * 4;
      if (chars > MAX_CHARS) throw invalid();
      return ["bytes", encodeBase64(value)];
    }
    if (!value || typeof value !== "object" || seen.has(value)) throw invalid();
    seen.add(value);
    try {
      if (Array.isArray(value))
        return ["array", value.map((item) => visit(item, depth + 1))];
      if (![Object.prototype, null].includes(Object.getPrototypeOf(value)))
        throw invalid();
      return [
        "record",
        Object.entries(value).map(([key, item]) => {
          chars += key.length;
          if (chars > MAX_CHARS) throw invalid();
          return [key, visit(item, depth + 1)];
        }),
      ];
    } finally {
      seen.delete(value);
    }
  };
  const wire = JSON.stringify(visit(value, 0));
  if (wire.length > MAX_CHARS) throw invalid();
  return wire;
}

export function decodeSyncValue(wire: unknown): unknown {
  if (typeof wire !== "string" || wire.length > MAX_CHARS) throw invalid();
  let nodes = 0;
  const visit = (node: unknown, depth: number): unknown => {
    if (++nodes > 100_000 || depth > 32 || !Array.isArray(node))
      throw invalid();
    const [tag, value] = node;
    if (node.length === 1 && tag === "null") return null;
    if (node.length === 1 && tag === "undefined") return undefined;
    if (node.length !== 2) throw invalid();
    if (tag === "boolean" && typeof value === "boolean") return value;
    if (tag === "string" && typeof value === "string") return value;
    if (tag === "number" && typeof value === "number" && Number.isFinite(value))
      return value;
    if (tag === "bytes" && typeof value === "string") {
      if (value.length > Math.ceil(MAX_BYTES / 3) * 4) throw invalid();
      return decodeBase64(value);
    }
    if (tag === "array" && Array.isArray(value))
      return value.map((item) => visit(item, depth + 1));
    if (tag === "record" && Array.isArray(value)) {
      const result: Record<string, unknown> = {};
      for (const entry of value) {
        if (
          !Array.isArray(entry) ||
          entry.length !== 2 ||
          typeof entry[0] !== "string" ||
          Object.hasOwn(result, entry[0])
        )
          throw invalid();
        Object.defineProperty(result, entry[0], {
          value: visit(entry[1], depth + 1),
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      return result;
    }
    throw invalid();
  };
  try {
    return visit(JSON.parse(wire), 0);
  } catch {
    throw invalid();
  }
}

export function isSyncSecurityOperation(
  group: unknown,
  method: unknown,
): group is SyncSecurityGroup {
  return (
    typeof group === "string" &&
    Object.hasOwn(SYNC_SECURITY_METHODS, group) &&
    typeof method === "string" &&
    (
      SYNC_SECURITY_METHODS[group as SyncSecurityGroup] as readonly string[]
    ).includes(method)
  );
}
