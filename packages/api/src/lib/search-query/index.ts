import { LRLanguage, LanguageSupport } from "@codemirror/language";
import type { SearchFilterSyntax } from "@lapismd/design-core/filter";
import type { Tree, TreeCursor } from "@lezer/common";
import { styleTags, tags } from "@lezer/highlight";
import { parser } from "./parser";

export type SearchQueryComparisonOperator = "<" | "<=" | ">" | ">=";

export type SearchQueryLiteralKind = "word" | "phrase" | "regex" | "null";

export interface SearchQueryDiagnostic {
  from: number;
  to: number;
  severity: "error";
  message: string;
  text: string;
}

interface SearchQueryNodeBase {
  from: number;
  to: number;
  text: string;
}

export interface SearchQueryLiteral extends SearchQueryNodeBase {
  type: "literal";
  kind: SearchQueryLiteralKind;
  value: string | null;
}

export interface SearchQueryGroup extends SearchQueryNodeBase {
  type: "group";
  expression: SearchQueryExpression | null;
}

export interface SearchQueryNot extends SearchQueryNodeBase {
  type: "not";
  operand: SearchQueryExpression | null;
}

export interface SearchQueryAnd extends SearchQueryNodeBase {
  type: "and";
  clauses: SearchQueryExpression[];
}

export interface SearchQueryOr extends SearchQueryNodeBase {
  type: "or";
  clauses: SearchQueryExpression[];
}

export interface SearchQueryField extends SearchQueryNodeBase {
  type: "field";
  name: string;
  value: SearchQueryExpression | null;
}

export interface SearchQueryProperty extends SearchQueryNodeBase {
  type: "property";
  name: string;
  value: SearchQueryExpression | null;
}

export interface SearchQueryComparison extends SearchQueryNodeBase {
  type: "comparison";
  operator: SearchQueryComparisonOperator;
  value: SearchQueryLiteral | null;
}

export type SearchQueryExpression =
  | SearchQueryAnd
  | SearchQueryComparison
  | SearchQueryField
  | SearchQueryGroup
  | SearchQueryLiteral
  | SearchQueryNot
  | SearchQueryOr
  | SearchQueryProperty;

export interface SearchQueryAst extends SearchQueryNodeBase {
  type: "query";
  expression: SearchQueryExpression | null;
  diagnostics: SearchQueryDiagnostic[];
}

interface SearchQuerySyntaxNode {
  name: string;
  from: number;
  to: number;
  text: string;
  isError: boolean;
  children: SearchQuerySyntaxNode[];
}

const configuredParser = parser.configure({
  props: [
    styleTags({
      OrKeyword: tags.keyword,
      NullKeyword: tags.atom,
      Negation: tags.operator,
      Word: tags.variableName,
      SlashWord: tags.variableName,
      Identifier: tags.variableName,
      FieldName: tags.attributeName,
      "FieldName/Identifier": tags.attributeName,
      PropertyName: tags.propertyName,
      "PropertyName/Identifier": tags.propertyName,
      "PropertyName/Phrase": tags.propertyName,
      ComparisonOperator: tags.operator,
      Phrase: tags.string,
      Regex: tags.regexp,
      "( )": tags.bracket,
      "[ ]": tags.bracket,
      ":": tags.punctuation,
    }),
  ],
});

export const searchQueryParser = configuredParser;

export const searchQueryLanguage = LRLanguage.define({
  parser: configuredParser,
  languageData: {
    closeBrackets: {
      brackets: ["(", "[", '"', "/"],
    },
  },
});

export function searchQueryLanguageSupport(): LanguageSupport {
  return new LanguageSupport(searchQueryLanguage);
}

const SAFE_SEARCH_QUERY_WORD = /^[A-Za-z0-9_.#*?][A-Za-z0-9_.#*?/]*$/u;
const SAFE_SEARCH_QUERY_IDENTIFIER = /^[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*$/u;
const RESERVED_SEARCH_QUERY_WORDS = new Set(["OR", "null"]);

/** Formats a dynamic field value so it round-trips through the search parser. */
export function formatSearchQueryValue(value: string): string {
  if (
    !RESERVED_SEARCH_QUERY_WORDS.has(value) &&
    (SAFE_SEARCH_QUERY_WORD.test(value) ||
      SAFE_SEARCH_QUERY_IDENTIFIER.test(value))
  ) {
    return value;
  }

  return `"${value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t")}"`;
}

export interface VaultSearchFilterValues {
  fileNames: readonly string[];
  paths: readonly string[];
  tags: readonly string[];
}

/** Builds the shared, parser-safe field catalog for vault search surfaces. */
export function createVaultSearchFilterSyntax({
  fileNames,
  paths,
  tags: tagValues,
}: VaultSearchFilterValues): SearchFilterSyntax {
  const values = (items: readonly string[]) =>
    [...new Set(items)]
      .sort((left, right) => left.localeCompare(right))
      .slice(0, 100)
      .map((value) => ({ value, apply: formatSearchQueryValue(value) }));

  return {
    title: "Vault search syntax",
    description:
      "Combine text with file, path, tag, content, line, section, and bracket-property filters.",
    fields: [
      {
        name: "file",
        description: "File name",
        operators: [":"],
        values: values(fileNames),
      },
      {
        name: "path",
        description: "Folder or path",
        operators: [":"],
        values: values(paths),
      },
      {
        name: "tag",
        description: "Markdown or frontmatter tag",
        operators: [":"],
        values: values(tagValues),
      },
      { name: "content", description: "Note content", operators: [":"] },
      { name: "line", description: "Terms on one line", operators: [":"] },
      {
        name: "section",
        description: "Terms in one section",
        operators: [":"],
      },
    ],
    examples: [
      { query: "tag:#project", description: "Notes with a project tag" },
      {
        query: 'path:"Notes" OR file:Welcome',
        description: "Path or file filters",
      },
      { query: '["status"]:ready', description: "Exact frontmatter property" },
    ],
    notes: ["Use OR for alternatives and -term to exclude a term."],
  };
}

export function parseSearchQuery(input: string): Tree {
  return configuredParser.parse(input);
}

type SearchQueryCursor = TreeCursor;

export function parseSearchQueryAst(input: string): SearchQueryAst {
  const tree = parseSearchQuery(input);
  const syntax = snapshotSearchQueryNode(tree.cursor(), input);

  return {
    type: "query",
    from: 0,
    to: input.length,
    text: input,
    expression: lowerSearchQueryNode(findChild(syntax, "Expression")),
    diagnostics: collectSearchQueryDiagnostics(syntax, input),
  };
}

export function canCollectSearchQueryTerms(
  value: SearchQueryAst | SearchQueryExpression | null,
): boolean {
  const expression = unwrapSearchQueryExpression(value);
  if (!expression) {
    return value?.type === "query" ? value.diagnostics.length === 0 : true;
  }
  if (value?.type === "query" && value.diagnostics.length > 0) {
    return false;
  }

  switch (expression.type) {
    case "literal":
      return expression.kind === "word" || expression.kind === "phrase";
    case "property":
      return expression.value === null;
    case "group":
      return expression.expression === null
        ? true
        : canCollectSearchQueryTerms(expression.expression);
    case "and":
      return expression.clauses.every((clause) =>
        canCollectSearchQueryTerms(clause),
      );
    default:
      return false;
  }
}

export function collectSearchQueryTerms(
  value: string | SearchQueryAst | SearchQueryExpression | null,
): string[] {
  const root = typeof value === "string" ? parseSearchQueryAst(value) : value;
  const expression = unwrapSearchQueryExpression(root);

  if (!canCollectSearchQueryTerms(root)) {
    return [];
  }

  return collectSearchQueryTermValues(expression);
}

export function canCollectSearchQueryPropertyNames(
  value: SearchQueryAst | SearchQueryExpression | null,
): boolean {
  const expression = unwrapSearchQueryExpression(value);
  if (!expression) {
    return value?.type === "query" ? value.diagnostics.length === 0 : true;
  }
  if (value?.type === "query" && value.diagnostics.length > 0) {
    return false;
  }

  switch (expression.type) {
    case "property":
      return expression.value === null;
    case "group":
      return expression.expression === null
        ? true
        : canCollectSearchQueryPropertyNames(expression.expression);
    case "and":
      return expression.clauses.every((clause) =>
        canCollectSearchQueryPropertyNames(clause),
      );
    case "literal":
      return expression.kind === "word" || expression.kind === "phrase";
    default:
      return false;
  }
}

export function collectSearchQueryPropertyNames(
  value: string | SearchQueryAst | SearchQueryExpression | null,
): string[] {
  const root = typeof value === "string" ? parseSearchQueryAst(value) : value;
  const expression = unwrapSearchQueryExpression(root);

  if (!canCollectSearchQueryPropertyNames(root)) {
    return [];
  }

  return collectSearchQueryPropertyNameValues(expression);
}

function snapshotSearchQueryNode(
  cursor: SearchQueryCursor,
  input: string,
): SearchQuerySyntaxNode {
  const node: SearchQuerySyntaxNode = {
    name: cursor.name,
    from: cursor.from,
    to: cursor.to,
    text: input.slice(cursor.from, cursor.to),
    isError: cursor.name === "⚠" || cursor.type.isError,
    children: [],
  };

  if (cursor.firstChild()) {
    do {
      node.children.push(snapshotSearchQueryNode(cursor, input));
    } while (cursor.nextSibling());
    cursor.parent();
  }

  return node;
}

function collectSearchQueryDiagnostics(
  node: SearchQuerySyntaxNode,
  input: string,
  insideError = false,
): SearchQueryDiagnostic[] {
  const diagnostics: SearchQueryDiagnostic[] = [];

  if (node.isError && !insideError) {
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: "error",
      message: formatSearchQueryDiagnosticMessage(node, input),
      text: node.text,
    });
  }

  for (const child of node.children) {
    diagnostics.push(
      ...collectSearchQueryDiagnostics(
        child,
        input,
        insideError || node.isError,
      ),
    );
  }

  return diagnostics;
}

function formatSearchQueryDiagnosticMessage(
  node: SearchQuerySyntaxNode,
  input: string,
): string {
  const token = node.text.trim();
  if (!token.length) {
    return node.from >= input.length
      ? "Incomplete search query"
      : "Invalid search query syntax";
  }
  return `Unexpected token ${JSON.stringify(token)}`;
}

function lowerSearchQueryNode(
  node: SearchQuerySyntaxNode | undefined,
): SearchQueryExpression | null {
  if (!node) return null;

  switch (node.name) {
    case "Expression":
    case "PrimaryExpression":
    case "FieldValue":
    case "PropertyValue":
    case "ComparisonValue":
      return lowerFirstExpressionChild(node);
    case "OrExpression":
      return lowerClauseSequence(node, "AndExpression", "or", "clauses");
    case "AndExpression":
      return lowerClauseSequence(node, "PrefixExpression", "and", "clauses");
    case "PrefixExpression": {
      const operand = lowerSearchQueryNode(
        findChild(node, "PrimaryExpression"),
      );
      if (!findChild(node, "Negation")) {
        return operand;
      }
      return {
        type: "not",
        operand,
        ...nodeRange(node),
      };
    }
    case "Group":
      return {
        type: "group",
        expression: lowerSearchQueryNode(findChild(node, "Expression")),
        ...nodeRange(node),
      };
    case "FieldExpression":
      return {
        type: "field",
        name: readIdentifier(findChild(node, "FieldName")),
        value: lowerSearchQueryNode(findChild(node, "FieldValue")),
        ...nodeRange(node),
      };
    case "PropertyExpression":
      return {
        type: "property",
        name: readPropertyName(findChild(node, "PropertyName")),
        value: lowerSearchQueryNode(findChild(node, "PropertyValue")),
        ...nodeRange(node),
      };
    case "Comparison":
      return {
        type: "comparison",
        operator: readComparisonOperator(findChild(node, "ComparisonOperator")),
        value: lowerSearchQueryLiteral(findChild(node, "ComparisonValue")),
        ...nodeRange(node),
      };
    case "SlashWord":
    case "Word":
    case "Identifier":
      return {
        type: "literal",
        kind: "word",
        value: node.text,
        ...nodeRange(node),
      };
    case "Phrase":
      return {
        type: "literal",
        kind: "phrase",
        value: decodeSearchQueryPhrase(node.text),
        ...nodeRange(node),
      };
    case "Regex":
      return {
        type: "literal",
        kind: "regex",
        value: stripSearchQueryDelimiter(node.text),
        ...nodeRange(node),
      };
    case "NullKeyword":
      return {
        type: "literal",
        kind: "null",
        value: null,
        ...nodeRange(node),
      };
    default:
      return lowerFirstExpressionChild(node);
  }
}

function lowerClauseSequence(
  node: SearchQuerySyntaxNode,
  childName: string,
  type: SearchQueryAnd["type"] | SearchQueryOr["type"],
  key: "clauses",
): SearchQueryExpression | null {
  const clauses = node.children
    .filter((child) => child.name === childName)
    .map((child) => lowerSearchQueryNode(child))
    .filter((child): child is SearchQueryExpression => child !== null);

  if (!clauses.length) return null;
  if (clauses.length === 1) return clauses[0];

  return {
    type,
    [key]: clauses,
    ...nodeRange(node),
  } as SearchQueryAnd | SearchQueryOr;
}

function lowerFirstExpressionChild(
  node: SearchQuerySyntaxNode,
): SearchQueryExpression | null {
  for (const child of node.children) {
    const lowered = lowerSearchQueryNode(child);
    if (lowered) {
      return lowered;
    }
  }
  return null;
}

function lowerSearchQueryLiteral(
  node: SearchQuerySyntaxNode | undefined,
): SearchQueryLiteral | null {
  const lowered = lowerSearchQueryNode(node);
  if (lowered?.type === "literal") {
    return lowered;
  }
  return null;
}

function findChild(
  node: SearchQuerySyntaxNode,
  name: string,
): SearchQuerySyntaxNode | undefined {
  return node.children.find((child) => child.name === name);
}

function readIdentifier(node: SearchQuerySyntaxNode | undefined): string {
  if (!node) return "";
  const identifier = findChild(node, "Identifier");
  return (identifier ?? node).text;
}

function readPropertyName(node: SearchQuerySyntaxNode | undefined): string {
  if (!node) return "";
  const phrase = findChild(node, "Phrase");
  if (phrase) {
    return decodeSearchQueryPhrase(phrase.text);
  }
  return readIdentifier(node);
}

function readComparisonOperator(
  node: SearchQuerySyntaxNode | undefined,
): SearchQueryComparisonOperator {
  const value = node?.text;
  if (value === "<" || value === "<=" || value === ">" || value === ">=") {
    return value;
  }
  return "<";
}

function stripSearchQueryDelimiter(value: string): string {
  if (value.length < 2) return value;
  return value.slice(1, -1);
}

function decodeSearchQueryPhrase(value: string): string {
  return stripSearchQueryDelimiter(value).replace(
    /\\(["\\nrt])/gu,
    (_match, escaped: string) => {
      switch (escaped) {
        case "n":
          return "\n";
        case "r":
          return "\r";
        case "t":
          return "\t";
        default:
          return escaped;
      }
    },
  );
}

function nodeRange(node: SearchQuerySyntaxNode): SearchQueryNodeBase {
  return {
    from: node.from,
    to: node.to,
    text: node.text,
  };
}

function unwrapSearchQueryExpression(
  value: SearchQueryAst | SearchQueryExpression | null,
): SearchQueryExpression | null {
  if (!value) return null;
  return value.type === "query" ? value.expression : value;
}

function collectSearchQueryTermValues(
  expression: SearchQueryExpression | null,
): string[] {
  if (!expression) return [];

  switch (expression.type) {
    case "literal":
      return expression.value ? [expression.value.toLowerCase()] : [];
    case "property":
      return expression.value === null ? [expression.name.toLowerCase()] : [];
    case "group":
      return collectSearchQueryTermValues(expression.expression);
    case "and":
      return expression.clauses.flatMap((clause) =>
        collectSearchQueryTermValues(clause),
      );
    default:
      return [];
  }
}

function collectSearchQueryPropertyNameValues(
  expression: SearchQueryExpression | null,
): string[] {
  if (!expression) return [];

  switch (expression.type) {
    case "property":
      return expression.value === null ? [expression.name.toLowerCase()] : [];
    case "group":
      return collectSearchQueryPropertyNameValues(expression.expression);
    case "and":
      return expression.clauses.flatMap((clause) =>
        collectSearchQueryPropertyNameValues(clause),
      );
    case "literal":
      return [];
    default:
      return [];
  }
}
