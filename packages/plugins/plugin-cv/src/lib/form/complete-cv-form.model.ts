import { parse, stringify } from "yaml";
import { getFormValueAtPath } from "@lapismd/design-core/forms/core";
import { toCompleteCvSource, toCvSource } from "../cv/adapter";
import { parseCvYaml, stringifyCvSource } from "../cv/parse";

import {
  CV_ENTRY_TYPES,
  type AppliedYamlEdit,
  type CompleteCvSource,
  type CvEntry,
  type CvEntryByType,
  type CvEntryType,
  type CvFragment,
  type CvSection,
  type CvStoryTab,
  type FragmentValue,
  type ParsedFragment,
  type PathPart,
  type StoryRecord,
} from "./complete-cv-form.types";

export const ENTRY_TYPE_OPTIONS: Array<{
  value: CvEntryType;
  label: string;
  addLabel: string;
}> = [
  { value: "TextEntry", label: "Text", addLabel: "text" },
  {
    value: "ExperienceEntry",
    label: "Experience Entry",
    addLabel: "experience entry",
  },
  {
    value: "EducationEntry",
    label: "Education Entry",
    addLabel: "education entry",
  },
  {
    value: "PublicationEntry",
    label: "Publication Entry",
    addLabel: "publication entry",
  },
  {
    value: "OneLineEntry",
    label: "One-Line Entry",
    addLabel: "one-line entry",
  },
  { value: "BulletEntry", label: "Bullet Entry", addLabel: "bullet entry" },
  {
    value: "NumberedEntry",
    label: "Numbered Entry",
    addLabel: "numbered entry",
  },
  {
    value: "ReversedNumberedEntry",
    label: "Reversed Numbered Entry",
    addLabel: "reversed numbered entry",
  },
  { value: "NormalEntry", label: "Normal Entry", addLabel: "normal entry" },
];

const UI_DEFAULTS = {
  design: {},
  locale: { language: "english" },
  settings: {
    current_date: "today",
    pdf_title: "NAME - CV",
    bold_keywords: [],
  },
} satisfies Record<Exclude<CvStoryTab, "cv">, StoryRecord>;

export function isRecord(value: unknown): value is StoryRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function cloneSource<T>(source: T): T {
  return JSON.parse(JSON.stringify(source)) as T;
}

export function uniqueId(base: string, existingIds: Iterable<string>): string {
  const normalized =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item";
  const existing = new Set(existingIds);
  if (!existing.has(normalized)) return normalized;
  let suffix = 2;
  while (existing.has(`${normalized}-${suffix}`)) suffix += 1;
  return `${normalized}-${suffix}`;
}

export function entryTypeLabel(entryType: CvEntryType): string {
  return (
    ENTRY_TYPE_OPTIONS.find((option) => option.value === entryType)?.label ??
    entryType
  );
}

export function addEntryLabel(entryType: CvEntryType): string {
  return (
    ENTRY_TYPE_OPTIONS.find((option) => option.value === entryType)?.addLabel ??
    "entry"
  );
}

export function simpleListEntryMarker(
  entryType: CvEntryType,
  index: number,
  total: number,
): string | null {
  if (entryType === "BulletEntry") return "•";
  if (entryType === "NumberedEntry") return `${index + 1}.`;
  if (entryType === "ReversedNumberedEntry") return `${total - index}.`;
  return null;
}

export function defaultEntry<TType extends CvEntryType>(
  entryType: TType,
): CvEntryByType[TType] {
  if (entryType === "TextEntry") return "" as CvEntryByType[TType];
  if (entryType === "ExperienceEntry") {
    return {
      company: "New company",
      position: "Role",
      location: "",
      start_date: "",
      end_date: "",
      display_date: "",
      role_history: [],
      extra_details: [],
      highlights: [""],
    } as unknown as CvEntryByType[TType];
  }
  if (entryType === "EducationEntry") {
    return {
      institution: "Institution",
      degree: "",
      area: "",
      location: "",
      start_date: "",
      end_date: "",
      display_date: "",
      highlights: [],
    } as unknown as CvEntryByType[TType];
  }
  if (entryType === "PublicationEntry") {
    return {
      title: "Publication title",
      authors: [""],
      journal: "",
      date: "",
    } as CvEntryByType[TType];
  }
  if (entryType === "OneLineEntry")
    return { label: "Label", details: "" } as CvEntryByType[TType];
  if (entryType === "BulletEntry")
    return { bullet: "" } as CvEntryByType[TType];
  if (entryType === "NumberedEntry")
    return { number: "" } as CvEntryByType[TType];
  if (entryType === "ReversedNumberedEntry")
    return { reversed_number: "" } as CvEntryByType[TType];
  return {
    name: "New entry",
    date: "",
    location: "",
    summary: "",
    highlights: [],
  } as unknown as CvEntryByType[TType];
}

export function defaultSection<TType extends CvEntryType>(
  entryType: TType,
  existingIds: Iterable<string> = [],
  requestedTitle?: string,
): Extract<CvSection, { entry_type: TType }> {
  const title =
    requestedTitle?.trim() ||
    (entryType === "TextEntry"
      ? "New Section"
      : entryTypeLabel(entryType).replace(" Entry", ""));
  return {
    id: uniqueId(title, existingIds),
    title,
    entry_type: entryType,
    entries: [defaultEntry(entryType)],
  } as Extract<CvSection, { entry_type: TType }>;
}

export function entryTitle(
  entryType: CvEntryType,
  entry: CvEntry,
  index: number,
): string {
  if (entryType === "TextEntry") {
    return typeof entry === "string" && entry.trim()
      ? entry.trim().slice(0, 80)
      : `Text ${index + 1}`;
  }
  if (!isRecord(entry)) return `${entryTypeLabel(entryType)} ${index + 1}`;
  const record = entry as unknown as StoryRecord;
  if (entryType === "ExperienceEntry") {
    return (
      [record.company, record.position].filter(Boolean).join(" — ") ||
      `Experience ${index + 1}`
    );
  }
  if (entryType === "EducationEntry") {
    return (
      [record.institution, record.area].filter(Boolean).join(" — ") ||
      `Education ${index + 1}`
    );
  }
  if (entryType === "PublicationEntry")
    return String(record.title || `Publication ${index + 1}`);
  if (entryType === "OneLineEntry")
    return String(record.label || `One-line ${index + 1}`);
  if (entryType === "BulletEntry")
    return String(record.bullet || `Bullet ${index + 1}`).slice(0, 80);
  if (entryType === "NumberedEntry")
    return String(record.number || `Numbered ${index + 1}`).slice(0, 80);
  if (entryType === "ReversedNumberedEntry") {
    return String(
      record.reversed_number || `Reversed numbered ${index + 1}`,
    ).slice(0, 80);
  }
  return String(record.name || `Entry ${index + 1}`);
}

function assertString(value: unknown, path: string): string | null {
  return value === undefined || typeof value === "string"
    ? null
    : `${path} must be a string`;
}

function validateCvFragment(value: StoryRecord): string | null {
  for (const key of [
    "name",
    "headline",
    "location",
    "email",
    "phone",
    "website",
    "last_updated",
  ]) {
    const error = assertString(value[key], `cv.${key}`);
    if (error) return error;
  }

  if (value.target_roles !== undefined) {
    if (
      !Array.isArray(value.target_roles) ||
      value.target_roles.some((item) => typeof item !== "string")
    ) {
      return "cv.target_roles must be a list of strings";
    }
  }
  if (value.social_networks !== undefined) {
    if (
      !Array.isArray(value.social_networks) ||
      value.social_networks.some((item) => !isRecord(item))
    ) {
      return "cv.social_networks must be a list of objects";
    }
  }
  if (value.sections === undefined) return null;
  if (!Array.isArray(value.sections)) return "cv.sections must be a list";

  for (const [sectionIndex, rawSection] of value.sections.entries()) {
    if (!isRecord(rawSection))
      return `cv.sections[${sectionIndex}] must be an object`;
    if (
      typeof rawSection.id !== "string" ||
      typeof rawSection.title !== "string"
    ) {
      return `cv.sections[${sectionIndex}] needs string id and title fields`;
    }
    if (!CV_ENTRY_TYPES.includes(rawSection.entry_type as CvEntryType)) {
      return `cv.sections[${sectionIndex}].entry_type is not supported`;
    }
    if (!Array.isArray(rawSection.entries)) {
      return `cv.sections[${sectionIndex}].entries must be a list`;
    }
    const textEntries = rawSection.entry_type === "TextEntry";
    const malformedEntry = rawSection.entries.some((entry) =>
      textEntries ? typeof entry !== "string" : !isRecord(entry),
    );
    if (malformedEntry) {
      return `cv.sections[${sectionIndex}].entries does not match ${rawSection.entry_type}`;
    }
  }
  return null;
}

function validateKnownLists(
  tab: CvStoryTab,
  value: StoryRecord,
): string | null {
  const listPath: [PathPart[], string] | null =
    tab === "settings"
      ? [["bold_keywords"], "settings.bold_keywords"]
      : tab === "design"
        ? [
            ["sections", "show_time_spans_in"],
            "design.sections.show_time_spans_in",
          ]
        : null;
  if (!listPath) return null;
  const [path, label] = listPath;
  const list = getFormValueAtPath(value, path.join("."));
  if (list === undefined) return null;
  return Array.isArray(list) && list.every((item) => typeof item === "string")
    ? null
    : `${label} must be a list of strings`;
}

export function validateFragment(
  tab: CvStoryTab,
  value: unknown,
): string | null {
  if (!isRecord(value)) return `${tab} must be an object`;
  if (tab === "cv") return validateCvFragment(value);
  return validateKnownLists(tab, value);
}

export function parseFragment(tab: CvStoryTab, text: string): ParsedFragment {
  try {
    const parsed = parse(text) as unknown;
    if (!isRecord(parsed))
      return { ok: false, error: `${tab} must be an object` };
    const candidate = Object.prototype.hasOwnProperty.call(parsed, tab)
      ? parsed[tab]
      : parsed;
    const validationError = validateFragment(tab, candidate);
    if (validationError) return { ok: false, error: validationError };
    return { ok: true, value: candidate as FragmentValue };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "The YAML could not be parsed",
    };
  }
}

export function serializeFragment(
  source: CompleteCvSource,
  tab: CvStoryTab,
): string {
  const value =
    source[tab] ?? UI_DEFAULTS[tab as Exclude<CvStoryTab, "cv">] ?? {};
  return stringify({ [tab]: value }, { lineWidth: 90 });
}

export function applyYamlEdit(
  source: CompleteCvSource,
  tab: CvStoryTab,
  text: string,
): AppliedYamlEdit {
  const parsed = parseFragment(tab, text);
  if (!parsed.ok) return { source, text, error: parsed.error, applied: false };
  return {
    source: { ...source, [tab]: parsed.value },
    text,
    error: null,
    applied: true,
  };
}

export function parseCompleteSource(text: string): CompleteCvSource {
  const parsed = parseCvYaml(text);
  if (!parsed.ok) throw new Error(parsed.error);
  return toCompleteCvSource(parsed.source);
}

export function parseCompleteSourceSafe(
  text: string,
): { ok: true; source: CompleteCvSource; error: null } | { ok: false; source: null; error: string } {
  try {
    return { ok: true, source: parseCompleteSource(text), error: null };
  } catch (error) {
    return {
      ok: false,
      source: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function serializeCompleteSource(source: CompleteCvSource): string {
  return stringifyCvSource(toCvSource(source));
}

export function fragmentWithDefaults(
  source: CompleteCvSource,
  tab: Exclude<CvStoryTab, "cv">,
): StoryRecord {
  return { ...UI_DEFAULTS[tab], ...(source[tab] ?? {}) };
}
