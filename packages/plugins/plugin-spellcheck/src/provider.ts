import type {
  App,
  LanguageServiceCodeAction,
  LanguageServiceCodeActionCommand,
  LanguageServiceDiagnostic,
  LanguageServiceDiagnosticSeverity,
  LanguageServiceProvider,
  LanguageServiceRange,
  LanguageServiceRequestContext,
} from "@lapis-notes/api";
import { offsetToPosition, rangesIntersect, toSingleReplacement } from "./edits";
import {
  createHarperLinter,
  HARPER_DIALECT,
  lintKind,
  type HarperLanguage,
  type HarperLintLike,
  type HarperLintOptions,
  type HarperLinterLike,
} from "./harper";
import {
  SPELLCHECK_ADD_TO_DICTIONARY_COMMAND,
  SPELLCHECK_IGNORE_LINT_COMMAND,
  SPELLCHECK_IGNORE_WORD_COMMAND,
  SPELLCHECK_PROVIDER_ID,
} from "./ids";
import {
  documentExceedsMaxLength,
  fileTypeFromPath,
  shouldCheckSpellcheckPath,
  vaultPathFromDocumentUri,
} from "./path-filter";
import {
  readSpellcheckSettings,
  type SpellcheckSettings,
  updateSpellcheckSetting,
  SPELLCHECK_SETTING_IDS,
} from "./settings";

const IGNORE_COMMENT_MASK = "(?:harper|spellcheck):ignore";
const FRONTMATTER_MASK = "^---\\r?\\n[\\s\\S]*?\\r?\\n---";

export type SpellcheckLanguageServiceProvider = LanguageServiceProvider & {
  warmup(): Promise<void>;
};

export function createSpellcheckProviderForApp(
  app: App,
  createLinter: () => Promise<HarperLinterLike> = createHarperLinter,
): SpellcheckLanguageServiceProvider {
  let providerPromise: Promise<HarperLinterLike> | null = null;
  let resolved: HarperLinterLike | null = null;
  let disposed = false;
  const ensureLinter = async (): Promise<HarperLinterLike> => {
    if (disposed) {
      throw new Error("Spellcheck provider disposed");
    }
    if (!providerPromise) {
      providerPromise = createLinter()
        .then((linter) => {
          resolved = linter;
          if (disposed) {
            void linter.dispose?.();
            throw new Error("Spellcheck provider disposed");
          }
          return linter;
        })
        .catch((error) => {
          providerPromise = null;
          throw error;
        });
    }
    return providerPromise;
  };
  const getReadyLinter = (): HarperLinterLike | null => {
    if (resolved) return resolved;
    void ensureLinter().catch(() => undefined);
    return null;
  };

  return {
    metadata: {
      id: SPELLCHECK_PROVIDER_ID,
      languages: ["markdown", "plaintext"],
      runtime: "in-process",
      priority: 90,
      capabilities: { diagnostics: true, codeActions: true },
    },
    async provideDiagnostics(context) {
      return (await lintDocument(app, context, getReadyLinter)).diagnostics;
    },
    async provideCodeActions(context, range) {
      const linter = getReadyLinter();
      if (!linter) return [];
      const result = await lintDocument(app, context, () => linter);
      return codeActionsFromLints(linter, context.document.text, range, result);
    },
    async applyCommand(context, command) {
      await applySpellcheckCommand(app, context, command);
    },
    async warmup() {
      await ensureLinter();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      void resolved?.dispose?.();
      if (!resolved && providerPromise) {
        void providerPromise.catch(() => undefined);
      }
    },
  };
}

async function lintDocument(
  app: App,
  context: LanguageServiceRequestContext,
  getLinter: () => HarperLinterLike | Promise<HarperLinterLike | null> | null,
): Promise<{
  settings: SpellcheckSettings;
  language: HarperLanguage;
  diagnostics: LanguageServiceDiagnostic[];
  lints: Array<{ ruleId: string; lint: HarperLintLike }>;
}> {
  const settings = readSpellcheckSettings(app);
  const path = vaultPathFromDocumentUri(context.document?.uri ?? "");
  if (!shouldCheckSpellcheckPath(path, settings)) {
    return { settings, language: "markdown", diagnostics: [], lints: [] };
  }
  if (documentExceedsMaxLength(context.document.text, settings.maxFileLength)) {
    return { settings, language: "markdown", diagnostics: [], lints: [] };
  }

  const language = fileTypeFromPath(path);
  const linter = await getLinter();
  if (!linter) {
    return { settings, language, diagnostics: [], lints: [] };
  }
  await applyHarperSettings(linter, settings);

  const options = lintOptions(settings, language);
  const organized = linter.organizedLints
    ? await linter.organizedLints(context.document.text, options)
    : { SpellCheck: await linter.lint(context.document.text, options) };

  const lints: Array<{ ruleId: string; lint: HarperLintLike }> = [];
  const diagnostics: LanguageServiceDiagnostic[] = [];
  for (const [ruleId, group] of Object.entries(organized)) {
    for (const lint of group) {
      const key = lintKey(ruleId, lint, context.document.text);
      if (settings.ignoredLints.includes(key)) {
        continue;
      }
      lints.push({ ruleId, lint });
      diagnostics.push(
        toDiagnostic(context.document.text, ruleId, lint, settings),
      );
    }
  }
  return { settings, language, diagnostics, lints };
}

function lintOptions(
  settings: SpellcheckSettings,
  language: HarperLanguage,
): HarperLintOptions {
  const masks = [IGNORE_COMMENT_MASK];
  if (!settings.checkFrontmatter) {
    masks.push(FRONTMATTER_MASK);
  }
  return {
    language,
    isolateEnglish: settings.isolateEnglish,
    ignore_link_title: settings.ignoreLinkTitle,
    regex_mask: masks.join("|"),
  };
}

async function applyHarperSettings(
  linter: HarperLinterLike,
  settings: SpellcheckSettings,
): Promise<void> {
  await linter.setDialect(HARPER_DIALECT[settings.dialect]);
  const config = await linter.getDefaultLintConfig();
  for (const rule of settings.disabledRules) {
    if (rule in config) {
      config[rule] = false;
    }
  }
  await linter.setLintConfig(config);
  await linter.clearWords();
  const words = [
    ...new Set([...settings.userDictionary, ...settings.ignoreWords]),
  ];
  if (words.length) {
    await linter.importWords(words);
  }
  await linter.clearIgnoredLints();
  if (settings.ignoredLints.length) {
    await linter.importIgnoredLints(JSON.stringify(settings.ignoredLints));
  }
}

function toDiagnostic(
  text: string,
  ruleId: string,
  lint: HarperLintLike,
  settings: SpellcheckSettings,
): LanguageServiceDiagnostic {
  const span = lint.span();
  return {
    range: {
      start: offsetToPosition(text, span.start),
      end: offsetToPosition(text, span.end),
    },
    message: lint.message(),
    severity: diagnosticSeverity(lintKind(lint), settings),
    source: "harper",
    code: ruleId,
  };
}

function diagnosticSeverity(
  kind: string,
  settings: SpellcheckSettings,
): LanguageServiceDiagnosticSeverity {
  if (settings.diagnosticSeverity) {
    return settings.diagnosticSeverity;
  }
  if (kind === "Spelling") {
    return "error";
  }
  if (kind === "Style") {
    return "warning";
  }
  return "hint";
}

function lintKey(ruleId: string, lint: HarperLintLike, text: string): string {
  const span = lint.span();
  return `${ruleId}:${span.start}:${span.end}:${text.slice(span.start, span.end)}`;
}

async function codeActionsFromLints(
  linter: HarperLinterLike,
  text: string,
  range: LanguageServiceRange,
  result: {
    settings: SpellcheckSettings;
    lints: Array<{ ruleId: string; lint: HarperLintLike }>;
  },
): Promise<LanguageServiceCodeAction[]> {
  const actions: LanguageServiceCodeAction[] = [];

  for (const entry of result.lints) {
    const span = entry.lint.span();
    const diagnosticRange = {
      start: offsetToPosition(text, span.start),
      end: offsetToPosition(text, span.end),
    };
    if (!rangesIntersect(diagnosticRange, range)) {
      continue;
    }
    const diagnostic = toDiagnostic(
      text,
      entry.ruleId,
      entry.lint,
      result.settings,
    );
    const problem = text.slice(span.start, span.end);
    const suggestions = entry.lint.suggestions().slice(0, result.settings.numSuggestions);
    for (const suggestion of suggestions) {
      const replacement = suggestion.get_replacement_text();
      const updated = await linter.applySuggestion(text, entry.lint, suggestion);
      const change = toSingleReplacement(text, updated);
      if (!change) continue;
      actions.push({
        title: replacement || "Remove word",
        kind: "quickfix",
        diagnostics: [diagnostic],
        edit: { changes: [change] },
      });
    }
    if (
      problem &&
      !result.settings.userDictionary.some(
        (word) => word.toLocaleLowerCase() === problem.toLocaleLowerCase(),
      )
    ) {
      actions.push({
        title: `Add: "${problem}" to dictionary`,
        kind: "quickfix",
        diagnostics: [diagnostic],
        command: {
          id: SPELLCHECK_ADD_TO_DICTIONARY_COMMAND,
          arguments: [problem],
        },
      });
    }
    if (
      problem &&
      !result.settings.ignoreWords.some(
        (word) => word.toLocaleLowerCase() === problem.toLocaleLowerCase(),
      )
    ) {
      actions.push({
        title: `Ignore: "${problem}"`,
        kind: "quickfix",
        diagnostics: [diagnostic],
        command: {
          id: SPELLCHECK_IGNORE_WORD_COMMAND,
          arguments: [problem],
        },
      });
    }
    actions.push({
      title: "Ignore this suggestion",
      kind: "quickfix",
      diagnostics: [diagnostic],
      command: {
        id: SPELLCHECK_IGNORE_LINT_COMMAND,
        arguments: [lintKey(entry.ruleId, entry.lint, text)],
      },
    });
  }
  return actions;
}

async function applySpellcheckCommand(
  app: App,
  _context: LanguageServiceRequestContext,
  command: LanguageServiceCodeActionCommand,
): Promise<void> {
  const argument = typeof command.arguments?.[0] === "string"
    ? command.arguments[0]
    : "";
  if (!argument) {
    return;
  }
  const settings = readSpellcheckSettings(app);
  if (command.id === SPELLCHECK_ADD_TO_DICTIONARY_COMMAND) {
    if (settings.userDictionary.includes(argument)) {
      return;
    }
    await updateSpellcheckSetting(app, SPELLCHECK_SETTING_IDS.userDictionary, [
      ...settings.userDictionary,
      argument,
    ]);
    return;
  }
  if (command.id === SPELLCHECK_IGNORE_WORD_COMMAND) {
    if (settings.ignoreWords.includes(argument)) {
      return;
    }
    await updateSpellcheckSetting(app, SPELLCHECK_SETTING_IDS.ignoreWords, [
      ...settings.ignoreWords,
      argument,
    ]);
    return;
  }
  if (command.id === SPELLCHECK_IGNORE_LINT_COMMAND) {
    if (settings.ignoredLints.includes(argument)) {
      return;
    }
    await updateSpellcheckSetting(app, SPELLCHECK_SETTING_IDS.ignoredLints, [
      ...settings.ignoredLints,
      argument,
    ]);
  }
}
