// @vitest-environment jsdom

import { EditorView } from "@codemirror/view";
import type { MiraExtension } from "@lapismd/mira/extensions";
import { MiraFeature } from "@lapismd/mira-editor";
import type { App } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import { MIRA_EDITOR_SETTING_KEYS } from "./config";
import {
  createMarkdownMiraCodeMirrorOptions,
  createMiraExtensionLifecycle,
  readMarkdownMiraEditorSettings,
  resolveMarkdownMiraExtensions,
} from "./extensions";

vi.hoisted(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock("@lapis-notes/api/editor/language-service", () => ({
  languageServiceExtensions: () => [],
}));

function createApp(values: Record<string, unknown> = {}): App {
  return {
    configuration: {
      getConfiguration: () => ({
        get: (key: string, fallback?: unknown) =>
          Object.hasOwn(values, key) ? values[key] : fallback,
      }),
    },
    vault: {
      getFileByPath: () => null,
      getAllLoadedFiles: () => [],
      on: vi.fn(() => ({})),
      offref: vi.fn(),
    },
    metadataCache: {
      getFirstLinkpathDest: () => null,
      on: vi.fn(() => ({})),
      offref: vi.fn(),
    },
    embedRegistry: { get: () => null },
  } as unknown as App;
}

describe("Lapis Mira authoring composition", () => {
  it("enables the complete portable defaults without a duplicate base layer", () => {
    const app = createApp();
    const resolved = resolveMarkdownMiraExtensions(app);
    const options = createMarkdownMiraCodeMirrorOptions({
      app,
      mode: "live-preview",
      sourcePath: "Notes/Welcome.md",
    });

    expect(options.includeBaseExtensions).toBe(false);
    expect(options.blockControls).toBe(true);
    expect(options.fileAdapter).toBeDefined();
    expect(resolved.features).toMatchObject({
      [MiraFeature.Formatting]: true,
      [MiraFeature.Headings]: true,
      [MiraFeature.Tables]: true,
      [MiraFeature.Images]: true,
      [MiraFeature.SlashCommands]: true,
      [MiraFeature.BlockControls]: true,
      [MiraFeature.Toolbar]: false,
    });
    expect(resolved.miraExtensions.map((extension) => extension.name)).toEqual(
      expect.arrayContaining([
        "mermaid",
        "default-slash-commands",
        "selection-toolbar",
      ]),
    );
  });

  it("resolves optional surfaces from their dedicated settings", () => {
    const app = createApp({
      [MIRA_EDITOR_SETTING_KEYS.toolbar]: true,
      [MIRA_EDITOR_SETTING_KEYS.selectionToolbar]: false,
      [MIRA_EDITOR_SETTING_KEYS.blockToolbar]: true,
      [MIRA_EDITOR_SETTING_KEYS.doodleDividers]: true,
    });
    const settings = readMarkdownMiraEditorSettings(app);
    const resolved = resolveMarkdownMiraExtensions(app);
    const options = createMarkdownMiraCodeMirrorOptions({
      app,
      mode: "source",
    });

    expect(settings).toEqual({
      toolbar: true,
      selectionToolbar: false,
      blockToolbar: true,
      doodleDividers: true,
    });
    expect(resolved.miraExtensions.map((extension) => extension.name)).toContain(
      "doodle-dividers",
    );
    expect(resolved.miraExtensions.map((extension) => extension.name)).not.toContain(
      "selection-toolbar",
    );
    expect(options.blockControls).toMatchObject({ enabled: true });
  });

  it("mounts extension styles and lifecycle cleanup with the editor view", () => {
    const mounted = vi.fn();
    const cleaned = vi.fn();
    const extension = {
      name: "lifecycle-test",
      styles: [{ id: "lifecycle-test", cssText: ".lifecycle-test {}" }],
      onMount: () => {
        mounted();
        return cleaned;
      },
    } satisfies MiraExtension;
    const parent = document.createElement("div");
    const view = new EditorView({
      extensions: [
        createMiraExtensionLifecycle([extension], {
          app: createApp(),
          mode: "source",
        }),
      ],
      parent,
    });

    expect(mounted).toHaveBeenCalledOnce();
    expect(
      document.head.querySelector(
        '[data-mira-extension-style="id:lifecycle-test"]',
      ),
    ).not.toBeNull();

    view.destroy();

    expect(cleaned).toHaveBeenCalledOnce();
    expect(
      document.head.querySelector(
        '[data-mira-extension-style="id:lifecycle-test"]',
      ),
    ).toBeNull();
  });
});
