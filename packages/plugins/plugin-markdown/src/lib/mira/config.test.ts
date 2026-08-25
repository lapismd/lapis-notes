import { MiraFeature } from "@lapismd/mira-editor";
import { describe, expect, it } from "vitest";
import {
  createMarkdownConfigurationSchema,
  createMarkdownSettingsFields,
  MARKDOWN_SETTING_DESCRIPTORS,
  MIRA_EDITOR_SETTING_KEYS,
  MIRA_DOCUMENT_SETTING_KEYS,
  MIRA_FEATURE_KEYS,
  MIRA_FEATURE_METADATA,
  miraFeatureConfigKey,
  readMiraFeatureFlags,
} from "./config";

describe("Markdown setting descriptors", () => {
  it("drive schema and Settings metadata from one unique list", () => {
    const schema = createMarkdownConfigurationSchema();
    const fields = createMarkdownSettingsFields();
    const ids = MARKDOWN_SETTING_DESCRIPTORS.map((descriptor) => descriptor.id);
    const featureIds = MIRA_FEATURE_KEYS.map(miraFeatureConfigKey);
    const featureTableIds = [
      ...featureIds,
      MIRA_DOCUMENT_SETTING_KEYS.outlineNavigation,
    ];
    const ordinaryIds = ids.filter((id) => !featureTableIds.includes(id));
    const featureGroup = fields.find(
      (field) => field.id === "markdown.mira.features",
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(schema.properties)).toEqual(ids);
    expect(fields.map((field) => field.id)).toEqual([
      ...ordinaryIds,
      "markdown.mira.features",
    ]);
    expect(schema.properties).not.toHaveProperty("markdown.mira.features");
    expect(featureGroup).toMatchObject({
      type: "group",
      presentation: "toggle-table",
      title: "Features",
      description:
        "Choose which Mira capabilities are available in Markdown editing and preview surfaces.",
    });
    expect(featureGroup?.type).toBe("group");
    if (featureGroup?.type !== "group") {
      throw new Error("Expected the Markdown feature settings group");
    }
    expect(featureGroup.fields.map((field) => field.id)).toEqual(
      featureTableIds,
    );

    for (const descriptor of MARKDOWN_SETTING_DESCRIPTORS) {
      expect(schema.properties[descriptor.id]).toMatchObject({
        title: descriptor.title,
        default: descriptor.default,
      });
      const field = featureTableIds.includes(descriptor.id)
        ? featureGroup.fields.find(
            (candidate) => candidate.id === descriptor.id,
          )
        : fields.find((candidate) => candidate.id === descriptor.id);
      expect(field).toMatchObject({
        title: descriptor.title,
        default: descriptor.default,
      });
    }
  });

  it("declares explicit labels and descriptions for every Mira feature", () => {
    expect(Object.keys(MIRA_FEATURE_METADATA)).toHaveLength(20);
    expect(new Set(MIRA_FEATURE_KEYS).size).toBe(20);

    for (const feature of MIRA_FEATURE_KEYS) {
      const metadata = MIRA_FEATURE_METADATA[feature];
      expect(metadata.title).toMatch(/^[A-Z]/);
      expect(metadata.title).not.toMatch(/^Feature:/);
      expect(metadata.description.trim()).not.toBe("");
    }

    expect(MIRA_FEATURE_METADATA[MiraFeature.Mermaid].description).toContain(
      "Mermaid plugin setting",
    );
  });

  it("declares truthful authoring defaults", () => {
    const defaults = Object.fromEntries(
      MARKDOWN_SETTING_DESCRIPTORS.map((descriptor) => [
        descriptor.id,
        descriptor.default,
      ]),
    );

    expect(defaults).toMatchObject({
      [MIRA_EDITOR_SETTING_KEYS.toolbar]: false,
      [MIRA_EDITOR_SETTING_KEYS.selectionToolbar]: true,
      [MIRA_EDITOR_SETTING_KEYS.blockToolbar]: false,
      [MIRA_EDITOR_SETTING_KEYS.doodleDividers]: false,
      "markdown.mira.features.slash-commands": true,
      "markdown.mira.features.block-controls": true,
      "markdown.mira.plugins.ai.enabled": false,
      "markdown.mira.plugins.mermaid.enabled": true,
      [MIRA_DOCUMENT_SETTING_KEYS.frontmatterDefaultOpen]: false,
      [MIRA_DOCUMENT_SETTING_KEYS.outlineNavigation]: true,
    });
  });

  it("supersedes the legacy toolbar flag without reading or registering it", () => {
    const requested: string[] = [];
    const get = <T>(key: string, fallback?: T): T => {
      requested.push(key);
      return fallback as T;
    };
    const features = readMiraFeatureFlags(get);

    expect(
      MARKDOWN_SETTING_DESCRIPTORS.some(
        (descriptor) => descriptor.id === "markdown.mira.features.toolbar",
      ),
    ).toBe(false);
    expect(requested).not.toContain("markdown.mira.features.toolbar");
    expect(features[MiraFeature.Toolbar]).toBe(false);
    expect(features[MiraFeature.SplitMode]).toBe(false);
  });
});
