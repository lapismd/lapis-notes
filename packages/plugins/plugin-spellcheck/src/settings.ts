import type { App } from "@lapis-notes/api";

export const SPELLCHECK_SETTING_IDS = {
  dialect: "spellcheck.dialect",
  automaticChecking: "spellcheck.automaticChecking",
  disabledRules: "spellcheck.disabledRules",
  userDictionary: "spellcheck.userDictionary",
  ignoreWords: "spellcheck.ignoreWords",
  ignoredLints: "spellcheck.ignoredLints",
  isolateEnglish: "spellcheck.isolateEnglish",
  ignoreLinkTitle: "spellcheck.ignoreLinkTitle",
  maxFileLength: "spellcheck.maxFileLength",
  numSuggestions: "spellcheck.numSuggestions",
  checkFrontmatter: "spellcheck.checkFrontmatter",
  diagnosticSeverity: "spellcheck.diagnosticSeverity",
  enabledFileTypes: "spellcheck.enabledFileTypes",
  includeGlobs: "spellcheck.includeGlobs",
  excludeGlobs: "spellcheck.excludeGlobs",
} as const;

export const SPELLCHECK_DIALECTS = [
  "american",
  "british",
  "canadian",
  "australian",
  "indian",
] as const;

export type SpellcheckDialect = (typeof SPELLCHECK_DIALECTS)[number];

export const SPELLCHECK_FILE_TYPES = ["markdown", "plaintext"] as const;

export type SpellcheckFileType = (typeof SPELLCHECK_FILE_TYPES)[number];

export type SpellcheckSeverity = "error" | "warning" | "information" | "hint";

export const DEFAULT_SPELLCHECK_INCLUDE_GLOBS = [
  "**/*.{md,markdown,mdown,mkd,mdwn,mdtxt,mdtext,txt,text}",
] as const;

export const DEFAULT_SPELLCHECK_EXCLUDE_GLOBS = [
  "**/node_modules/**",
  "**/bower_components/**",
  "**/.git/**",
  "**/vendor/**",
  "**/.obsidian/**",
  "**/.lapis/**",
  "**/.jj/**",
] as const;

export const DEFAULT_SPELLCHECK_MAX_FILE_LENGTH = 120000;
export const DEFAULT_SPELLCHECK_NUM_SUGGESTIONS = 8;

export interface SpellcheckSettings {
  dialect: SpellcheckDialect;
  automaticChecking: boolean;
  disabledRules: string[];
  userDictionary: string[];
  ignoreWords: string[];
  ignoredLints: string[];
  isolateEnglish: boolean;
  ignoreLinkTitle: boolean;
  maxFileLength: number;
  numSuggestions: number;
  checkFrontmatter: boolean;
  diagnosticSeverity: SpellcheckSeverity | null;
  enabledFileTypes: SpellcheckFileType[];
  includeGlobs: string[];
  excludeGlobs: string[];
}

export function normalizeSpellcheckStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  ];
}

export function normalizeSpellcheckDialect(value: unknown): SpellcheckDialect {
  return SPELLCHECK_DIALECTS.includes(value as SpellcheckDialect)
    ? (value as SpellcheckDialect)
    : "american";
}

export function dialectSegment(dialect: SpellcheckDialect): string {
  switch (dialect) {
    case "british":
      return "GB";
    case "canadian":
      return "CA";
    case "australian":
      return "AU";
    case "indian":
      return "IN";
    default:
      return "US";
  }
}

export function dialectLabel(dialect: SpellcheckDialect): string {
  switch (dialect) {
    case "british":
      return "British";
    case "canadian":
      return "Canadian";
    case "australian":
      return "Australian";
    case "indian":
      return "Indian";
    default:
      return "American";
  }
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function normalizeSeverity(value: unknown): SpellcheckSeverity | null {
  return value === "error" ||
    value === "warning" ||
    value === "information" ||
    value === "hint"
    ? value
    : null;
}

function normalizeFileTypes(value: unknown): SpellcheckFileType[] {
  const listed = normalizeSpellcheckStringList(value).filter(
    (entry): entry is SpellcheckFileType =>
      SPELLCHECK_FILE_TYPES.includes(entry as SpellcheckFileType),
  );
  return listed.length > 0 ? listed : [...SPELLCHECK_FILE_TYPES];
}

export function readSpellcheckSettings(app: App): SpellcheckSettings {
  const configuration = app.configuration.getConfiguration();
  return {
    dialect: normalizeSpellcheckDialect(
      configuration.get(SPELLCHECK_SETTING_IDS.dialect, "american"),
    ),
    automaticChecking: normalizeBoolean(
      configuration.get(SPELLCHECK_SETTING_IDS.automaticChecking, true),
      true,
    ),
    disabledRules: normalizeSpellcheckStringList(
      configuration.get(SPELLCHECK_SETTING_IDS.disabledRules, []),
    ),
    userDictionary: normalizeSpellcheckStringList(
      configuration.get(SPELLCHECK_SETTING_IDS.userDictionary, []),
    ),
    ignoreWords: normalizeSpellcheckStringList(
      configuration.get(SPELLCHECK_SETTING_IDS.ignoreWords, []),
    ),
    ignoredLints: normalizeSpellcheckStringList(
      configuration.get(SPELLCHECK_SETTING_IDS.ignoredLints, []),
    ),
    isolateEnglish: normalizeBoolean(
      configuration.get(SPELLCHECK_SETTING_IDS.isolateEnglish, false),
      false,
    ),
    ignoreLinkTitle: normalizeBoolean(
      configuration.get(SPELLCHECK_SETTING_IDS.ignoreLinkTitle, false),
      false,
    ),
    maxFileLength: normalizePositiveInteger(
      configuration.get(
        SPELLCHECK_SETTING_IDS.maxFileLength,
        DEFAULT_SPELLCHECK_MAX_FILE_LENGTH,
      ),
      DEFAULT_SPELLCHECK_MAX_FILE_LENGTH,
    ),
    numSuggestions: normalizePositiveInteger(
      configuration.get(
        SPELLCHECK_SETTING_IDS.numSuggestions,
        DEFAULT_SPELLCHECK_NUM_SUGGESTIONS,
      ),
      DEFAULT_SPELLCHECK_NUM_SUGGESTIONS,
    ),
    checkFrontmatter: normalizeBoolean(
      configuration.get(SPELLCHECK_SETTING_IDS.checkFrontmatter, false),
      false,
    ),
    diagnosticSeverity: normalizeSeverity(
      configuration.get(SPELLCHECK_SETTING_IDS.diagnosticSeverity, null),
    ),
    enabledFileTypes: normalizeFileTypes(
      configuration.get(SPELLCHECK_SETTING_IDS.enabledFileTypes, [
        ...SPELLCHECK_FILE_TYPES,
      ]),
    ),
    includeGlobs: normalizeSpellcheckStringList(
      configuration.get(
        SPELLCHECK_SETTING_IDS.includeGlobs,
        DEFAULT_SPELLCHECK_INCLUDE_GLOBS,
      ),
    ),
    excludeGlobs: normalizeSpellcheckStringList(
      configuration.get(
        SPELLCHECK_SETTING_IDS.excludeGlobs,
        DEFAULT_SPELLCHECK_EXCLUDE_GLOBS,
      ),
    ),
  };
}

export async function updateSpellcheckSetting(
  app: App,
  id: string,
  value: unknown,
): Promise<void> {
  await app.configuration.updateConfigurationOption(id, value);
}
