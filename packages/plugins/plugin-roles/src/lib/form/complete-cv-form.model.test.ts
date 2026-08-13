import { describe, expect, it } from "vitest";
import {
  applyYamlEdit,
  cloneSource,
  parseCompleteSource,
  serializeCompleteSource,
} from "./complete-cv-form.model";
import { createSampleCv } from "./sample-cv.fixture";

describe("complete CV form model", () => {
  it("round-trips the sample CV through parse and serialize", () => {
    const source = createSampleCv();
    expect(source.cv.name).toBe("John Doe");
    const serialized = serializeCompleteSource(source);
    const parsed = parseCompleteSource(serialized);
    expect(parsed.cv.name).toBe("John Doe");
    expect(parsed.cv.headline).toBe(source.cv.headline);
    expect(parsed.cv.sections ?? []).toHaveLength(
      (source.cv.sections ?? []).length,
    );
  });

  it("JSON-clones nested CV source without structuredClone", () => {
    const source = createSampleCv();
    const cloned = cloneSource(source);
    expect(cloned).not.toBe(source);
    expect(cloned.cv).not.toBe(source.cv);
    expect(cloned.cv.name).toBe("John Doe");
    cloned.cv.name = "Jane";
    expect(source.cv.name).toBe("John Doe");
  });

  it("preserves invalid YAML text and the last valid structured source", () => {
    const source = createSampleCv();
    const invalidText = "cv:\n  name: [broken\n";
    const result = applyYamlEdit(source, "cv", invalidText);
    expect(result.applied).toBe(false);
    expect(result.text).toBe(invalidText);
    expect(result.source).toBe(source);
    expect(result.source.cv.name).toBe("John Doe");
    expect(result.error).toBeTruthy();
  });

  it("preserves evidence and unedited settings across structured serialization", () => {
    const source = parseCompleteSource(`
cv:
  name: Original
  headline: Engineer
  location: London
  email: original@example.com
  phone: ""
  sections: []
settings:
  current_date: today
  custom_setting: retained
evidence:
  stories: []
  technologies: [Svelte]
  skills: [Delivery]
  answer_method_defaults: { style: concise }
`);
    source.cv.name = "Edited";
    const reparsed = parseCompleteSource(serializeCompleteSource(source));
    expect(reparsed.cv.name).toBe("Edited");
    expect(reparsed.evidence?.technologies).toEqual(["Svelte"]);
    expect(reparsed.evidence?.answer_method_defaults).toEqual({ style: "concise" });
    expect(reparsed.settings?.custom_setting).toBe("retained");
  });
});
