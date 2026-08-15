import {
  AttributeExpression,
  BooleanExpression,
  ColumnExpression,
  Decimal,
  Expression,
  FunctionExpression,
  isNull,
  isValidNumber,
  LiteralExpression,
  parseQuery,
  Query,
  readString,
  SubscriptExpression,
  typeName,
} from "peaql";
import {
  filterGroupType,
  filterGroupValues,
  isFilterGroup,
  isFilterLine,
  type BasesViewBase,
  type FilterLine,
  type Filters,
} from "./models";
import { isNumber } from "lodash-es";
import { DateTime } from "luxon";
import type { BasesPropertyId } from "@lapis-notes/api";

const OPS = new Set([
  ">",
  "=",
  "<",
  "!=",
  ">=",
  "<=",
  "~",
  "~*",
  "!~",
  "!~*",
  "?~",
  "?~*",
  "+",
  "-",
  "*",
  "%",
  "/",
]);

export function isOp(op: string) {
  return OPS.has(op);
}

export function parsePredicate(query: string) {
  if (!query) return null;
  const [expr] = parseQuery(`SELECT 1 WHERE ${query}`);
  if (expr instanceof Query && expr.where) {
    return resolveQuery(expr.where);
  }
}

export const INVALID_FILTER_FORMULA_MESSAGE =
  "Invalid filter formula. Check the expression syntax.";

export type FilterPredicateValidation =
  | { valid: true; predicate: unknown; error: null }
  | { valid: false; predicate: null; error: string };

export function validateFilterPredicate(
  query: string,
): FilterPredicateValidation {
  if (!query.trim()) {
    return { valid: true, predicate: null, error: null };
  }

  try {
    const predicate = parsePredicate(query);
    if (predicate) {
      return { valid: true, predicate, error: null };
    }
  } catch {
    // The editor keeps the draft available for correction and reports one
    // stable, user-facing message instead of leaking parser internals.
  }

  return {
    valid: false,
    predicate: null,
    error: INVALID_FILTER_FORMULA_MESSAGE,
  };
}

export function resolveFilterDraft(applied: string, draft: string) {
  const validation = validateFilterPredicate(draft);
  return {
    applied: validation.valid ? draft : applied,
    error: validation.error,
    valid: validation.valid,
  };
}

export function normalizeFilter(filter: Filters) {
  const values: Array<any> = filterGroupValues(filter).slice();
  values.forEach((value, i) => {
    if (isFilterGroup(value)) {
      normalizeFilter(value);
    }
  });

  const type = filterGroupType(filter);
  return {
    [type]: values.filter((f) => {
      if (typeof f === "string") {
        return f.trim().length > 0;
      }
      return f;
    }),
  } as Filters;
}

function toSQLValue(value: unknown): any {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) {
    return value.map(toSQLValue).join(",");
  }
  if (typeof value === "string") {
    value = readString(value);
  } else if (typeof value === "number" || value instanceof Decimal) {
    if (!isNull(value) && isValidNumber(value.toString())) {
      return new Decimal(value.toString()).number;
    }
  } else if (value instanceof DateTime) {
    value = value.toISO();
  }
  return JSON.stringify(value);
}

function replaceFormulas(query: string, formulas: Record<string, string> = {}) {
  while (query.match(/formula\["([^"]*)"\]|filter\.[a-zA-Z_][a-zA-Z0-9_]*/g)) {
    query = query.replaceAll(
      /formula\["([^"]*)"\]|filter\.[a-zA-Z_][a-zA-Z0-9_]*/g,
      (match, captured) => {
        return formulas[captured] || "null";
      },
    );
  }
  return query;
}

export function toSQL(
  filter: unknown,
  formulas: Record<string, string> = {},
): string {
  if (isFilterGroup(filter)) {
    const type = filterGroupType(filter);
    const values = filterGroupValues(filter)
      .map((it) => toSQL(it, formulas))
      .filter((it) => it.trim());
    if (!values.length) return "";
    if (type === "not") {
      return `NOT (${values.join(` OR `)})`;
    }
    return "(" + values.join(` ${type.toUpperCase()} `).trim() + ")";
  } else if (isFilterLine(filter)) {
    const filt = filter as FilterLine;

    if (filt.custom) {
      return filt.custom as string;
    }
    if (
      filt.op &&
      filt.column &&
      (filter.value !== null || filt.value !== undefined)
    ) {
      let op = filter.op;
      let column = filter.column;
      const [isFilter, filterKey] = isFilterColumn(column);
      if (isFilter) {
        if (formulas && filterKey in formulas && formulas[filterKey]) {
          column = `(${formulas[filterKey]})`;
        }
      } else if (column.match(/^[a-zA-Z0-9_.-]+\[[^\]]+\]$/)) {
        column = column;
      } else if (!column.match(/^[a-zA-Z0-9_.-]+$/)) {
        column = `{${column.replaceAll("}", "}}")}}`;
      }
      if (!OPS.has(op) && op.startsWith("!")) {
        op = op.substring(1);
        column = "!" + column;
      }
      if (OPS.has(op)) {
        return `${column} ${op} ${toSQLValue(filt.value)}`;
      }
      const values = Array.isArray(filt.value) ? filt.value : [filt.value];
      return `${column}.${op}(${toSQLValue(values)})`;
    }
  } else if (typeof filter === "string") {
    return replaceFormulas(filter, formulas);
  }
  return "";
}

function flattenBooleanExpression(
  expr: BooleanExpression,
  targetOp: string,
): unknown[] {
  const conditions: unknown[] = [];

  for (const arg of expr.args) {
    if (arg instanceof BooleanExpression && arg.op === targetOp) {
      // Same operator - flatten recursively
      conditions.push(...flattenBooleanExpression(arg, targetOp));
    } else {
      // Different operator or non-boolean - resolve normally
      conditions.push(resolveQuery(arg));
    }
  }

  return conditions;
}

export function resolveQuery(expr: Expression): unknown {
  if (expr instanceof BooleanExpression) {
    if (expr.args.length == 2) {
      const [left, right] = expr.args;
      const l = resolveQuery(left),
        r = resolveQuery(right);
      if (
        typeof l === "string" &&
        (right instanceof LiteralExpression || isScalar(r))
      ) {
        return { column: l, op: expr.op, value: r };
      }
    }
    if (["AND", "OR", "NOT"].includes(expr.op)) {
      const flattened = flattenBooleanExpression(expr, expr.op);
      if (expr.op === "NOT" && flattened.length == 1) {
        const value = flattened[0];
        if (isFilterLine(value) && !value.custom) {
          if (!OPS.has(value.op)) {
            value.op = "!" + value.op;
            return value;
          }
        }
      }
      return { [expr.op.toLowerCase()]: flattened };
    }
    return { column: "", op: expr.op, value: "", custom: expr.toString() };
  } else if (expr instanceof AttributeExpression) {
    const op = resolveQuery(expr.operand);
    if (typeof expr.name === "string" && typeof op == "string") {
      return `${op}.${expr.name}`;
    } else if (typeof op === "string" && expr.name instanceof Expression) {
      const value = resolveQuery(expr.name);
      if (typeof value === "object") {
        if (value && "custom" in value && value.custom) {
          return { column: op, value: "", ...value, custom: expr.toString() };
        }
        return { column: op, ...value };
      }
    } else {
      return { column: "", op: "", custom: expr.toString(), value: "" };
    }
  } else if (expr instanceof ColumnExpression) {
    return expr.name;
  } else if (expr instanceof LiteralExpression) {
    return expr.value;
  } else if (expr instanceof FunctionExpression) {
    if (
      expr.args.every((it) => {
        return (
          it instanceof LiteralExpression || it instanceof ColumnExpression
        );
      })
    ) {
      let values = expr.args.map((it) => resolveQuery(it));
      if (values.length == 1) {
        return { op: expr.name, value: values[0] };
      }
      return { op: expr.name, value: values };
    }
    return { op: expr.name, custom: expr.toString(), value: "" };
  } else if (expr instanceof SubscriptExpression) {
    if (expr.operand instanceof ColumnExpression) {
      return `${expr.operand.name}["${expr.key}"]`;
    }
  }
  throw new Error(`Unsupported expression(${typeName(expr)}): ${expr}`);
}

function isScalar(value: unknown) {
  const type = typeof value;
  return ["string", "boolean", "number"].includes(type);
}

export function isFilterColumn(column: string): [boolean, string, string] {
  if (!column) return [false, "", ""];
  column = column.trim();
  if (column.startsWith("formula.")) {
    return [true, column.split(".", 2)[1], `{${column}}`];
  } else if (column.startsWith("formula[") && column.endsWith("]")) {
    const id = readString(column.substring(8, column.length - 1));
    return [true, id, `{formula.${id}}`];
  }
  return [false, "", ""];
}

export function formulaColumn(name: string): BasesPropertyId {
  if (name.match(/^[a-zA-Z0-9_]+$/)) {
    return `formula.${name}`;
  }
  return `formula[${JSON.stringify(name)}]` as BasesPropertyId;
}

export function generateQuery(
  view: BasesViewBase,
  formulas: Record<string, string>,
  globalFilter?: Filters,
) {
  let query = "SET identifier_quoting = bracket;\nSELECT\n";
  const columns: Array<string> = [
    ...new Set([
      ...view.order,
      ...(view.groupBy?.property ? [view.groupBy.property] : []),
      ...(typeof view.image === "string" && view.image.length > 0
        ? [view.image]
        : []),
    ]),
  ];
  query += columns
    .map((column) => {
      const [isFilter, filterKey, filterColumn] = isFilterColumn(column);
      if (isFilter) {
        if (filterKey in formulas) {
          if (formulas[filterKey]) {
            return `  (${replaceFormulas(formulas[filterKey], formulas)}) as ${filterColumn}`;
          }
        }
        return `  null as ${filterColumn}`;
      } else if (column.match(/^[a-zA-Z0-9_.-]+$/)) {
        return `  ${column} as {${column}}`;
      }
      return `  {${column}} as {${column}}`;
    })
    .join(",\n");
  query += columns.length ? ",\n  rowId as {$rowId}" : "  rowId as {$rowId}";
  const where = [toSQL(globalFilter, formulas), toSQL(view.filter, formulas)]
    .filter((it) => it.length > 0)
    .map((q) => `(${q})`)
    .join(" and ");
  if (where) {
    query += "\nWHERE " + where;
  }

  const sort = view.sort
    .map((s) => {
      const [isFormula] = isFilterColumn(s.property);
      return isFormula
        ? `(${replaceFormulas(formulaColumn(s.property), formulas)}) ${s.direction}`
        : `{${s.property}} ${s.direction}`;
    })
    .join(",");
  if (sort.length) {
    query += "\nORDER BY " + sort;
  }
  if (view.limit && view.limit > 0) {
    query += "\nLIMIT " + view.limit;
  }
  return query;
}
