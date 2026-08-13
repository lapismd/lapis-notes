import type { CompleteCvSource } from "../form/complete-cv-form.types";
import type { CvSource } from "./types";

export function toCvSource(source: CompleteCvSource): CvSource {
  return source as unknown as CvSource;
}

export function toCompleteCvSource(source: CvSource): CompleteCvSource {
  return source as unknown as CompleteCvSource;
}
