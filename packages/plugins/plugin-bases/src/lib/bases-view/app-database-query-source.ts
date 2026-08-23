import {
  type AppDatabase,
  type AppDatabaseIndexedMetadataQuery,
  type AppDatabaseIndexedMetadataRow,
  type AppDatabaseIndexedMetadataSort,
  type AppDatabaseIndexedMetadataPropertyFilter,
  type CachedMetadata,
  type TFile,
} from "@lapis-notes/api";
import {
  isFilterGroup,
  isFilterLine,
  type FilterLine,
  type Filters,
  type SortColumn,
} from "./models";

type BuildBasesAppDatabaseQueryInput = {
  documentFilter: Filters;
  viewFilter?: Filters;
  sort: SortColumn[];
  limit: number | null | undefined;
};

type QuerySourceApp = {
  vault: {
    getFileByPath(path: string): TFile | null;
  };
};

type QuerySourceVaultRecord = {
  id: string;
  checksum?: string;
  file: TFile;
  cache: CachedMetadata | null;
  backlinks?: string[];
};

function clone<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function createSyntheticVaultFile(row: AppDatabaseIndexedMetadataRow): TFile {
  const pathSegments = row.file.path.split("/");
  const name = pathSegments.at(-1) ?? row.file.path;
  const extension = row.file.extension;
  const suffix = extension ? `.${extension}` : "";
  const baseName =
    suffix && name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;

  return {
    path: row.file.path,
    name,
    baseName,
    extension,
    parent: null,
    stat: {
      ctime: row.file.mtime,
      mtime: row.file.mtime,
      size: row.file.size,
    },
  } as TFile;
}

function appendUnique(target: string[], value: string): void {
  if (!value || target.includes(value)) {
    return;
  }
  target.push(value);
}

function appendPropertyFilter(
  target: AppDatabaseIndexedMetadataPropertyFilter[],
  filter: AppDatabaseIndexedMetadataPropertyFilter,
): void {
  if (
    target.some(
      (existing) =>
        existing.name === filter.name &&
        existing.op === filter.op &&
        existing.value === filter.value,
    )
  ) {
    return;
  }
  target.push(filter);
}

function collectConjunctiveFilterLines(
  filter: Filters | FilterLine | string | null | undefined,
): FilterLine[] {
  if (!filter || typeof filter === "string") {
    return [];
  }
  if (isFilterLine(filter)) {
    return [filter];
  }
  if (!isFilterGroup(filter) || !("and" in filter)) {
    return [];
  }

  return filter.and.flatMap((entry) => collectConjunctiveFilterLines(entry));
}

function normalizePropertyName(column: string): string | null {
  if (!column || column === "file" || column.startsWith("formula.")) {
    return null;
  }
  if (column.startsWith("file.")) {
    return null;
  }
  return column.startsWith("note.") ? column.slice("note.".length) : column;
}

function isScalarFilterValue(
  value: unknown,
): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function lowerFilterLine(
  query: AppDatabaseIndexedMetadataQuery,
  filter: FilterLine,
): void {
  if (filter.custom) {
    return;
  }

  const rawValues = (
    Array.isArray(filter.value) ? filter.value : [filter.value]
  ) as unknown[];
  const values = rawValues.filter(isScalarFilterValue);

  if (filter.column === "file" && filter.op === "inFolder") {
    for (const value of values) {
      if (typeof value === "string") {
        appendUnique((query.pathPrefixes ??= []), value);
      }
    }
    return;
  }

  if (filter.column === "file" && filter.op === "hasTag") {
    for (const value of values) {
      if (typeof value === "string") {
        appendUnique((query.requiredTags ??= []), value);
      }
    }
    return;
  }

  if (filter.column === "file" && filter.op === "hasProperty") {
    for (const value of values) {
      if (typeof value === "string") {
        appendPropertyFilter((query.propertyFilters ??= []), {
          name: value,
          op: "exists",
        });
      }
    }
    return;
  }

  if (filter.column === "file" && filter.op === "!hasProperty") {
    for (const value of values) {
      if (typeof value === "string") {
        appendPropertyFilter((query.propertyFilters ??= []), {
          name: value,
          op: "not-exists",
        });
      }
    }
    return;
  }

  if (filter.column === "file.ext" && filter.op === "=") {
    for (const value of values) {
      if (typeof value === "string") {
        appendUnique((query.extensions ??= []), value);
      }
    }
    return;
  }

  const propertyName = normalizePropertyName(filter.column);
  if (!propertyName) {
    return;
  }

  if (["=", "!=", ">", ">=", "<", "<="].includes(filter.op)) {
    const value = values[0];
    if (value !== undefined) {
      appendPropertyFilter((query.propertyFilters ??= []), {
        name: propertyName,
        op: filter.op as AppDatabaseIndexedMetadataPropertyFilter["op"],
        value,
      });
    }
  }
}

function lowerSort(sort: SortColumn): AppDatabaseIndexedMetadataSort | null {
  if (sort.property === "file.path") {
    return {
      field: { kind: "file", field: "path" },
      direction: sort.direction,
    };
  }
  if (sort.property === "file.ext") {
    return {
      field: { kind: "file", field: "extension" },
      direction: sort.direction,
    };
  }
  if (sort.property === "file.mtime") {
    return {
      field: { kind: "file", field: "mtime" },
      direction: sort.direction,
    };
  }
  if (sort.property === "file.size") {
    return {
      field: { kind: "file", field: "size" },
      direction: sort.direction,
    };
  }

  const propertyName = normalizePropertyName(sort.property);
  if (!propertyName) {
    return null;
  }

  return {
    field: { kind: "property", name: propertyName },
    direction: sort.direction,
  };
}

export function buildBasesAppDatabaseQuery(
  input: BuildBasesAppDatabaseQueryInput,
): AppDatabaseIndexedMetadataQuery {
  const query: AppDatabaseIndexedMetadataQuery = {
    excludeHiddenPaths: true,
  };

  for (const filter of collectConjunctiveFilterLines(input.documentFilter)) {
    lowerFilterLine(query, filter);
  }
  for (const filter of collectConjunctiveFilterLines(input.viewFilter)) {
    lowerFilterLine(query, filter);
  }

  const loweredSorts = input.sort
    .map(lowerSort)
    .filter((sort) => sort !== null);
  if (loweredSorts.length > 0 && loweredSorts.length === input.sort.length) {
    query.sort = loweredSorts;
    if (input.limit && input.limit > 0) {
      query.limit = input.limit;
    }
  }

  return query;
}

/**
 * Read database candidates in bounded pages. When no pushed-down limit is
 * available, final PEaQL sorting remains authoritative and candidates page by
 * path so the cursor is stable across every provider.
 */
export async function queryBasesAppDatabaseRows(
  database: Pick<AppDatabase, "queryIndexedMetadataPage">,
  query: AppDatabaseIndexedMetadataQuery,
  pageSize = 500,
): Promise<AppDatabaseIndexedMetadataRow[]> {
  if (query.limit && query.limit > 0) {
    return (
      await database.queryIndexedMetadataPage({
        query,
        limit: query.limit,
      })
    ).rows;
  }

  const rows: AppDatabaseIndexedMetadataRow[] = [];
  const pagedQuery = { ...query, sort: undefined, limit: undefined };
  let after: string | undefined;
  do {
    const page = await database.queryIndexedMetadataPage({
      query: pagedQuery,
      after,
      limit: pageSize,
    });
    rows.push(...page.rows);
    after = page.nextCursor;
  } while (after);
  return rows;
}

export function appDatabaseRowToVaultRecord(
  app: QuerySourceApp,
  row: AppDatabaseIndexedMetadataRow,
): QuerySourceVaultRecord {
  const cache = clone((row.metadata?.metadata ?? {}) as CachedMetadata) ?? {};
  const frontmatter = { ...(cache.frontmatter ?? {}) };
  for (const property of row.properties) {
    if (!(property.name in frontmatter)) {
      frontmatter[property.name] = property.value;
    }
  }
  cache.frontmatter = frontmatter;

  if ((cache.tags?.length ?? 0) === 0 && row.tags.length > 0) {
    cache.tags = row.tags.map((tag) => ({ tag: tag.tag }) as never);
  }
  if ((cache.links?.length ?? 0) === 0) {
    cache.links = row.links
      .filter((link) => link.type === "link")
      .map(
        (link) =>
          ({ link: link.resolvedTargetPath ?? link.targetText }) as never,
      );
  }
  if ((cache.embeds?.length ?? 0) === 0) {
    cache.embeds = row.links
      .filter((link) => link.type === "embed")
      .map(
        (link) =>
          ({ link: link.resolvedTargetPath ?? link.targetText }) as never,
      );
  }

  return {
    id: row.file.path,
    checksum: row.file.hash,
    file:
      app.vault.getFileByPath(row.file.path) ?? createSyntheticVaultFile(row),
    cache,
  };
}

export function appDatabaseRowsToVaultRecords(
  app: QuerySourceApp,
  rows: AppDatabaseIndexedMetadataRow[],
): QuerySourceVaultRecord[] {
  return rows.map((row) => appDatabaseRowToVaultRecord(app, row));
}
