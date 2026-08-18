import { describe, expect, it } from "vitest";
import {
  dialectSegment,
  normalizeSpellcheckDialect,
  normalizeSpellcheckStringList,
  readSpellcheckSettings,
  SPELLCHECK_SETTING_IDS,
} from "./settings";

function createApp(values: Record<string, unknown> = {}) {
  return {
    configuration: {
      getConfiguration: () => ({
        get: (key: string, fallback: unknown) =>
          key in values ? values[key] : fallback,
      }),
    },
  };
}

describe("spellcheck settings", () => {
  it("reads defaults and dialect segments", () => {
    expect(readSpellcheckSettings(createApp() as never)).toMatchObject({
      dialect: "american",
      automaticChecking: true,
      disabledRules: [],
      userDictionary: [],
      ignoreWords: [],
      ignoredLints: [],
      isolateEnglish: false,
      ignoreLinkTitle: false,
      maxFileLength: 120000,
      numSuggestions: 8,
      checkFrontmatter: false,
      diagnosticSeverity: null,
      enabledFileTypes: ["markdown", "plaintext"],
    });
    expect(dialectSegment("american")).toBe("US");
    expect(dialectSegment("british")).toBe("GB");
    expect(dialectSegment("indian")).toBe("IN");
    expect(normalizeSpellcheckDialect("canadian")).toBe("canadian");
    expect(normalizeSpellcheckDialect("nope")).toBe("american");
    expect(normalizeSpellcheckStringList(["  Foo ", "", "Foo", 12])).toEqual([
      "Foo",
    ]);
  });

  it("applies stored overrides", () => {
    const settings = readSpellcheckSettings(
      createApp({
        [SPELLCHECK_SETTING_IDS.dialect]: "british",
        [SPELLCHECK_SETTING_IDS.automaticChecking]: false,
        [SPELLCHECK_SETTING_IDS.disabledRules]: ["SpellCheck"],
        [SPELLCHECK_SETTING_IDS.diagnosticSeverity]: "warning",
        [SPELLCHECK_SETTING_IDS.enabledFileTypes]: ["markdown"],
      }) as never,
    );
    expect(settings.dialect).toBe("british");
    expect(settings.automaticChecking).toBe(false);
    expect(settings.disabledRules).toEqual(["SpellCheck"]);
    expect(settings.diagnosticSeverity).toBe("warning");
    expect(settings.enabledFileTypes).toEqual(["markdown"]);
  });
});
