import {
  parseSearchQueryAst,
  type SearchQueryAst,
  type SearchQueryComparison,
  type SearchQueryExpression,
  type SearchQueryField,
  type SearchQueryLiteral,
  type SearchQueryProperty,
} from "../search-query";
import type {
  AppDatabasePropertyRecord,
  AppDatabaseSearchField,
  AppDatabaseSearchRange,
  SearchDocumentRecord,
} from "./app-database";

export interface SearchQueryEvaluationOptions {
  caseSensitive?: boolean;
}

export interface SearchQueryTextRangeOptions
  extends SearchQueryEvaluationOptions {
  field?: AppDatabaseSearchField;
}

export interface SearchQueryDocumentEvaluation {
  matched: boolean;
  score: number;
}

type TextScope = {
  text: string;
  offset: number;
};

type TextEvaluation = {
  matched: boolean;
  score: number;
  ranges: AppDatabaseSearchRange[];
};

type DocumentEvaluation = {
  matched: boolean;
  score: number;
  ranges: Partial<Record<AppDatabaseSearchField, AppDatabaseSearchRange[]>>;
};

const EMPTY_TEXT_EVALUATION: TextEvaluation = {
  matched: false,
  score: 0,
  ranges: [],
};

const EMPTY_DOCUMENT_EVALUATION: DocumentEvaluation = {
  matched: false,
  score: 0,
  ranges: {},
};

const FIELD_WEIGHTS: Record<AppDatabaseSearchField, number> = {
  name: 35,
  path: 30,
  tags: 25,
  metadata: 18,
  content: 12,
};

export function isStructuredSearchQuery(query: string): boolean {
  const ast = parseSearchQueryAst(query);
  if (ast.diagnostics.length > 0) {
    return false;
  }
  return containsStructuredExpression(ast.expression);
}

export function evaluateSearchQueryForDocument(
  document: SearchDocumentRecord,
  query: string,
  properties: AppDatabasePropertyRecord[] = [],
  options: SearchQueryEvaluationOptions = {},
): SearchQueryDocumentEvaluation {
  const ast = parseSearchQueryAst(query);
  if (ast.diagnostics.length > 0) {
    return evaluateLegacyTerms(document, query, options);
  }

  const evaluation = evaluateDocumentExpression(
    ast.expression,
    document,
    properties,
    options,
  );
  return {
    matched: evaluation.matched,
    score: evaluation.score,
  };
}

export function findSearchQueryRangesInText(
  text: string,
  query: string,
  options: SearchQueryTextRangeOptions = {},
): AppDatabaseSearchRange[] {
  const ast = parseSearchQueryAst(query);
  if (ast.diagnostics.length > 0) {
    return mergeRanges(
      legacyTerms(query).flatMap((term) =>
        findLiteralRanges(text, term, options),
      ),
    );
  }

  return mergeRanges(
    evaluateTextExpression(ast.expression, text, options).ranges,
  );
}

function containsStructuredExpression(
  expression: SearchQueryExpression | null,
): boolean {
  if (!expression) return false;
  switch (expression.type) {
    case "literal":
      return expression.kind === "regex" || expression.kind === "null";
    case "group":
      return containsStructuredExpression(expression.expression);
    case "and":
    case "or":
      return (
        expression.type === "or" ||
        expression.clauses.some(containsStructuredExpression)
      );
    default:
      return true;
  }
}

function evaluateDocumentExpression(
  expression: SearchQueryExpression | null,
  document: SearchDocumentRecord,
  properties: AppDatabasePropertyRecord[],
  options: SearchQueryEvaluationOptions,
): DocumentEvaluation {
  if (!expression) return { matched: true, score: 0, ranges: {} };

  switch (expression.type) {
    case "literal":
      return evaluateLiteralAcrossDocument(expression, document, options);
    case "group":
      return evaluateDocumentExpression(
        expression.expression,
        document,
        properties,
        options,
      );
    case "and":
      return combineDocumentAnd(
        expression.clauses.map((clause) =>
          evaluateDocumentExpression(clause, document, properties, options),
        ),
      );
    case "or":
      return combineDocumentOr(
        expression.clauses.map((clause) =>
          evaluateDocumentExpression(clause, document, properties, options),
        ),
      );
    case "not": {
      const operand = evaluateDocumentExpression(
        expression.operand,
        document,
        properties,
        options,
      );
      return operand.matched
        ? EMPTY_DOCUMENT_EVALUATION
        : { matched: true, score: 1, ranges: {} };
    }
    case "field":
      return evaluateFieldExpression(expression, document, properties, options);
    case "property":
      return evaluatePropertyExpression(
        expression,
        properties,
        document,
        options,
      );
    case "comparison":
      return EMPTY_DOCUMENT_EVALUATION;
  }
}

function evaluateTextExpression(
  expression: SearchQueryExpression | null,
  text: string,
  options: SearchQueryTextRangeOptions,
): TextEvaluation {
  if (!expression) return { matched: true, score: 0, ranges: [] };

  switch (expression.type) {
    case "literal": {
      const ranges = literalRanges(text, expression, options);
      return {
        matched: ranges.length > 0,
        score: ranges.length * literalScore(expression),
        ranges,
      };
    }
    case "group":
      return evaluateTextExpression(expression.expression, text, options);
    case "and":
      return combineTextAnd(
        expression.clauses.map((clause) =>
          evaluateTextExpression(clause, text, options),
        ),
      );
    case "or":
      return combineTextOr(
        expression.clauses.map((clause) =>
          evaluateTextExpression(clause, text, options),
        ),
      );
    case "not": {
      const operand = evaluateTextExpression(expression.operand, text, options);
      return operand.matched
        ? EMPTY_TEXT_EVALUATION
        : { matched: true, score: 1, ranges: [] };
    }
    case "field":
      return evaluateTextFieldExpression(expression, text, options);
    case "property":
      return evaluateTextPropertyExpression(expression, text, options);
    case "comparison":
      return EMPTY_TEXT_EVALUATION;
  }
}

function evaluateLiteralAcrossDocument(
  literal: SearchQueryLiteral,
  document: SearchDocumentRecord,
  options: SearchQueryEvaluationOptions,
): DocumentEvaluation {
  const evaluations = documentFields(document).map(([field, text]) => {
    const ranges = literalRanges(text, literal, { ...options, field });
    return {
      field,
      ranges,
      score: ranges.length ? ranges.length * FIELD_WEIGHTS[field] : 0,
    };
  });
  const matches = evaluations.filter((entry) => entry.ranges.length > 0);
  if (!matches.length) return EMPTY_DOCUMENT_EVALUATION;

  return {
    matched: true,
    score: matches.reduce((total, entry) => total + entry.score, 0),
    ranges: Object.fromEntries(
      matches.map((entry) => [entry.field, entry.ranges]),
    ),
  };
}

function evaluateFieldExpression(
  field: SearchQueryField,
  document: SearchDocumentRecord,
  properties: AppDatabasePropertyRecord[],
  options: SearchQueryEvaluationOptions,
): DocumentEvaluation {
  const name = field.name.toLowerCase();
  if (name === "match-case") {
    return evaluateDocumentExpression(field.value, document, properties, {
      ...options,
      caseSensitive: true,
    });
  }
  if (name === "ignore-case") {
    return evaluateDocumentExpression(field.value, document, properties, {
      ...options,
      caseSensitive: false,
    });
  }

  const mappedField = fieldNameToSearchField(name);
  if (mappedField) {
    const text = documentFieldText(document, mappedField);
    const evaluation = evaluateTextExpression(field.value, text, {
      ...options,
      field: mappedField,
    });
    if (!evaluation.matched) return EMPTY_DOCUMENT_EVALUATION;
    return {
      matched: true,
      score: Math.max(1, evaluation.score) + FIELD_WEIGHTS[mappedField],
      ranges: { [mappedField]: evaluation.ranges },
    };
  }

  if (name === "line") {
    return evaluateContentScopes(
      lineScopes(document.content),
      field.value,
      options,
    );
  }
  if (name === "block") {
    return evaluateContentScopes(
      blockScopes(document.content),
      field.value,
      options,
    );
  }
  if (name === "section") {
    return evaluateContentScopes(
      sectionScopes(document.content),
      field.value,
      options,
    );
  }
  if (name === "task" || name === "task-todo" || name === "task-done") {
    const status =
      name === "task-todo" ? "todo" : name === "task-done" ? "done" : "any";
    return evaluateContentScopes(
      taskScopes(document.content, status),
      field.value,
      options,
    );
  }

  return EMPTY_DOCUMENT_EVALUATION;
}

function evaluateTextFieldExpression(
  field: SearchQueryField,
  text: string,
  options: SearchQueryTextRangeOptions,
): TextEvaluation {
  const name = field.name.toLowerCase();
  if (name === "match-case") {
    return evaluateTextExpression(field.value, text, {
      ...options,
      caseSensitive: true,
    });
  }
  if (name === "ignore-case") {
    return evaluateTextExpression(field.value, text, {
      ...options,
      caseSensitive: false,
    });
  }

  const mappedField = fieldNameToSearchField(name);
  if (mappedField) {
    if (options.field !== mappedField) return EMPTY_TEXT_EVALUATION;
    return evaluateTextExpression(field.value, text, options);
  }

  if (
    options.field === "content" &&
    (name === "line" ||
      name === "block" ||
      name === "section" ||
      name === "task" ||
      name === "task-todo" ||
      name === "task-done")
  ) {
    const scopes =
      name === "line"
        ? lineScopes(text)
        : name === "block"
          ? blockScopes(text)
          : name === "section"
            ? sectionScopes(text)
            : taskScopes(
                text,
                name === "task-todo"
                  ? "todo"
                  : name === "task-done"
                    ? "done"
                    : "any",
              );
    return evaluateTextScopes(scopes, field.value, options);
  }

  return EMPTY_TEXT_EVALUATION;
}

function evaluatePropertyExpression(
  property: SearchQueryProperty,
  properties: AppDatabasePropertyRecord[],
  document: SearchDocumentRecord,
  options: SearchQueryEvaluationOptions,
): DocumentEvaluation {
  const record = resolvePropertyRecord(property.name, properties);
  if (!record) return EMPTY_DOCUMENT_EVALUATION;

  const metadataRanges = propertyNameMetadataRanges(
    document.metadataText ?? "",
    property.name,
    options,
  );

  if (!property.value) {
    return {
      matched: true,
      score: 30,
      ranges: { metadata: metadataRanges },
    };
  }

  if (property.value.type === "comparison") {
    const matched = comparePropertyValue(record.value, property.value);
    return matched
      ? { matched: true, score: 35, ranges: { metadata: metadataRanges } }
      : EMPTY_DOCUMENT_EVALUATION;
  }

  if (property.value.type === "literal" && property.value.kind === "null") {
    const matched = isNullishPropertyValue(record.value);
    return matched
      ? { matched: true, score: 35, ranges: { metadata: metadataRanges } }
      : EMPTY_DOCUMENT_EVALUATION;
  }

  const values = propertyValueTexts(record.value);
  const valueEvaluation = combineTextOr(
    values.map((value) =>
      evaluateTextExpression(property.value, value, options),
    ),
  );
  if (!valueEvaluation.matched) return EMPTY_DOCUMENT_EVALUATION;

  return {
    matched: true,
    score: valueEvaluation.score + 30,
    ranges: {
      metadata: mergeRanges([
        ...metadataRanges,
        ...values.flatMap((value) =>
          findSearchQueryRangesInText(document.metadataText ?? "", value, {
            ...options,
            field: "metadata",
          }),
        ),
      ]),
    },
  };
}

function evaluateTextPropertyExpression(
  property: SearchQueryProperty,
  text: string,
  options: SearchQueryTextRangeOptions,
): TextEvaluation {
  if (options.field !== "metadata") return EMPTY_TEXT_EVALUATION;
  const nameRanges = propertyNameMetadataRanges(text, property.name, options);
  if (!nameRanges.length) return EMPTY_TEXT_EVALUATION;
  if (!property.value) {
    return {
      matched: true,
      score: nameRanges.length * FIELD_WEIGHTS.metadata,
      ranges: nameRanges,
    };
  }
  const valueEvaluation = evaluateTextExpression(property.value, text, options);
  if (!valueEvaluation.matched) return EMPTY_TEXT_EVALUATION;
  return {
    matched: true,
    score: valueEvaluation.score + FIELD_WEIGHTS.metadata,
    ranges: mergeRanges([...nameRanges, ...valueEvaluation.ranges]),
  };
}

function evaluateContentScopes(
  scopes: TextScope[],
  expression: SearchQueryExpression | null,
  options: SearchQueryEvaluationOptions,
): DocumentEvaluation {
  const evaluation = evaluateTextScopes(scopes, expression, {
    ...options,
    field: "content",
  });
  if (!evaluation.matched) return EMPTY_DOCUMENT_EVALUATION;
  return {
    matched: true,
    score: evaluation.score + FIELD_WEIGHTS.content,
    ranges: { content: evaluation.ranges },
  };
}

function evaluateTextScopes(
  scopes: TextScope[],
  expression: SearchQueryExpression | null,
  options: SearchQueryTextRangeOptions,
): TextEvaluation {
  const matches = scopes
    .map((scope) => {
      const evaluation = evaluateTextExpression(
        expression,
        scope.text,
        options,
      );
      return {
        ...evaluation,
        ranges: evaluation.ranges.map((range) => ({
          start: scope.offset + range.start,
          end: scope.offset + range.end,
        })),
      };
    })
    .filter((evaluation) => evaluation.matched);
  if (!matches.length) return EMPTY_TEXT_EVALUATION;
  return {
    matched: true,
    score: matches.reduce(
      (total, entry) => total + Math.max(1, entry.score),
      0,
    ),
    ranges: mergeRanges(matches.flatMap((entry) => entry.ranges)),
  };
}

function evaluateLegacyTerms(
  document: SearchDocumentRecord,
  query: string,
  options: SearchQueryEvaluationOptions,
): SearchQueryDocumentEvaluation {
  const terms = legacyTerms(query);
  if (!terms.length) return { matched: true, score: 0 };
  let score = 0;
  const fields = documentFields(document);
  for (const term of terms) {
    let matched = false;
    for (const [field, text] of fields) {
      const ranges = findLiteralRanges(text, term, { ...options, field });
      if (ranges.length) {
        matched = true;
        score += ranges.length * FIELD_WEIGHTS[field];
      }
    }
    if (!matched) return { matched: false, score: 0 };
  }
  return { matched: true, score };
}

function combineDocumentAnd(items: DocumentEvaluation[]): DocumentEvaluation {
  if (items.some((item) => !item.matched)) return EMPTY_DOCUMENT_EVALUATION;
  return {
    matched: true,
    score: items.reduce((total, item) => total + item.score, 0),
    ranges: mergeFieldRanges(items.map((item) => item.ranges)),
  };
}

function combineDocumentOr(items: DocumentEvaluation[]): DocumentEvaluation {
  const matches = items.filter((item) => item.matched);
  if (!matches.length) return EMPTY_DOCUMENT_EVALUATION;
  return {
    matched: true,
    score: matches.reduce((total, item) => total + item.score, 0),
    ranges: mergeFieldRanges(matches.map((item) => item.ranges)),
  };
}

function combineTextAnd(items: TextEvaluation[]): TextEvaluation {
  if (items.some((item) => !item.matched)) return EMPTY_TEXT_EVALUATION;
  return {
    matched: true,
    score: items.reduce((total, item) => total + item.score, 0),
    ranges: mergeRanges(items.flatMap((item) => item.ranges)),
  };
}

function combineTextOr(items: TextEvaluation[]): TextEvaluation {
  const matches = items.filter((item) => item.matched);
  if (!matches.length) return EMPTY_TEXT_EVALUATION;
  return {
    matched: true,
    score: matches.reduce((total, item) => total + item.score, 0),
    ranges: mergeRanges(matches.flatMap((item) => item.ranges)),
  };
}

function literalRanges(
  text: string,
  literal: SearchQueryLiteral,
  options: SearchQueryTextRangeOptions,
): AppDatabaseSearchRange[] {
  if (literal.kind === "null" || literal.value === null) return [];
  if (literal.kind === "regex") {
    return findRegexRanges(text, literal.value, options);
  }
  return findLiteralRanges(text, literal.value, options);
}

function literalScore(literal: SearchQueryLiteral): number {
  return literal.kind === "regex"
    ? 20
    : Math.max(1, literal.value?.length ?? 1);
}

function findLiteralRanges(
  text: string,
  term: string,
  options: SearchQueryTextRangeOptions,
): AppDatabaseSearchRange[] {
  const needle = options.caseSensitive ? term : term.toLowerCase();
  const haystack = options.caseSensitive ? text : text.toLowerCase();
  if (!needle.length) return [];

  const ranges: AppDatabaseSearchRange[] = [];
  let cursor = 0;
  while (cursor < haystack.length) {
    const index = haystack.indexOf(needle, cursor);
    if (index === -1) break;
    ranges.push({ start: index, end: index + term.length });
    cursor = index + Math.max(1, term.length);
    if (ranges.length >= 64) break;
  }
  return ranges;
}

function findRegexRanges(
  text: string,
  source: string,
  options: SearchQueryTextRangeOptions,
): AppDatabaseSearchRange[] {
  try {
    const flags = options.caseSensitive ? "gu" : "giu";
    const regex = new RegExp(source, flags);
    const ranges: AppDatabaseSearchRange[] = [];
    for (const match of text.matchAll(regex)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      if (end > start) {
        ranges.push({ start, end });
      }
      if (ranges.length >= 64) break;
    }
    return ranges;
  } catch {
    return [];
  }
}

function fieldNameToSearchField(name: string): AppDatabaseSearchField | null {
  switch (name) {
    case "file":
      return "name";
    case "path":
      return "path";
    case "content":
      return "content";
    case "tag":
      return "tags";
    default:
      return null;
  }
}

function documentFields(
  document: SearchDocumentRecord,
): Array<[AppDatabaseSearchField, string]> {
  return [
    ["name", document.name],
    ["path", document.path],
    [
      "content",
      document.chunks?.map((chunk) => chunk.text).join("\n") ||
        document.content,
    ],
    ["tags", documentFieldText(document, "tags")],
    ["metadata", document.metadataText ?? ""],
  ];
}

function documentFieldText(
  document: SearchDocumentRecord,
  field: AppDatabaseSearchField,
): string {
  switch (field) {
    case "name":
      return document.name;
    case "path":
      return document.path;
    case "content":
      return document.content;
    case "tags":
      return [
        ...document.tags,
        ...document.tags.map((tag) => `#${tag}`),
        ...document.tagParts,
        ...document.tagHierarchy,
      ].join(" ");
    case "metadata":
      return document.metadataText ?? "";
  }
}

function resolvePropertyRecord(
  name: string,
  properties: AppDatabasePropertyRecord[],
): Pick<AppDatabasePropertyRecord, "name" | "value"> | null {
  const exact = properties.find(
    (entry) => entry.name.toLowerCase() === name.toLowerCase(),
  );
  if (exact) {
    return exact;
  }

  const segments = nestedPropertySegments(name);
  if (segments.length < 2) {
    return null;
  }

  const [root, ...path] = segments;
  const rootRecord = properties.find(
    (entry) => entry.name.toLowerCase() === root.toLowerCase(),
  );
  if (!rootRecord) {
    return null;
  }

  const values = resolveNestedPropertyValues(rootRecord.value, path);
  if (!values.length) {
    return null;
  }

  return {
    name,
    value: values.length === 1 ? values[0] : values,
  };
}

function nestedPropertySegments(name: string): string[] {
  return name
    .replace(/\[\]/gu, "")
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function resolveNestedPropertyValues(
  value: unknown,
  segments: string[],
): unknown[] {
  if (!segments.length) {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => resolveNestedPropertyValues(item, segments));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const segment = segments[0]!;
  const rest = segments.slice(1);
  if (!Object.prototype.hasOwnProperty.call(value, segment)) {
    return [];
  }

  return resolveNestedPropertyValues(
    (value as Record<string, unknown>)[segment],
    rest,
  );
}

function propertyNameMetadataRanges(
  text: string,
  name: string,
  options: SearchQueryEvaluationOptions,
): AppDatabaseSearchRange[] {
  const exact = findLiteralRanges(text, name, {
    ...options,
    field: "metadata",
  });
  if (exact.length) {
    return exact;
  }

  const segments = nestedPropertySegments(name);
  if (segments.length < 2) {
    return exact;
  }

  return mergeRanges(
    segments.flatMap((segment) =>
      findLiteralRanges(text, segment, {
        ...options,
        field: "metadata",
      }),
    ),
  );
}

function propertyValueTexts(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => propertyValueTexts(item));
  }
  if (value && typeof value === "object") {
    return [JSON.stringify(value)];
  }
  if (value === null || value === undefined) {
    return [""];
  }
  return [String(value)];
}

function comparePropertyValue(
  propertyValue: unknown,
  comparison: SearchQueryComparison,
): boolean {
  const values = propertyValueComparisonValues(propertyValue);
  return values.some((value) => compareSinglePropertyValue(value, comparison));
}

function propertyValueComparisonValues(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => propertyValueComparisonValues(item));
  }
  return [value];
}

function compareSinglePropertyValue(
  propertyValue: unknown,
  comparison: SearchQueryComparison,
): boolean {
  const target = comparison.value?.value;
  if (target === null || target === undefined) return false;

  const leftNumber = Number(propertyValue);
  const rightNumber = Number(target);
  let order: number;
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    order = leftNumber - rightNumber;
  } else {
    const leftDate = Date.parse(String(propertyValue));
    const rightDate = Date.parse(String(target));
    if (Number.isFinite(leftDate) && Number.isFinite(rightDate)) {
      order = leftDate - rightDate;
    } else {
      order = String(propertyValue).localeCompare(String(target));
    }
  }

  switch (comparison.operator) {
    case "<":
      return order < 0;
    case "<=":
      return order <= 0;
    case ">":
      return order > 0;
    case ">=":
      return order >= 0;
  }
}

function isNullishPropertyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) {
    return value.length === 0 || value.some(isNullishPropertyValue);
  }
  return false;
}

function lineScopes(text: string): TextScope[] {
  const scopes: TextScope[] = [];
  let offset = 0;
  for (const line of text.split(/\n/)) {
    scopes.push({ text: line, offset });
    offset += line.length + 1;
  }
  return scopes;
}

function blockScopes(text: string): TextScope[] {
  const scopes: TextScope[] = [];
  const pattern = /\S(?:.|\n)*?(?=\n\s*\n|$)/g;
  for (const match of text.matchAll(pattern)) {
    scopes.push({ text: match[0], offset: match.index ?? 0 });
  }
  return scopes.length ? scopes : [{ text, offset: 0 }];
}

function sectionScopes(text: string): TextScope[] {
  const headings = [...text.matchAll(/^#{1,6}\s+.*$/gm)].map((match) => ({
    offset: match.index ?? 0,
    level: match[0].match(/^#+/)?.[0].length ?? 1,
  }));
  if (!headings.length) return [{ text, offset: 0 }];

  return headings.map((heading, index) => {
    const next = headings
      .slice(index + 1)
      .find((candidate) => candidate.level <= heading.level);
    const end = next?.offset ?? text.length;
    return {
      text: text.slice(heading.offset, end),
      offset: heading.offset,
    };
  });
}

function taskScopes(
  text: string,
  status: "any" | "todo" | "done",
): TextScope[] {
  return lineScopes(text).filter((scope) => {
    const match = scope.text.match(/^\s*[-*+]\s+\[([^\]])\]\s+/);
    if (!match) return false;
    const done = match[1]?.toLowerCase() === "x";
    return status === "any" || (status === "done" ? done : !done);
  });
}

function legacyTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function mergeFieldRanges(
  ranges: Array<
    Partial<Record<AppDatabaseSearchField, AppDatabaseSearchRange[]>>
  >,
): Partial<Record<AppDatabaseSearchField, AppDatabaseSearchRange[]>> {
  const merged: Partial<
    Record<AppDatabaseSearchField, AppDatabaseSearchRange[]>
  > = {};
  for (const fieldRanges of ranges) {
    for (const [field, values] of Object.entries(fieldRanges) as Array<
      [AppDatabaseSearchField, AppDatabaseSearchRange[] | undefined]
    >) {
      merged[field] = mergeRanges([
        ...(merged[field] ?? []),
        ...(values ?? []),
      ]);
    }
  }
  return merged;
}

function mergeRanges(
  ranges: AppDatabaseSearchRange[],
): AppDatabaseSearchRange[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: AppDatabaseSearchRange[] = [];
  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}
