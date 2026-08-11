import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

import { diagnostic, relativePath } from "./lib/spec-model.mjs";

export const name = "storybook-catalog";

const STORY_FILE_PATTERN = /\.stories\.[cm]?[jt]sx?$/;
const EXAMPLE_SOURCE_FILE_PATTERN = /\.example-sources\.[cm]?[jt]sx?$/;
const STORY_ONLY_BOUNDARY_PATTERN = /(?:demo|harness|fixture)$/i;
const FORBIDDEN_SOURCE_PATTERN = /\b(?:PanelDemo|[A-Z][A-Za-z0-9]*(?:Demo|Harness|Fixture))\b|\bargs\s*\./;

function storyFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return storyFiles(absolutePath);
      if (!entry.isFile() || !STORY_FILE_PATTERN.test(entry.name)) return [];
      return [absolutePath];
    })
    .sort((left, right) => left.localeCompare(right));
}

function exampleSourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return exampleSourceFiles(absolutePath);
      if (
        !entry.isFile() ||
        !EXAMPLE_SOURCE_FILE_PATTERN.test(entry.name)
      ) {
        return [];
      }
      return [absolutePath];
    })
    .sort((left, right) => left.localeCompare(right));
}

function propertyName(node) {
  if (!node?.name) return null;
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) {
    return node.name.text;
  }
  return null;
}

function objectProperty(object, name) {
  return object.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) && propertyName(property) === name,
  );
}

function docsSourceObjects(root) {
  const sources = [];
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const docs = objectProperty(node, "docs");
      if (docs && ts.isObjectLiteralExpression(docs.initializer)) {
        const source = objectProperty(docs.initializer, "source");
        if (source && ts.isObjectLiteralExpression(source.initializer)) {
          sources.push(source.initializer);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(root);
  return sources;
}

function sourceFields(sourceObject) {
  const code = objectProperty(sourceObject, "code");
  const language = objectProperty(sourceObject, "language");
  const type = objectProperty(sourceObject, "type");
  const validType =
    type &&
    (ts.isStringLiteral(type.initializer) ||
      ts.isNoSubstitutionTemplateLiteral(type.initializer)) &&
    type.initializer.text === "code";
  return {
    code,
    language,
    type,
    complete: Boolean(code && language && validType),
  };
}

function literalText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return null;
}

function moduleCandidates(importer, moduleName) {
  const base = path.resolve(path.dirname(importer), moduleName);
  return [
    base,
    `${base}.ts`,
    `${base}.js`,
    `${base}.mjs`,
    path.join(base, "index.ts"),
    path.join(base, "index.js"),
    path.join(base, "index.mjs"),
  ];
}

function resolveLocalModule(importer, moduleName) {
  if (!moduleName.startsWith(".")) return null;
  return moduleCandidates(importer, moduleName).find(existsSync) ?? null;
}

function importModel(sourceFile, absolutePath) {
  const imports = new Map();
  const storyOnly = [];
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }
    const moduleName = statement.moduleSpecifier.text;
    const resolved = resolveLocalModule(absolutePath, moduleName);
    const clause = statement.importClause;
    if (!clause) continue;
    if (clause.name) {
      imports.set(clause.name.text, { imported: "default", resolved });
      if (
        moduleName.startsWith(".") &&
        (STORY_ONLY_BOUNDARY_PATTERN.test(clause.name.text) ||
          STORY_ONLY_BOUNDARY_PATTERN.test(path.parse(moduleName).name))
      ) {
        storyOnly.push(clause.name);
      }
    }
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        imports.set(element.name.text, {
          imported: element.propertyName?.text ?? element.name.text,
          resolved,
        });
      }
    }
  }
  return { imports, storyOnly };
}

function calledImportedHelpers(sourceFile, imports) {
  const calls = [];
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const imported = imports.get(node.expression.text);
      if (imported?.resolved) calls.push(imported);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return calls;
}

function helperSources(helper, cache) {
  const key = `${helper.resolved}:${helper.imported}`;
  if (cache.has(key)) return cache.get(key);
  const source = readFileSync(helper.resolved, "utf8");
  const sourceFile = ts.createSourceFile(
    helper.resolved,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  let target = sourceFile;
  if (helper.imported !== "default") {
    const declaration = sourceFile.statements.find(
      (statement) =>
        ts.isFunctionDeclaration(statement) &&
        statement.name?.text === helper.imported,
    );
    if (declaration) target = declaration;
  }
  const result = { sourceFile, objects: docsSourceObjects(target) };
  cache.set(key, result);
  return result;
}

function isAutodocsDisabled(sourceFile) {
  let disabled = false;
  function visit(node) {
    if (ts.isStringLiteral(node) && node.text === "!autodocs") disabled = true;
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return disabled;
}

function lineOf(sourceFile, node) {
  return (
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
  );
}

function validateSourceObjects(objects, sourceFile, file, findings) {
  for (const sourceObject of objects) {
    const fields = sourceFields(sourceObject);
    if (!fields.complete) {
      findings.push(
        diagnostic({
          code: "SPEC-STORY-SOURCE-FIELDS",
          rule: "LN-CAT-025",
          file,
          line: lineOf(sourceFile, sourceObject),
          message: 'docs.source must define code, language, and type: "code"',
        }),
      );
      continue;
    }
    const code = literalText(fields.code.initializer);
    if (code && FORBIDDEN_SOURCE_PATTERN.test(code)) {
      findings.push(
        diagnostic({
          code: "SPEC-STORY-SOURCE-BOUNDARY",
          rule: "LN-CAT-024",
          file,
          line: lineOf(sourceFile, fields.code),
          message:
            "Show Code must not expose a story-only demo, harness, fixture, or args expression",
        }),
      );
    }
  }
}

function validateExampleSources(storiesRoot, repoRoot) {
  const findings = [];
  for (const absolutePath of exampleSourceFiles(storiesRoot)) {
    const source = readFileSync(absolutePath, "utf8");
    const sourceFile = ts.createSourceFile(
      absolutePath,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    const relative = relativePath(repoRoot, absolutePath);

    function report(node, code) {
      if (!FORBIDDEN_SOURCE_PATTERN.test(code)) return;
      findings.push(
        diagnostic({
          code: "SPEC-STORY-SOURCE-BOUNDARY",
          rule: "LN-CAT-024",
          file: relative,
          line: lineOf(sourceFile, node),
          message:
            "Show Code must not expose a story-only demo, harness, fixture, or args expression",
        }),
      );
    }

    function visit(node) {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text.endsWith("?raw")
      ) {
        const rawModule = node.moduleSpecifier.text.slice(0, -4);
        const target = resolveLocalModule(absolutePath, rawModule);
        if (target) report(node.moduleSpecifier, readFileSync(target, "utf8"));
        return;
      }
      if (
        (ts.isStringLiteral(node) ||
          ts.isNoSubstitutionTemplateLiteral(node) ||
          ts.isTemplateHead(node) ||
          ts.isTemplateMiddle(node) ||
          ts.isTemplateTail(node)) &&
        !ts.isImportDeclaration(node.parent)
      ) {
        report(node, node.text);
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }
  return findings;
}

export function validate(context) {
  const findings = [];
  const helperCache = new Map();
  const validatedHelpers = new Set();
  const storiesRoot = path.join(context.model.repoRoot, "stories");

  findings.push(...validateExampleSources(storiesRoot, context.model.repoRoot));

  for (const absolutePath of storyFiles(storiesRoot)) {
    const source = readFileSync(absolutePath, "utf8");
    const sourceFile = ts.createSourceFile(
      absolutePath,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    const { imports, storyOnly } = importModel(sourceFile, absolutePath);
    if (!storyOnly.length || isAutodocsDisabled(sourceFile)) continue;

    const relative = relativePath(context.model.repoRoot, absolutePath);
    const localSources = docsSourceObjects(sourceFile);
    const importedSources = calledImportedHelpers(sourceFile, imports).flatMap(
      (helper) => {
        const parsed = helperSources(helper, helperCache);
        const helperKey = `${helper.resolved}:${helper.imported}`;
        if (!validatedHelpers.has(helperKey)) {
          validatedHelpers.add(helperKey);
          validateSourceObjects(
            parsed.objects,
            parsed.sourceFile,
            relativePath(context.model.repoRoot, helper.resolved),
            findings,
          );
        }
        return parsed.objects;
      },
    );

    validateSourceObjects(localSources, sourceFile, relative, findings);
    if (localSources.length || importedSources.length) continue;

    findings.push(
      diagnostic({
        code: "SPEC-STORY-SOURCE-MISSING",
        rule: "LN-GOV-023",
        file: relative,
        line: lineOf(sourceFile, storyOnly[0]),
        message:
          "Autodocs story uses a local demo, harness, or fixture without explicit consumer source",
      }),
    );
  }
  return findings;
}
