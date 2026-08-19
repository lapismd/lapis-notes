export const PUBLIC_TASKS_PROJECTION_ID = "tasks/task";
export const PUBLIC_ROLES_PROJECTION_ID = "roles/role";
export const MAX_PROJECTION_ROWS_PER_SOURCE = 64;
export const MAX_PROJECTION_INDEXED_FIELDS = 64;
export const MAX_PROJECTION_VALUE_CHARS = 4096;

export type IndexScalar = string | number | boolean | null;
export type IndexCompareOp = "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
export type IndexFieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "path"
  | "json";
export type IndexProjectionVisibility = "public" | "private";
export type IndexProjectionSourceStatus = "ready" | "building" | "error";
export type IndexStatus = "ready" | "building" | "error";

export type IndexFilter =
  | { op: "and"; operands: IndexFilter[] }
  | { op: "or"; operands: IndexFilter[] }
  | { op: "not"; operand: IndexFilter }
  | { op: "compare"; field: string; comparison: IndexCompareOp; value: IndexScalar }
  | { op: "in"; field: string; values: IndexScalar[] }
  | { op: "exists"; field: string }
  | { op: "not-exists"; field: string };

export interface IndexOrderBy {
  field: string;
  direction?: "asc" | "desc";
  nulls?: "first" | "last";
}

export interface IndexQuery {
  where?: IndexFilter;
  select?: string[];
  orderBy?: IndexOrderBy[];
  limit?: number;
  after?: string;
  includeStale?: boolean;
}

export interface IndexQueryResult<T = Record<string, unknown>> {
  rows: T[];
  nextCursor?: string;
  revision: number;
  complete: boolean;
  indexStatus: IndexStatus;
}

export interface IndexRelatedQuery {
  projectionId: string;
  rowId: string;
  relation: string;
  direction?: "out" | "in";
  targetWhere?: IndexFilter;
  limit?: number;
}

export interface IndexFieldDefinition {
  type: IndexFieldType;
  indexed?: boolean;
  sortable?: boolean;
  unique?: boolean;
  cardinality?: "one" | "many";
}

export interface IndexProjectionSourceFilter {
  extensions?: string[];
  pathPrefix?: string;
  basename?: string;
  propertyEquals?: Record<string, IndexScalar>;
}

export interface IndexProjectionRowInput {
  id: string;
  kind: string;
  ordinal?: number;
  data: Record<string, unknown>;
}

export interface IndexProjectionEdgeInput {
  sourceRowId: string;
  relation: string;
  targetProjectionId?: string | null;
  targetRowId?: string | null;
  targetPath?: string | null;
  targetText?: string | null;
  ordinal: number;
  data?: Record<string, unknown> | null;
}

export interface IndexProjectionDefinitionRecord {
  projectionId: string;
  ownerPluginId: string;
  schemaVersion: number;
  configHash: string;
  visibility: IndexProjectionVisibility;
  fields: Record<string, IndexFieldDefinition>;
  active: boolean;
  updatedAt: number;
}

export interface IndexProjectionSourceRecord {
  projectionId: string;
  sourcePath: string;
  sourceHash: string;
  schemaVersion: number;
  configHash: string;
  status: IndexProjectionSourceStatus;
  error?: string | null;
  indexedAt: number;
}

export interface IndexProjectionRowRecord {
  projectionId: string;
  rowId: string;
  sourcePath: string;
  kind: string;
  ordinal: number;
  data: Record<string, unknown>;
}

export interface IndexProjectionValueRecord {
  projectionId: string;
  rowId: string;
  field: string;
  ordinal: number;
  valueType: IndexFieldType;
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  datetimeValue?: number | null;
}

export interface IndexProjectionEdgeRecord {
  projectionId: string;
  sourceRowId: string;
  relation: string;
  targetProjectionId?: string | null;
  targetRowId?: string | null;
  targetPath?: string | null;
  targetText?: string | null;
  ordinal: number;
  data?: Record<string, unknown> | null;
}

export interface ReplaceProjectionSourceInput {
  projectionId: string;
  sourcePath: string;
  sourceHash: string;
  rows: IndexProjectionRowInput[];
  edges?: IndexProjectionEdgeInput[];
  writerPluginId?: string;
}

export interface MarkProjectionSourceErrorInput {
  projectionId: string;
  sourcePath: string;
  sourceHash: string;
  error: string;
  writerPluginId?: string;
}

export function and(...operands: IndexFilter[]): IndexFilter {
  return { op: "and", operands };
}

export function or(...operands: IndexFilter[]): IndexFilter {
  return { op: "or", operands };
}

export function not(operand: IndexFilter): IndexFilter {
  return { op: "not", operand };
}

export function eq(field: string, value: IndexScalar): IndexFilter {
  return { op: "compare", field, comparison: "eq", value };
}

export function ne(field: string, value: IndexScalar): IndexFilter {
  return { op: "compare", field, comparison: "ne", value };
}

export function lt(field: string, value: IndexScalar): IndexFilter {
  return { op: "compare", field, comparison: "lt", value };
}

export function lte(field: string, value: IndexScalar): IndexFilter {
  return { op: "compare", field, comparison: "lte", value };
}

export function gt(field: string, value: IndexScalar): IndexFilter {
  return { op: "compare", field, comparison: "gt", value };
}

export function gte(field: string, value: IndexScalar): IndexFilter {
  return { op: "compare", field, comparison: "gte", value };
}

export function isIn(field: string, values: IndexScalar[]): IndexFilter {
  return { op: "in", field, values };
}

export function exists(field: string): IndexFilter {
  return { op: "exists", field };
}

export function notExists(field: string): IndexFilter {
  return { op: "not-exists", field };
}

export function isNull(field: string): IndexFilter {
  return { op: "compare", field, comparison: "eq", value: null };
}

export function qualifyProjectionId(pluginId: string, localId: string): string {
  const plugin = pluginId.trim();
  const local = localId.trim();
  if (!plugin || !local) {
    throw new Error("Projection ids must include a plugin id and local id.");
  }
  if (local.includes("/")) {
    throw new Error("Local projection ids must not contain '/'.");
  }
  return `${plugin}/${local}`;
}

export function projectionOwnerId(projectionId: string): string {
  const [owner] = projectionId.split("/", 1);
  return owner ?? "";
}

export function assertProjectionWriteAccess(
  projectionId: string,
  writerPluginId?: string,
): void {
  if (!writerPluginId) return;
  if (projectionOwnerId(projectionId) !== writerPluginId) {
    throw new Error(`Plugin ${writerPluginId} cannot write ${projectionId}.`);
  }
}

export function assertProjectionReadAccess(
  definition: IndexProjectionDefinitionRecord | undefined,
  readerPluginId?: string,
): void {
  if (!definition?.active) {
    throw new Error("Projection is not registered.");
  }
  if (definition.visibility === "public") return;
  if (readerPluginId && readerPluginId === definition.ownerPluginId) return;
  throw new Error(`Projection ${definition.projectionId} is private.`);
}

export function fieldValue(
  data: Record<string, unknown>,
  field: string,
): unknown {
  if (Object.hasOwn(data, field)) return data[field];
  return undefined;
}

function scalarOf(value: unknown): IndexScalar | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value === "string" || typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean") return value;
  return String(value);
}

function compareScalars(left: IndexScalar | undefined, right: IndexScalar): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }
  return String(left).localeCompare(String(right));
}

export function matchesIndexFilter(
  data: Record<string, unknown>,
  filter?: IndexFilter,
): boolean {
  if (!filter) return true;
  switch (filter.op) {
    case "and":
      return filter.operands.every((operand) => matchesIndexFilter(data, operand));
    case "or":
      return filter.operands.some((operand) => matchesIndexFilter(data, operand));
    case "not":
      return !matchesIndexFilter(data, filter.operand);
    case "exists":
      return fieldValue(data, filter.field) != null;
    case "not-exists":
      return fieldValue(data, filter.field) == null;
    case "in": {
      const value = scalarOf(fieldValue(data, filter.field));
      return filter.values.some((candidate) => compareScalars(value, candidate) === 0);
    }
    case "compare": {
      const left = scalarOf(fieldValue(data, filter.field));
      if (filter.comparison === "eq") {
        if (filter.value == null) return left == null;
        return compareScalars(left, filter.value) === 0;
      }
      if (filter.comparison === "ne") {
        if (filter.value == null) return left != null;
        return compareScalars(left, filter.value) !== 0;
      }
      if (left == null) return false;
      const comparison = compareScalars(left, filter.value);
      if (filter.comparison === "lt") return comparison < 0;
      if (filter.comparison === "lte") return comparison <= 0;
      if (filter.comparison === "gt") return comparison > 0;
      return comparison >= 0;
    }
    default:
      return false;
  }
}

function encodeCursor(values: IndexScalar[], rowId: string): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify({ values, rowId }))));
}

function decodeCursor(cursor: string): { values: IndexScalar[]; rowId: string } {
  return JSON.parse(decodeURIComponent(escape(atob(cursor)))) as {
    values: IndexScalar[];
    rowId: string;
  };
}

function afterCursor(
  sortValues: IndexScalar[],
  rowId: string,
  after: string,
  orderBy: IndexOrderBy[],
): boolean {
  const cursor = decodeCursor(after);
  const length = Math.max(sortValues.length, cursor.values.length, orderBy.length);
  for (let index = 0; index < length; index += 1) {
    const spec = orderBy[index] ?? { field: "id", direction: "asc" as const };
    const direction = spec.direction === "desc" ? -1 : 1;
    const comparison = compareScalars(sortValues[index] ?? null, cursor.values[index] ?? null);
    if (comparison === 0) continue;
    return comparison * direction > 0;
  }
  return rowId > cursor.rowId;
}

export function selectProjectionRow<T>(
  data: Record<string, unknown>,
  select?: string[],
): T {
  if (!select?.length) return data as T;
  const picked: Record<string, unknown> = {};
  for (const field of select) picked[field] = data[field];
  return picked as T;
}

export function evaluateProjectionQuery<T>(
  rows: IndexProjectionRowRecord[],
  query: IndexQuery,
  revision: number,
  indexStatus: IndexStatus,
): IndexQueryResult<T> {
  const orderBy = query.orderBy ?? [];
  const filtered = rows.filter((row) => matchesIndexFilter(row.data, query.where));
  filtered.sort((left, right) => {
    for (const spec of orderBy) {
      const direction = spec.direction === "desc" ? -1 : 1;
      const comparison = compareScalars(
        scalarOf(fieldValue(left.data, spec.field)),
        scalarOf(fieldValue(right.data, spec.field)) ?? null,
      );
      if (comparison !== 0) {
        if (spec.nulls === "first" && fieldValue(left.data, spec.field) == null) return -1;
        if (spec.nulls === "first" && fieldValue(right.data, spec.field) == null) return 1;
        if (spec.nulls === "last" && fieldValue(left.data, spec.field) == null) return 1;
        if (spec.nulls === "last" && fieldValue(right.data, spec.field) == null) return -1;
        return comparison * direction;
      }
    }
    return left.rowId.localeCompare(right.rowId);
  });
  const after = query.after
    ? filtered.filter((row) =>
        afterCursor(
          orderBy.map((spec) => scalarOf(fieldValue(row.data, spec.field)) ?? null),
          row.rowId,
          query.after!,
          orderBy,
        ),
      )
    : filtered;
  const limit = query.limit && query.limit > 0 ? query.limit : after.length;
  const page = after.slice(0, limit);
  const last = page.at(-1);
  return {
    rows: page.map((row) => selectProjectionRow<T>(row.data, query.select)),
    nextCursor:
      last && after.length > page.length
        ? encodeCursor(
            orderBy.map((spec) => scalarOf(fieldValue(last.data, spec.field)) ?? null),
            last.rowId,
          )
        : undefined,
    revision,
    complete: indexStatus !== "building",
    indexStatus,
  };
}

export function indexedValuesForRow(
  projectionId: string,
  row: IndexProjectionRowInput,
  fields: Record<string, IndexFieldDefinition>,
): IndexProjectionValueRecord[] {
  const values: IndexProjectionValueRecord[] = [];
  let fieldCount = 0;
  for (const [field, definition] of Object.entries(fields)) {
    if (!definition.indexed && !definition.sortable) continue;
    fieldCount += 1;
    if (fieldCount > MAX_PROJECTION_INDEXED_FIELDS) break;
    const raw = row.data[field];
    const items = definition.cardinality === "many" && Array.isArray(raw) ? raw : [raw];
    items.forEach((item, ordinal) => {
      const scalar = scalarOf(item);
      const record: IndexProjectionValueRecord = {
        projectionId,
        rowId: row.id,
        field,
        ordinal,
        valueType: definition.type,
      };
      if (scalar == null) {
        values.push(record);
        return;
      }
      if (definition.type === "number") record.numberValue = Number(scalar);
      else if (definition.type === "boolean") record.booleanValue = Boolean(scalar);
      else if (definition.type === "datetime") record.datetimeValue = Number(scalar);
      else if (definition.type === "date") record.dateValue = String(scalar).slice(0, MAX_PROJECTION_VALUE_CHARS);
      else record.textValue = String(scalar).slice(0, MAX_PROJECTION_VALUE_CHARS);
      values.push(record);
    });
  }
  return values;
}

export function compileProjectionQuerySql(
  projectionId: string,
  query: IndexQuery,
  definition: IndexProjectionDefinitionRecord,
): { sql: string; args: unknown[] } {
  const args: unknown[] = [projectionId, definition.schemaVersion, definition.configHash];
  const where = query.includeStale
    ? "r.projection_id = ? AND s.schema_version = ? AND s.config_hash = ?"
    : `r.projection_id = ?
       AND s.status = 'ready'
       AND s.schema_version = ?
       AND s.config_hash = ?
       AND (f.path IS NULL OR (f.hash = s.source_hash AND f.deleted = 0))`;
  const filter = query.where
    ? ` AND (${compileFilterSql(query.where, args)})`
    : "";
  const orderBy = compileOrderBySql(query.orderBy ?? [], args);
  const limit = query.limit && query.limit > 0 ? " LIMIT ?" : "";
  if (limit) args.push(query.limit);
  return {
    sql: `SELECT r.row_id, r.source_path, r.kind, r.ordinal, r.data_json
          FROM index_projection_rows r
          INNER JOIN index_projection_sources s
            ON s.projection_id = r.projection_id AND s.source_path = r.source_path
          LEFT JOIN files f ON f.path = r.source_path
          WHERE ${where}${filter}
          ${orderBy}${limit}`,
    args,
  };
}

function jsonExtract(field: string): string {
  return `json_extract(r.data_json, '$.${field.replaceAll("'", "''")}')`;
}

function compileFilterSql(filter: IndexFilter, args: unknown[]): string {
  switch (filter.op) {
    case "and":
      return filter.operands.map((operand) => `(${compileFilterSql(operand, args)})`).join(" AND ");
    case "or":
      return filter.operands.map((operand) => `(${compileFilterSql(operand, args)})`).join(" OR ");
    case "not":
      return `NOT (${compileFilterSql(filter.operand, args)})`;
    case "exists":
      return `${jsonExtract(filter.field)} IS NOT NULL`;
    case "not-exists":
      return `${jsonExtract(filter.field)} IS NULL`;
    case "in": {
      if (filter.values.length === 0) return "0";
      const placeholders = filter.values.map(() => "?").join(", ");
      args.push(...filter.values);
      return `${jsonExtract(filter.field)} IN (${placeholders})`;
    }
    case "compare": {
      const expr = jsonExtract(filter.field);
      if (filter.comparison === "eq" && filter.value == null) return `${expr} IS NULL`;
      if (filter.comparison === "ne" && filter.value == null) return `${expr} IS NOT NULL`;
      const operator =
        filter.comparison === "eq"
          ? "="
          : filter.comparison === "ne"
            ? "!="
            : filter.comparison === "lt"
              ? "<"
              : filter.comparison === "lte"
                ? "<="
                : filter.comparison === "gt"
                  ? ">"
                  : ">=";
      args.push(filter.value);
      return `${expr} ${operator} ?`;
    }
    default:
      return "0";
  }
}

function compileOrderBySql(orderBy: IndexOrderBy[], _args: unknown[]): string {
  if (orderBy.length === 0) return "ORDER BY r.row_id ASC";
  const clauses = orderBy.map((spec) => {
    const expr = jsonExtract(spec.field);
    const direction = spec.direction === "desc" ? "DESC" : "ASC";
    const nulls = spec.nulls === "first" ? "NULLS FIRST" : "NULLS LAST";
    return `${expr} ${direction} ${nulls}`;
  });
  clauses.push("r.row_id ASC");
  return `ORDER BY ${clauses.join(", ")}`;
}

export function projectionIndexStatus(
  sources: IndexProjectionSourceRecord[],
): IndexStatus {
  if (sources.some((source) => source.status === "building")) return "building";
  if (sources.some((source) => source.status === "error")) return "error";
  return "ready";
}

export interface IndexProjectionFileRef {
  path: string;
  extension: string;
  name: string;
}

export interface IndexProjectionProjectContext {
  file: IndexProjectionFileRef;
  content: string;
  cache?: { frontmatter?: Record<string, unknown> | null };
}

export interface IndexProjectionProjectResult {
  rows: IndexProjectionRowInput[];
  edges?: IndexProjectionEdgeInput[];
}

export interface IndexProjectionRegistration {
  id: string;
  version: number;
  visibility?: IndexProjectionVisibility;
  configurationHash?: string;
  fields: Record<string, IndexFieldDefinition>;
  source?: IndexProjectionSourceFilter;
  project(
    context: IndexProjectionProjectContext,
  ): IndexProjectionProjectResult | Promise<IndexProjectionProjectResult>;
}

export interface RegisteredIndexProjection<T = Record<string, unknown>> {
  projectionId: string;
  ownerPluginId: string;
  registration: IndexProjectionRegistration;
}

export interface RegisteredIndexProjectionHandle<T = Record<string, unknown>> {
  id: string;
  query(query: IndexQuery): Promise<IndexQueryResult<T>>;
  get(id: string): Promise<T | null>;
  queryRelated(
    query: Omit<IndexRelatedQuery, "projectionId">,
  ): Promise<IndexQueryResult<T>>;
}

export function matchesProjectionSource(
  file: IndexProjectionFileRef,
  cache: { frontmatter?: Record<string, unknown> | null } | undefined,
  source?: IndexProjectionSourceFilter,
): boolean {
  if (!source) return true;
  if (source.extensions?.length) {
    const extension = file.extension.replace(/^\./, "").toLowerCase();
    if (!source.extensions.some((entry) => entry.replace(/^\./, "").toLowerCase() === extension)) {
      return false;
    }
  }
  if (source.basename && file.name !== source.basename) return false;
  if (source.pathPrefix) {
    const prefix = source.pathPrefix.replace(/^\/+|\/+$/g, "");
    if (file.path !== prefix && !file.path.startsWith(`${prefix}/`)) return false;
  }
  if (source.propertyEquals) {
    const frontmatter = cache?.frontmatter ?? {};
    for (const [key, value] of Object.entries(source.propertyEquals)) {
      if ((frontmatter as Record<string, unknown>)[key] !== value) return false;
    }
  }
  return true;
}

export class IndexProjectionRegistry {
  private readonly registrations = new Map<string, RegisteredIndexProjection>();

  register(ownerPluginId: string, registration: IndexProjectionRegistration): RegisteredIndexProjection {
    const projectionId = qualifyProjectionId(ownerPluginId, registration.id);
    const record = { projectionId, ownerPluginId, registration };
    this.registrations.set(projectionId, record);
    return record;
  }

  unregister(projectionId: string): void {
    this.registrations.delete(projectionId);
  }

  get(projectionId: string): RegisteredIndexProjection | undefined {
    return this.registrations.get(projectionId);
  }

  matching(
    file: IndexProjectionFileRef,
    cache?: { frontmatter?: Record<string, unknown> | null },
  ): RegisteredIndexProjection[] {
    return [...this.registrations.values()].filter((entry) =>
      matchesProjectionSource(file, cache, entry.registration.source),
    );
  }
}

export function sourceIsCurrent(
  source: IndexProjectionSourceRecord,
  fileHash: string | undefined,
  definition: IndexProjectionDefinitionRecord,
  includeStale = false,
): boolean {
  if (includeStale) return true;
  if (source.status !== "ready") return false;
  if (source.schemaVersion !== definition.schemaVersion) return false;
  if (source.configHash !== definition.configHash) return false;
  if (fileHash == null) return true;
  return source.sourceHash === fileHash;
}
