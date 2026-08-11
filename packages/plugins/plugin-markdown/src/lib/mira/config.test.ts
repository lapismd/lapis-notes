import { MiraFeature } from "@lapismd/mira-editor";
import { describe, expect, it } from "vitest";
import {
  createMarkdownConfigurationSchema,
  createMarkdownSettingsFields,
  MARKDOWN_SETTING_DESCRIPTORS,
  MIRA_EDITOR_SETTING_KEYS,
  readMiraFeatureFlags,
} from "./config";

describe("Markdown setting descriptors", () => {
  it("drive schema and Settings metadata from one unique list", () => {
    const schema = createMarkdownConfigurationSchema();
    const fields = createMarkdownSettingsFields();
    const ids = MARKDOWN_SETTING_DESCRIPTORS.map((descriptor) => descriptor.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(schema.properties)).toEqual(ids);
    expect(fields.map((field) => field.id)).toEqual(ids);

    for (const descriptor of MARKDOWN_SETTING_DESCRIPTORS) {
      expect(schema.properties[descriptor.id]).toMatchObject({
        title: descriptor.title,
        default: descriptor.default,
      });
      expect(fields.find((field) => field.id === descriptor.id)).toMatchObject({
        title: descriptor.title,
        default: descriptor.default,
      });
    }
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
