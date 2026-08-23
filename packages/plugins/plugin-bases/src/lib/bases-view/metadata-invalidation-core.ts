import type { BasesPropertyId, CachedMetadata } from "@lapis-notes/api";
import {
  isFilterGroup,
  isFilterLine,
  type FilterLine,
  type Filters,
  type SortColumn,
} from "./models";

export type MetadataDependencySet = {
  custom: boolean;
  tags: boolean;
  links: boolean;
  backlinks: boolean;
  properties: Set<string>;
  propertyPresence: boolean;
  staticFileFields: Set<string>;
  dynamicFileFields: Set<string>;
};

type MetadataDependencyInput = {
  documentFilter: Filters;
  viewFilter: Filters | undefined;
  order: BasesPropertyId[];
  sort: SortColumn[];
  groupByProperty?: BasesPropertyId | null;
  imageProperty?: BasesPropertyId | null;
  formulas: Record<string, string>;
};

type MetadataInvalidationInput = {
  changedPath: string;
  currentResultPaths: string[];
  cache: CachedMetadata | null;
  prevCache: CachedMetadata | null;
  dependencies: MetadataDependencySet;
  isDirectlyAffectedByPathChange: (
    watchedPath: string,
    changedPath: string,
  ) => boolean;
};

const DYNAMIC_FILE_FIELDS = new Set(["file.mtime", "file.size"]);

export function createMetadataDependencySet(): MetadataDependencySet {
  return {
    custom: false,
    tags: false,
    links: false,
    backlinks: false,
    properties: new Set(),
    propertyPresence: false,
    staticFileFields: new Set(),
    dynamicFileFields: new Set(),
  };
}

function trackPropertyDependency(
  dependencies: MetadataDependencySet,
  propertyId: string | null | undefined,
): void {
  if (!propertyId) {
    return;
  }

  if (propertyId === "file") {
    return;
  }

  if (propertyId.startsWith("formula.")) {
    dependencies.custom = true;
    return;
  }

  if (propertyId === "file.tags") {
    dependencies.tags = true;
    return;
  }

  if (
    propertyId === "file.links" ||
    propertyId === "file.embeds"
  ) {
    dependencies.links = true;
    return;
  }
  if (propertyId === "file.backlinks") {
    dependencies.links = true;
    dependencies.backlinks = true;
    return;
  }

  if (propertyId === "file.properties") {
    dependencies.propertyPresence = true;
    return;
  }

  if (propertyId.startsWith("file.")) {
    if (DYNAMIC_FILE_FIELDS.has(propertyId)) {
      dependencies.dynamicFileFields.add(propertyId);
    } else {
      dependencies.staticFileFields.add(propertyId);
    }
    return;
  }

  const normalized = propertyId.startsWith("note.")
    ? propertyId.slice("note.".length)
    : propertyId;
  if (normalized.length > 0) {
    dependencies.properties.add(normalized);
  }
}

function trackFilterLineDependencies(
  dependencies: MetadataDependencySet,
  filter: FilterLine,
): void {
  if (filter.custom || filter.column.startsWith("formula.")) {
    dependencies.custom = true;
    return;
  }

  trackPropertyDependency(dependencies, filter.column);

  if (filter.op === "hasTag" || filter.op === "!hasTag") {
    dependencies.tags = true;
  }

  if (filter.op === "hasLink" || filter.op === "!hasLink") {
    dependencies.links = true;
  }

  if (filter.op === "hasProperty" || filter.op === "!hasProperty") {
    dependencies.propertyPresence = true;
    const values = Array.isArray(filter.value) ? filter.value : [filter.value];
    for (const value of values) {
      if (typeof value === "string" && value.trim().length > 0) {
        dependencies.properties.add(value.trim());
      }
    }
  }

  if (filter.op === "inFolder" || filter.op === "!inFolder") {
    dependencies.staticFileFields.add("file.folder");
  }
}

function collectFilterDependencies(
  dependencies: MetadataDependencySet,
  filter: Filters | FilterLine | string | null | undefined,
): void {
  if (!filter) {
    return;
  }

  if (typeof filter === "string") {
    if (filter.trim().length > 0) {
      dependencies.custom = true;
    }
    return;
  }

  if (isFilterLine(filter)) {
    trackFilterLineDependencies(dependencies, filter);
    return;
  }

  if (isFilterGroup(filter)) {
    const values =
      "and" in filter ? filter.and : "or" in filter ? filter.or : filter.not;
    for (const entry of values) {
      collectFilterDependencies(dependencies, entry);
    }
  }
}

export function collectMetadataDependencies(
  input: MetadataDependencyInput,
): MetadataDependencySet {
  const dependencies = createMetadataDependencySet();

  collectFilterDependencies(dependencies, input.documentFilter);
  collectFilterDependencies(dependencies, input.viewFilter);

  for (const propertyId of input.order) {
    trackPropertyDependency(dependencies, propertyId);
  }
  for (const sort of input.sort) {
    trackPropertyDependency(dependencies, sort.property);
  }
  trackPropertyDependency(dependencies, input.groupByProperty ?? null);
  trackPropertyDependency(dependencies, input.imageProperty ?? null);
  if (Object.keys(input.formulas).length > 0) {
    dependencies.custom = true;
  }

  return dependencies;
}

export function cacheMatchesDependencies(
  cache: CachedMetadata | null | undefined,
  dependencies: MetadataDependencySet,
): boolean {
  if (!cache) {
    return false;
  }

  if (dependencies.tags && (cache.tags?.length ?? 0) > 0) {
    return true;
  }

  if (
    dependencies.links &&
    ((cache.links?.length ?? 0) > 0 || (cache.embeds?.length ?? 0) > 0)
  ) {
    return true;
  }

  const frontmatter = cache.frontmatter ?? {};
  if (dependencies.propertyPresence && Object.keys(frontmatter).length > 0) {
    return true;
  }

  for (const property of dependencies.properties) {
    if (property in frontmatter) {
      return true;
    }
  }

  return false;
}

export function shouldReloadForMetadataChange(
  input: MetadataInvalidationInput,
): boolean {
  if (input.currentResultPaths.includes(input.changedPath)) {
    return true;
  }

  if (input.dependencies.links) {
    for (const path of input.currentResultPaths) {
      if (input.isDirectlyAffectedByPathChange(path, input.changedPath)) {
        return true;
      }
    }
  }

  if (
    input.dependencies.custom ||
    input.dependencies.dynamicFileFields.size > 0
  ) {
    return true;
  }

  return (
    cacheMatchesDependencies(input.cache, input.dependencies) ||
    cacheMatchesDependencies(input.prevCache, input.dependencies)
  );
}
