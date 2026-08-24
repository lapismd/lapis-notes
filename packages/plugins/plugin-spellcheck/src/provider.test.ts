import { describe, expect, it, vi } from "vitest";

vi.mock("@lapis-notes/api", () => ({
  matchesEditorAssociationGlob: (pattern: string, path: string) => {
    if (pattern.includes("node_modules")) {
      return /(^|\/)node_modules\//.test(path);
    }
    if (pattern.includes("{md") || pattern.includes("txt")) {
      return /\.(md|markdown|mdown|mkd|mdwn|mdtxt|mdtext|txt|text)$/iu.test(
        path,
      );
    }
    return false;
  },
}));

import type { HarperLintLike, HarperLinterLike } from "./harper";
import { createSpellcheckProviderForApp } from "./provider";
import { SPELLCHECK_SETTING_IDS } from "./settings";

function createLint(
  start: number,
  end: number,
  message: string,
  replacement: string,
): HarperLintLike {
  return {
    span: () => ({ start, end }),
    message: () => message,
    lint_kind: () => "Spelling",
    suggestions: () => [
      {
        get_replacement_text: () => replacement,
      },
    ],
  };
}

function createLinter(lint: HarperLintLike): HarperLinterLike {
  return {
    setup: async () => undefined,
    lint: async () => [lint],
    organizedLints: async () => ({ SpellCheck: [lint] }),
    applySuggestion: async (text, current, suggestion) => {
      const span = current.span();
      return `${text.slice(0, span.start)}${suggestion.get_replacement_text()}${text.slice(span.end)}`;
    },
    setDialect: vi.fn(async () => undefined),
    getDefaultLintConfig: async () => ({
      SpellCheck: true,
      SpelledNumbers: false,
    }),
    setLintConfig: vi.fn(async () => undefined),
    importWords: vi.fn(async () => undefined),
    clearWords: vi.fn(async () => undefined),
    importIgnoredLints: vi.fn(async () => undefined),
    clearIgnoredLints: vi.fn(async () => undefined),
    contextHash: async () => 1n,
  };
}

function createApp(values: Record<string, unknown> = {}) {
  return {
    configuration: {
      getConfiguration: () => ({
        get: (key: string, fallback: unknown) =>
          key in values ? values[key] : fallback,
      }),
      updateConfigurationOption: vi.fn(async (key: string, value: unknown) => {
        values[key] = value;
      }),
    },
  };
}

const text = "This sentense is wrong.";
const lint = createLint(5, 13, "`sentense` is a misspelling.", "sentence");

describe("spellcheck provider", () => {
  it("publishes Harper diagnostics and serializable replace actions", async () => {
    const app = createApp();
    const provider = createSpellcheckProviderForApp(
      app as never,
      async () => createLinter(lint),
    );
    await provider.warmup();
    const context = {
      document: {
        uri: "vault:///Notes/Welcome.md",
        languageId: "markdown",
        version: 1,
        text,
      },
      globals: [],
    };

    const diagnostics = await provider.provideDiagnostics!(context);
    expect(diagnostics).toEqual([
      expect.objectContaining({
        message: "`sentense` is a misspelling.",
        source: "harper",
        code: "SpellCheck",
        severity: "error",
      }),
    ]);

    const actions = await provider.provideCodeActions!(context, {
      start: { line: 0, character: 5 },
      end: { line: 0, character: 13 },
    });
    expect(actions[0]).toMatchObject({
      title: "sentence",
      edit: { changes: [{ from: 11, to: 12, insert: "c" }] },
    });
    expect(actions[1]).toMatchObject({
      title: 'Add: "sentense" to dictionary',
      command: { id: "spellcheck:add-to-dictionary" },
    });
    expect(actions[2]).toMatchObject({
      title: 'Ignore: "sentense"',
      command: { id: "spellcheck:ignore-word" },
    });
    expect(actions[3]?.command?.id).toBe("spellcheck:ignore-lint");
  });

  it("persists dictionary and ignore commands without scanning closed files", async () => {
    const values: Record<string, unknown> = {};
    const app = createApp(values);
    const provider = createSpellcheckProviderForApp(
      app as never,
      async () => createLinter(lint),
    );
    await provider.warmup();
    const context = {
      document: {
        uri: "vault:///Notes/Welcome.md",
        languageId: "markdown",
        version: 1,
        text,
      },
      globals: [],
    };

    await provider.applyCommand!(context, {
      id: "spellcheck:add-to-dictionary",
      arguments: ["sentense"],
    });
    expect(values[SPELLCHECK_SETTING_IDS.userDictionary]).toEqual(["sentense"]);

    await provider.applyCommand!(context, {
      id: "spellcheck:ignore-word",
      arguments: ["sentense"],
    });
    expect(values[SPELLCHECK_SETTING_IDS.ignoreWords]).toEqual(["sentense"]);

    await provider.applyCommand!(context, {
      id: "spellcheck:ignore-lint",
      arguments: ["SpellCheck:5:13:sentense"],
    });
    expect(values[SPELLCHECK_SETTING_IDS.ignoredLints]).toEqual([
      "SpellCheck:5:13:sentense",
    ]);

    expect(
      await provider.provideDiagnostics!({
        document: {
          uri: "vault:///node_modules/pkg/README.md",
          languageId: "markdown",
          version: 1,
          text,
        },
        globals: [],
      }),
    ).toEqual([]);
  });

  it("does not lint when automatic checking is paused", async () => {
    const provider = createSpellcheckProviderForApp(
      createApp({
        [SPELLCHECK_SETTING_IDS.automaticChecking]: false,
      }) as never,
      async () => createLinter(lint),
    );
    expect(
      await provider.provideDiagnostics!({
        document: {
          uri: "vault:///Notes/Welcome.md",
          languageId: "markdown",
          version: 1,
          text,
        },
        globals: [],
      }),
    ).toEqual([]);
  });

  it("returns empty diagnostics while Harper is still warming up", async () => {
    const linter = createLinter(lint);
    let resolveLinter: (value: HarperLinterLike) => void = () => undefined;
    const createLinterDeferred = vi.fn(
      () =>
        new Promise<HarperLinterLike>((resolve) => {
          resolveLinter = resolve;
        }),
    );
    const provider = createSpellcheckProviderForApp(
      createApp() as never,
      createLinterDeferred,
    );
    const context = {
      document: {
        uri: "vault:///Notes/Welcome.md",
        languageId: "markdown",
        version: 1,
        text,
      },
      globals: [],
    };

    await expect(provider.provideDiagnostics!(context)).resolves.toEqual([]);
    expect(createLinterDeferred).toHaveBeenCalledOnce();

    resolveLinter(linter);
    await provider.warmup();
    await expect(provider.provideDiagnostics!(context)).resolves.toEqual([
      expect.objectContaining({
        message: "`sentense` is a misspelling.",
      }),
    ]);
  });
});
