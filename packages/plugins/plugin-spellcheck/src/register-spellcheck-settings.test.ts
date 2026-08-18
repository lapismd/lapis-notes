import { describe, expect, it } from "vitest";
import { createSpellcheckSettingsSection } from "./register-spellcheck-settings";
import { SPELLCHECK_RULES } from "./rules";
import { SPELLCHECK_SETTING_IDS } from "./settings";

describe("spellcheck settings section", () => {
  it("exposes Harper and file-type settings", () => {
    const section = createSpellcheckSettingsSection({
      app: {},
    } as never);
    expect(section.id).toBe("spellcheck");
    expect(section.navigationGroupId).toBe("core-plugins");
    expect(section.fields.map((field) => field.id)).toContain(
      SPELLCHECK_SETTING_IDS.dialect,
    );
    expect(section.fields.map((field) => field.id)).toContain(
      SPELLCHECK_SETTING_IDS.disabledRules,
    );
    expect(section.fields.map((field) => field.id)).toContain(
      "spellcheck.forgetIgnored",
    );
    const disabled = section.fields.find(
      (field) => field.id === SPELLCHECK_SETTING_IDS.disabledRules,
    );
    expect(disabled).toMatchObject({
      type: "multi-enum",
      allowUnknownOptions: true,
    });
    expect(
      disabled && "options" in disabled ? disabled.options : [],
    ).toHaveLength(SPELLCHECK_RULES.length);
  });
});
