import { DateTime } from "luxon";
import type { MetadataType } from "./metadata.svelte";

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;
const DATETIME_PATTERN =
  /^([0-9]{4})-?(1[0-2]|0[1-9])-?(3[01]|0[1-9]|[12][0-9])[T ](2[0-3]|[01][0-9]):?([0-5][0-9])(:?([0-5][0-9]))?$/;

function coerceCheckbox(value: unknown): unknown {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }

  return value;
}

function coerceNumber(value: unknown): unknown {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return value;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return value;
}

function matchesDate(value: unknown): boolean {
  return typeof value === "string" && DATE_PATTERN.test(value.trim());
}

function matchesDateTime(value: unknown): boolean {
  return typeof value === "string" && DATETIME_PATTERN.test(value.trim());
}

function coerceDate(value: unknown): unknown {
  if (matchesDate(value)) {
    return typeof value === "string" ? value.trim() : value;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (value instanceof DateTime) {
    return value.toISODate() ?? value;
  }

  return value;
}

function coerceDateTime(value: unknown): unknown {
  if (matchesDateTime(value)) {
    return typeof value === "string" ? value.trim() : value;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 19);
  }

  if (value instanceof DateTime) {
    return value.toISO()?.slice(0, 19) ?? value;
  }

  return value;
}

function coerceStringList(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) {
      return value;
    }
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return [];
    }

    if (/[,;]/.test(trimmed)) {
      return trimmed
        .split(/[,;]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }

    return [trimmed];
  }

  return value;
}

const TAGS_PATTERN = /^(#[/a-zA-Z0-9_-]+\s*,\s*)*(#[/a-zA-Z0-9_-]+\s*)?$/;

function isPrimitiveMetadataArray(value: unknown[]): boolean {
  return value.every(
    (item) => typeof item === "string" || typeof item === "number",
  );
}

/** Infer a metadata type from a raw frontmatter value. */
export function inferMetadataType(value: unknown): MetadataType {
  if (typeof value === "number") {
    return "number";
  } else if (value instanceof Date) {
    return "date";
  } else if (value instanceof DateTime) {
    return "datetime";
  } else if (typeof value === "boolean") {
    return "checkbox";
  } else if (typeof value === "string") {
    if (["true", "false"].includes(value.toLowerCase().trim())) {
      return "checkbox";
    } else if (value.match(TAGS_PATTERN)) {
      return "tags";
    } else if (value.trim().match(DATE_PATTERN)) {
      return "date";
    } else if (value.trim().match(DATETIME_PATTERN)) {
      return "datetime";
    } else if (value.trim().match(/^[0-9]+$/)) {
      return "number";
    }
    return "text";
  } else if (Array.isArray(value)) {
    return isPrimitiveMetadataArray(value) ? "multitext" : "array";
  } else if (value === undefined || value === null) {
    return "text";
  } else if (typeof value === "object") {
    return "object";
  }

  return "unknown";
}

/** Infer a metadata type from a top-level frontmatter property name and value. */
export function inferMetadataPropertyType(
  name: string,
  value: unknown,
): MetadataType {
  const id = name.toLowerCase().trim();
  if (id === "tags" || id === "tag") {
    return "tags";
  }
  if (id === "aliases" || id === "alias") {
    return "aliases";
  }
  return inferMetadataType(value);
}

/**
 * Best-effort normalization of a frontmatter value against a declared metadata
 * type. Coerces when unambiguous; otherwise returns the original value.
 */
export function normalizeMetadataValue(
  type: MetadataType,
  value: unknown,
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  switch (type) {
    case "checkbox":
      return coerceCheckbox(value);
    case "number":
      return coerceNumber(value);
    case "date":
      return coerceDate(value);
    case "datetime":
      return coerceDateTime(value);
    case "aliases":
    case "multitext":
    case "tags":
      return coerceStringList(value);
    case "array":
    case "object":
    case "text":
    case "unknown":
    default:
      return value;
  }
}
