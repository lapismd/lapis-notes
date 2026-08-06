import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const fixturePath = path.join(packageRoot, "test/fixtures/obsidian.d.ts");
const parityPath = path.join(packageRoot, "test/parity/obsidian-parity.json");
const sourceRoot = path.join(packageRoot, "src/lib");

const KEY_CLASSES = [
  "App",
  "Vault",
  "DataAdapter",
  "TAbstractFile",
  "TFile",
  "TFolder",
  "Workspace",
  "WorkspaceLeaf",
  "Editor",
  "Plugin",
  "Component",
  "Menu",
  "Setting",
  "MetadataCache",
];

const IMPLEMENTED_OVERRIDES = new Set([
  "BasesAllOptions",
  "BasesConfigFile",
  "BasesConfigFileFilter",
  "BasesConfigFileView",
  "BasesDropdownOption",
  "BasesEntry",
  "BasesEntryGroup",
  "BasesFileOption",
  "BasesFolderOption",
  "BasesFormulaOption",
  "BasesMultitextOption",
  "BasesOption",
  "BasesOptionGroup",
  "BasesOptions",
  "BasesProperty",
  "BasesPropertyId",
  "BasesPropertyOption",
  "BasesPropertyType",
  "BasesQueryResult",
  "BasesSliderOption",
  "BasesSortConfig",
  "BasesTextOption",
  "BasesToggleOption",
  "BasesViewConfig",
  "BlockSubpathResult",
  "BooleanValue",
  "CliData",
  "CliFlag",
  "CliFlags",
  "CliHandler",
  "CloseableComponent",
  "DateValue",
  "DurationValue",
  "FileValue",
  "FootnoteSubpathResult",
  "FormulaContext",
  "FuzzyMatch",
  "FuzzySuggestModal",
  "HeadingSubpathResult",
  "HexString",
  "HTMLValue",
  "IconValue",
  "ImageValue",
  "AbstractInputSuggest",
  "iterateCacheRefs",
  "iterateRefs",
  "LinkValue",
  "ListValue",
  "MenuSeparator",
  "NotNullValue",
  "NullValue",
  "NumberValue",
  "ObjectValue",
  "ObsidianProtocolData",
  "ObsidianProtocolHandler",
  "parsePropertyId",
  "prepareFuzzySearch",
  "prepareSimpleSearch",
  "PrimitiveValue",
  "RegExpValue",
  "RelativeDateValue",
  "renderMatches",
  "renderResults",
  "resolveSubpath",
  "SearchMatches",
  "SearchMatchPart",
  "SearchResult",
  "SearchResultContainer",
  "SecretComponent",
  "Side",
  "sortSearchResults",
  "StringValue",
  "SubpathResult",
  "SuggestModal",
  "TagValue",
  "toValue",
  "UrlValue",
  "Value",
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function walkTsFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      files.push(...walkTsFiles(fullPath));
      continue;
    }
    if (
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".spec.ts")
    ) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function createSourceFile(filePath) {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function hasModifier(node, kind) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === kind));
}

function isExported(node) {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

function declarationKind(node) {
  if (ts.isClassDeclaration(node)) return "class";
  if (ts.isInterfaceDeclaration(node)) return "interface";
  if (ts.isTypeAliasDeclaration(node)) return "type";
  if (ts.isEnumDeclaration(node)) return "enum";
  if (ts.isFunctionDeclaration(node)) return "function";
  if (ts.isVariableStatement(node)) return "variable";
  return null;
}

function exportedDeclarations(sourceFile) {
  const declarations = new Map();
  for (const statement of sourceFile.statements) {
    if (!isExported(statement)) continue;
    const kind = declarationKind(statement);
    if (!kind) continue;
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          declarations.set(declaration.name.text, { kind });
        }
      }
      continue;
    }
    if (!statement.name || !ts.isIdentifier(statement.name)) continue;
    declarations.set(statement.name.text, { kind });
  }
  return declarations;
}

function declarationMap(files) {
  const declarations = new Map();
  for (const file of files) {
    const sourceFile = createSourceFile(file);
    for (const statement of sourceFile.statements) {
      if (
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement) ||
        ts.isFunctionDeclaration(statement)
      ) {
        if (statement.name && ts.isIdentifier(statement.name)) {
          declarations.set(statement.name.text, statement);
        }
        continue;
      }
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          declarations.set(declaration.name.text, declaration);
        }
      }
    }
  }
  return declarations;
}

function memberName(node) {
  if (!node.name) return null;
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) {
    return node.name.text;
  }
  if (ts.isNumericLiteral(node.name)) {
    return node.name.text;
  }
  return null;
}

function isInstanceMember(node) {
  if (hasModifier(node, ts.SyntaxKind.StaticKeyword)) return false;
  if (hasModifier(node, ts.SyntaxKind.PrivateKeyword)) return false;
  if (hasModifier(node, ts.SyntaxKind.ProtectedKeyword)) return false;
  return true;
}

function isParameterProperty(parameter) {
  return Boolean(
    parameter.modifiers?.some((modifier) =>
      [
        ts.SyntaxKind.PublicKeyword,
        ts.SyntaxKind.PrivateKeyword,
        ts.SyntaxKind.ProtectedKeyword,
        ts.SyntaxKind.ReadonlyKeyword,
      ].includes(modifier.kind),
    ),
  );
}

function ownMembers(declaration) {
  const members = new Set();

  if (
    ts.isClassDeclaration(declaration) ||
    ts.isInterfaceDeclaration(declaration)
  ) {
    for (const member of declaration.members) {
      if (!isInstanceMember(member)) continue;
      if (
        ts.isConstructorDeclaration(member) &&
        ts.isClassDeclaration(declaration)
      ) {
        for (const parameter of member.parameters) {
          if (!isParameterProperty(parameter)) continue;
          if (ts.isIdentifier(parameter.name)) {
            members.add(parameter.name.text);
          }
        }
        continue;
      }
      const name = memberName(member);
      if (name) {
        members.add(name);
      }
    }
  }

  return [...members].sort();
}

function baseName(expression) {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }
  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }
  if (ts.isQualifiedName(expression)) {
    return expression.right.text;
  }
  return null;
}

function heritageNames(declaration) {
  const names = [];
  if (
    !ts.isClassDeclaration(declaration) &&
    !ts.isInterfaceDeclaration(declaration)
  ) {
    return names;
  }

  for (const clause of declaration.heritageClauses ?? []) {
    if (
      clause.token !== ts.SyntaxKind.ExtendsKeyword &&
      !ts.isInterfaceDeclaration(declaration)
    ) {
      continue;
    }
    if (
      clause.token !== ts.SyntaxKind.ExtendsKeyword &&
      clause.token !== ts.SyntaxKind.ImplementsKeyword &&
      ts.isInterfaceDeclaration(declaration)
    ) {
      continue;
    }
    if (
      ts.isClassDeclaration(declaration) &&
      clause.token !== ts.SyntaxKind.ExtendsKeyword
    ) {
      continue;
    }
    for (const type of clause.types) {
      const name = baseName(type.expression);
      if (name) {
        names.push(name);
      }
    }
  }

  return names;
}

function collectMembers(name, declarations, cache, seen = new Set()) {
  if (cache.has(name)) {
    return cache.get(name);
  }

  const declaration = declarations.get(name);
  if (!declaration) {
    const empty = [];
    cache.set(name, empty);
    return empty;
  }

  if (seen.has(name)) {
    return [];
  }

  const nextSeen = new Set(seen);
  nextSeen.add(name);

  const members = new Set(ownMembers(declaration));
  for (const base of heritageNames(declaration)) {
    for (const member of collectMembers(base, declarations, cache, nextSeen)) {
      members.add(member);
    }
  }

  const collected = [...members].sort();
  cache.set(name, collected);
  return collected;
}

function nextStatus(name, currentSymbols) {
  if (IMPLEMENTED_OVERRIDES.has(name)) {
    return "implemented";
  }
  const current = currentSymbols[name]?.status;
  if (!current) {
    throw new Error(`Missing parity status for upstream export: ${name}`);
  }
  return current;
}

function main() {
  const current = readJson(parityPath);
  const fixtureSource = createSourceFile(fixturePath);
  const sourceFiles = walkTsFiles(sourceRoot);
  const localDeclarations = declarationMap(sourceFiles);
  const upstreamDeclarations = declarationMap([fixturePath]);
  const upstreamExports = exportedDeclarations(fixtureSource);
  const upstreamMemberCache = new Map();
  const localMemberCache = new Map();

  const symbols = {};
  for (const name of [...upstreamExports.keys()].sort()) {
    symbols[name] = {
      kind: upstreamExports.get(name).kind,
      status: nextStatus(name, current.symbols),
    };
  }

  const keyMembers = {};
  for (const className of KEY_CLASSES) {
    const upstream = collectMembers(
      className,
      upstreamDeclarations,
      upstreamMemberCache,
    );
    const local = collectMembers(
      className,
      localDeclarations,
      localMemberCache,
    );
    keyMembers[className] = {
      upstream,
      local,
      missing: upstream.filter((member) => !local.includes(member)),
    };
  }

  writeJson(parityPath, {
    statuses: current.statuses,
    symbols,
    keyMembers,
  });
}

main();
