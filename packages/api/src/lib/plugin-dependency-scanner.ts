export type PluginDependencyImportKind =
  | "require"
  | "static-import"
  | "dynamic-import"
  | "export";

export interface PluginDependencySpecifier {
  specifier: string;
  kind: PluginDependencyImportKind;
  index: number;
}

interface ScannedPluginDependencySpecifier extends PluginDependencySpecifier {
  end: number;
}

export function scanPluginDependencySpecifiers(
  source: string,
): PluginDependencySpecifier[] {
  const matches: PluginDependencySpecifier[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === "'" || char === '"') {
      index = consumeQuotedString(source, index, char).end;
      continue;
    }
    if (char === "`") {
      index = consumeTemplateLiteral(source, index);
      continue;
    }
    if (char === "/" && next === "/") {
      index = consumeLineComment(source, index);
      continue;
    }
    if (char === "/" && next === "*") {
      index = consumeBlockComment(source, index);
      continue;
    }
    if (!isIdentifierStart(char)) {
      index += 1;
      continue;
    }

    const wordStart = index;
    index = consumeIdentifier(source, index);
    const word = source.slice(wordStart, index);
    if (!isImportLikeKeywordStart(source, wordStart)) {
      continue;
    }
    const match =
      word === "require"
        ? scanRequire(source, wordStart, index)
        : word === "import"
          ? scanImport(source, wordStart, index)
          : word === "export"
            ? scanExport(source, wordStart, index)
            : null;
    if (match) {
      matches.push({
        specifier: match.specifier,
        kind: match.kind,
        index: match.index,
      });
      index = Math.max(index, match.end);
    }
  }

  return sortSpecifierMatches(matches);
}

export function scanBarePluginDependencySpecifiers(source: string): string[] {
  return [
    ...new Set(
      scanPluginDependencySpecifiers(source)
        .map((match) => match.specifier)
        .filter(isBarePluginDependencySpecifier),
    ),
  ].sort();
}

export function isBarePluginDependencySpecifier(specifier: string): boolean {
  return (
    specifier.length > 0 &&
    !specifier.startsWith(".") &&
    !specifier.startsWith("/") &&
    !/^[a-zA-Z][a-zA-Z\d+.-]*:/u.test(specifier)
  );
}

function scanRequire(
  source: string,
  wordStart: number,
  cursor: number,
): ScannedPluginDependencySpecifier | null {
  if (
    previousNonWhitespaceCharacter(source, wordStart) === "." ||
    isOptionalRequireFallback(source, wordStart)
  ) {
    return null;
  }
  cursor = skipWhitespaceAndComments(source, cursor);
  if (source[cursor] !== "(") {
    return null;
  }
  cursor = skipWhitespaceAndComments(source, cursor + 1);
  const string = readStringLiteral(source, cursor);
  if (!string) {
    return null;
  }
  return {
    specifier: string.value,
    kind: "require",
    index: wordStart,
    end: string.end,
  };
}

function scanImport(
  source: string,
  wordStart: number,
  cursor: number,
): ScannedPluginDependencySpecifier | null {
  cursor = skipWhitespaceAndComments(source, cursor);
  if (source[cursor] === ".") {
    return null;
  }
  if (source[cursor] === "(") {
    cursor = skipWhitespaceAndComments(source, cursor + 1);
    const string = readStringLiteral(source, cursor);
    return string
      ? {
          specifier: string.value,
          kind: "dynamic-import",
          index: wordStart,
          end: string.end,
        }
      : null;
  }

  const sideEffect = readStringLiteral(source, cursor);
  if (sideEffect) {
    return {
      specifier: sideEffect.value,
      kind: "static-import",
      index: wordStart,
      end: sideEffect.end,
    };
  }

  const fromString = scanDeclarationFromSpecifier(source, cursor);
  return fromString
    ? {
        specifier: fromString.value,
        kind: "static-import",
        index: wordStart,
        end: fromString.end,
      }
    : null;
}

function scanExport(
  source: string,
  wordStart: number,
  cursor: number,
): ScannedPluginDependencySpecifier | null {
  const fromString = scanDeclarationFromSpecifier(source, cursor);
  return fromString
    ? {
        specifier: fromString.value,
        kind: "export",
        index: wordStart,
        end: fromString.end,
      }
    : null;
}

function scanDeclarationFromSpecifier(
  source: string,
  cursor: number,
): { value: string; end: number } | null {
  while (cursor < source.length) {
    const char = source[cursor];
    const next = source[cursor + 1];
    if (char === ";") {
      return null;
    }
    if (char === "'" || char === '"') {
      cursor = consumeQuotedString(source, cursor, char).end;
      continue;
    }
    if (char === "`") {
      cursor = consumeTemplateLiteral(source, cursor);
      continue;
    }
    if (char === "/" && next === "/") {
      cursor = consumeLineComment(source, cursor);
      continue;
    }
    if (char === "/" && next === "*") {
      cursor = consumeBlockComment(source, cursor);
      continue;
    }
    if (!isIdentifierStart(char)) {
      cursor += 1;
      continue;
    }

    const wordStart = cursor;
    cursor = consumeIdentifier(source, cursor);
    if (source.slice(wordStart, cursor) !== "from") {
      continue;
    }
    cursor = skipWhitespaceAndComments(source, cursor);
    return readStringLiteral(source, cursor);
  }
  return null;
}

function readStringLiteral(
  source: string,
  index: number,
): { value: string; end: number } | null {
  const quote = source[index];
  if (quote !== "'" && quote !== '"') {
    return null;
  }
  return consumeQuotedString(source, index, quote);
}

function consumeQuotedString(
  source: string,
  start: number,
  quote: string,
): { value: string; end: number } {
  let value = "";
  let index = start + 1;
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      value += source.slice(index, index + 2);
      index += 2;
      continue;
    }
    if (char === quote) {
      return { value: unescapeStringLiteral(value), end: index + 1 };
    }
    value += char;
    index += 1;
  }
  return { value: unescapeStringLiteral(value), end: index };
}

function consumeTemplateLiteral(source: string, start: number): number {
  let index = start + 1;
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      index += 2;
      continue;
    }
    index += 1;
    if (char === "`") {
      break;
    }
  }
  return index;
}

function consumeLineComment(source: string, start: number): number {
  const end = source.indexOf("\n", start + 2);
  return end === -1 ? source.length : end;
}

function consumeBlockComment(source: string, start: number): number {
  const end = source.indexOf("*/", start + 2);
  return end === -1 ? source.length : end + 2;
}

function skipWhitespaceAndComments(source: string, cursor: number): number {
  while (cursor < source.length) {
    const char = source[cursor];
    const next = source[cursor + 1];
    if (/\s/u.test(char)) {
      cursor += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      cursor = consumeLineComment(source, cursor);
      continue;
    }
    if (char === "/" && next === "*") {
      cursor = consumeBlockComment(source, cursor);
      continue;
    }
    break;
  }
  return cursor;
}

function consumeIdentifier(source: string, start: number): number {
  let index = start + 1;
  while (index < source.length && isIdentifierPart(source[index])) {
    index += 1;
  }
  return index;
}

function isIdentifierStart(char: string | undefined): boolean {
  return Boolean(char && /[A-Za-z_$]/u.test(char));
}

function isIdentifierPart(char: string | undefined): boolean {
  return Boolean(char && /[A-Za-z0-9_$]/u.test(char));
}

function isImportLikeKeywordStart(source: string, index: number): boolean {
  const previous = source[index - 1];
  return previous !== "'" && previous !== '"' && previous !== "`";
}

function previousNonWhitespaceCharacter(
  source: string,
  index: number,
): string | null {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (!/\s/u.test(source[cursor])) {
      return source[cursor] ?? null;
    }
  }
  return null;
}

function isOptionalRequireFallback(source: string, index: number): boolean {
  const prefix = source.slice(Math.max(0, index - 160), index);
  const previousBlockClose = prefix.lastIndexOf("}");
  const currentBlockPrefix =
    previousBlockClose === -1 ? prefix : prefix.slice(previousBlockClose + 1);
  return (
    /typeof\s+require\s*(?:={2,3}|!==?)\s*["']function["']/u.test(
      currentBlockPrefix,
    ) ||
    /if\s*\(\s*typeof\s+require\s*(?:={2,3}|!==?)\s*["']function["']\s*\)\s*try\s*\{[\s\S]*(?:const|let|var)\s+\{[^}]*\}\s*=\s*$/u.test(
      prefix,
    )
  );
}

function sortSpecifierMatches(
  matches: PluginDependencySpecifier[],
): PluginDependencySpecifier[] {
  return matches.sort((left, right) => left.index - right.index);
}

function unescapeStringLiteral(value: string): string {
  return value.replace(/\\(["'\\])/g, "$1");
}
