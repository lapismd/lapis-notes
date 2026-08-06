import { PluginDistributionError } from "./errors";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export const canonicalJson = (value: unknown): string =>
  serializeCanonicalJson(value, "$");

const serializeCanonicalJson = (value: unknown, path: string): string => {
  if (value === null) return "null";

  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw invalidCanonicalValue(path, "Numbers must be finite");
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value
      .map((item, index) => serializeCanonicalJson(item, `${path}[${index}]`))
      .join(",")}]`;
  }

  if (typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      throw invalidCanonicalValue(path, "Only plain objects are supported");
    }

    const objectValue = value as Record<string, JsonValue | undefined>;
    const entries = Object.keys(objectValue)
      .sort()
      .map((key) => {
        const child = objectValue[key];
        if (typeof child === "undefined") {
          throw invalidCanonicalValue(
            `${path}.${key}`,
            "Undefined values are not supported",
          );
        }
        return `${JSON.stringify(key)}:${serializeCanonicalJson(
          child,
          `${path}.${key}`,
        )}`;
      });
    return `{${entries.join(",")}}`;
  }

  throw invalidCanonicalValue(path, `${typeof value} values are not supported`);
};

const invalidCanonicalValue = (path: string, reason: string) =>
  new PluginDistributionError(
    "canonical-json-invalid",
    `Cannot canonicalize JSON at ${path}: ${reason}.`,
    { details: { path, reason } },
  );
