import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import { normalizeCvSource } from "./normalize";
import type { CvSource } from "./types";

export type ParsedCvYaml =
  | { ok: true; source: CvSource; error: null }
  | { ok: false; source: null; error: string };

export function parseCvYaml(text: string): ParsedCvYaml {
  try {
    const parsed = parseYaml(text);
    return { ok: true, source: normalizeCvSource(parsed), error: null };
  } catch (error) {
    return {
      ok: false,
      source: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function stringifyCvSource(source: CvSource): string {
  return stringifyYaml(source, { lineWidth: 90 });
}
