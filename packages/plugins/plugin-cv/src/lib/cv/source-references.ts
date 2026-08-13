import type { CvSource } from "./types";

const SOURCE_REFERENCE_MARKER = /[ \t]*\[\^[A-Za-z0-9_/-]+\]/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeSourceRefs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

export function stripSourceReferenceMarkers(value: string): string {
  return value
    .replace(SOURCE_REFERENCE_MARKER, "")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}

function stripMarkersFromValue(value: unknown): unknown {
  if (typeof value === "string") return stripSourceReferenceMarkers(value);
  if (Array.isArray(value)) return value.map((item) => stripMarkersFromValue(item));
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, stripMarkersFromValue(item)]),
  );
}

export function sourceWithoutSourceReferenceMarkers(source: CvSource): CvSource {
  return {
    ...source,
    cv: stripMarkersFromValue(source.cv) as CvSource["cv"],
  };
}
