import {
  BasesViewConfig as SharedBasesViewConfig,
  Component,
  TFile,
  type App,
  type BasesAllOptions,
} from "@lapis-notes/api";
import { DateTime, Duration } from "luxon";
import {
  Context,
  Decimal,
  parseDateTime,
  parseDuration,
  type DType,
} from "peaql";
import { type BasesDocument, type BasesViewBase } from "./models";
import { BasesTable, VaultFile } from "./db";
import {
  columnsFor,
  frontMatterTypesForColumns,
  type ColumnDefinition,
} from "./columns";
import { generateQuery } from "./filter-parser";
import type { VaultRecord } from ".";
import { isEqual } from "lodash-es";
import { groupEntries } from "./query-result-core";
import { filterEntriesBySearch } from "./search-core";
import {
  collectMetadataDependencies,
} from "./metadata-invalidation-core";
import {
  appDatabaseRowsToVaultRecords,
  buildBasesAppDatabaseQuery,
  queryBasesAppDatabaseRows,
} from "./app-database-query-source";
import { mount, unmount } from "svelte";

export { BasesViewConfig } from "@lapis-notes/api";

/**
 * The three valid "sources" of a property in a Base.
 *
 * - `note`: Properties from the frontmatter of markdown files in the vault.
 * - `formula`: Properties calculated by evaluating a formula from the base config
 *   file.
 * - `file`: Properties inherent to a file, such as the name, extension, size,
 *   etc.
 *
 * @since 1.10.0
 * @public
 */
export type BasesPropertyType = "note" | "formula" | "file";

/**
 * The full ID of a property, used in the bases config file. The prefixed
 * {@link BasesPropertyType} disambiguates properties of the same name but from
 * different sources.
 *
 * @since 1.10.0
 * @public
 */
export type BasesPropertyId = string | `${BasesPropertyType}.${string}`;

/**
 * A parsed version of the {@link BasesPropertyId}.
 *
 * @since 1.10.0
 * @public
 */
export interface BasesProperty {
  /**
   * @since 1.10.0
   * @public
   */
  type: BasesPropertyType;
  /**
   * @since 1.10.0
   * @public
   */
  name: string;
}

/**
 * @since 1.10.0
 * @public
 */
export interface BaseOption {
  /**
   * @since 1.10.0
   * @public
   */
  key: string;
  /**
   * @since 1.10.0
   * @public
   */
  type: string;
  /**
   * @since 1.10.0
   * @public
   */
  displayName: string;
}

/**
 * @since 1.10.0
 * @public
 */
export type BasesSortConfig = {
  /**
   * @since 1.10.0
   * @public
   */
  property: BasesPropertyId;
  /**
   * @since 1.10.0
   * @public
   */
  direction: "ASC" | "DESC";
};

/**
 * The context in which a formula is evaluated. In most cases, {@link BasesEntry}
 * is the specific type to use.
 *
 * @since 1.10.0
 * @public
 */
export interface FormulaContext {}

/**
 * Represent a single "row" or file in a base.
 *
 * @since 1.10.0
 * @public
 */
export class BasesEntry implements FormulaContext {
  constructor(
    readonly id: string,
    readonly file: TFile,
    readonly context: Partial<Record<BasesPropertyId, Value>> = {},
  ) {}

  /**
   * Get the value of the property.
   *
   * @since 1.10.0
   * @throws Error if the property is a formula and cannot be evaluated.
   * @public
   */
  getValue(propertyId: BasesPropertyId): Value | null {
    if (
      propertyId.startsWith("file.") ||
      propertyId.startsWith("note.") ||
      propertyId.startsWith("formula.")
    ) {
      return this.context[propertyId] ?? null;
    }
    return (
      this.context[`note.${propertyId}`] ?? this.context[propertyId] ?? null
    );
  }
}

/**
 * Container type for data which can expose functions for retrieving, comparing,
 * and rendering the data. Most commonly used in conjunction with formulas for
 * Bases. Values can be used as formula parameters, intermediate values, and the
 * result of evaluation.
 *
 * @since 1.10.0
 * @public
 */
export abstract class Value {
  abstract get value(): any;
  /**
   * @since 1.10.0
   * @public
   */
  static equals(a: Value | null, b: Value | null): boolean {
    if (!a || !b) return a === b;
    return a.equals(b);
  }

  /**
   * @since 1.10.0
   * @public
   */
  static looseEquals(a: Value | null, b: Value | null): boolean {
    if (!a || !b) return a == b;
    return a.looseEquals(b);
  }

  /**
   * @since 1.10.0
   * @public
   */
  abstract toString(): string;
  /**
   * @since 1.10.0
   * @public
   */
  abstract isTruthy(): boolean;
  /**
   * @since 1.10.0
   * @public
   */
  equals(other: this): boolean {
    if (!(other instanceof Value)) return false;
    return this === other;
  }

  /**
   * @since 1.10.0
   * @public
   */
  looseEquals(other: Value): boolean {
    if (!(other instanceof Value)) return false;
    return this == other;
  }

  /**
   * Render this value into the provided HTMLElement.
   *
   * @since 1.10.0
   * @public
   */
  renderTo(el: HTMLElement, ctx: any): void {}
}
/**
 * Base type for all non-null {@link Values}.
 *
 * @since 1.10.0
 * @public
 */
export abstract class NotNullValue extends Value {}

/**
 * {@link Value} which represents null. NullValue is a singleton and
 * `NullValue.value` should be used instead of calling the constructor.
 *
 * @since 1.10.0
 * @public
 */
export class NullValue extends Value {
  /**
   * @since 1.10.0
   * @public
   */
  static value: NullValue = new NullValue();

  get value() {
    return null;
  }

  /**
   * @since 1.10.0
   * @public
   */
  toString(): string {
    return "";
  }

  isTruthy(): boolean {
    return false;
  }

  equals(other: this): boolean {
    return other === null || other === undefined;
  }

  looseEquals(other: Value): boolean {
    return other == null || other == undefined;
  }
}

/**
 * Base type for {@link Values} which wrap a single primitive.
 *
 * @since 1.10.0
 * @public
 */
export abstract class PrimitiveValue<T> extends NotNullValue {
  /**
   * @since 1.10.0
   * @public
   */
  constructor(readonly value: T) {
    super();
  }

  /**
   * @since 1.10.0
   * @public
   */
  toString(): string {
    return (this.value as any)?.toString();
  }

  /**
   * @since 1.10.0
   * @public
   */
  isTruthy(): boolean {
    return this.value ? true : false;
  }

  equals(other: this): boolean {
    if (!(other instanceof PrimitiveValue)) return false;
    return this.value === other.value;
  }

  looseEquals(other: Value): boolean {
    if (!(other instanceof PrimitiveValue)) return false;
    return this.value == other.value;
  }
}

/**
 * {@link Value} wrapping a boolean.
 *
 * @since 1.10.0
 * @public
 */
export class BooleanValue extends PrimitiveValue<boolean> {
  /**
   * @since 1.10.0
   * @public
   */
  static type: string = "boolean";

  looseEquals(other: Value): boolean {
    if (other instanceof BooleanValue) {
      return this.value === other.value;
    } else if (other instanceof PrimitiveValue) {
      if (typeof other.value === "number") {
        return other.value > 0;
      } else if (typeof other.value === "string") {
        return other.value.toLowerCase() === this.toString();
      }
    }
    return false;
  }
}

/**
 * {@link Value} wrapping a number.
 *
 * @since 1.10.0
 * @public
 */
export class NumberValue extends PrimitiveValue<number | Decimal> {
  /**
   * @since 1.10.0
   * @public
   */
  static type: string = "number";

  equals(other: this): boolean {
    return this.number === other.number;
  }

  looseEquals(other: Value): boolean {
    if (other instanceof NumberValue) {
      return this.number === other.number;
    }
    return false;
  }

  toString(): string {
    return this.number.toString();
  }

  get number(): number {
    if (typeof this.value === "number") {
      return this.value;
    }
    return this.value.number;
  }
}

/**
 * {@link Value} wrapping a string.
 *
 * @since 1.10.0
 * @public
 */
export class StringValue extends PrimitiveValue<string> {
  /**
   * @since 1.10.0
   * @public
   */
  static type: string = "string";
}

export class DateValue extends NotNullValue {
  readonly value!: DateTime;

  constructor(value: DateTime | Date | number | string) {
    super();
    if (value instanceof DateTime) {
      this.value = value;
    } else if (value instanceof Date) {
      this.value = DateTime.fromJSDate(value);
    } else if (typeof value === "number") {
      this.value = DateTime.fromMillis(value);
    } else {
      this.value = parseDateTime(value);
    }
  }

  /**
   * @since 1.10.0
   * @public
   */
  toString(): string {
    return this.value.toISO()?.substring(0, 16) ?? "";
  }

  /**
   * @since 1.10.0
   * @returns A new DateValue with any time portion in this DateValue removed.
   * @public
   */
  dateOnly(): DateValue {
    return new DateValue(this.value.startOf("day"));
  }

  /**
   * @since 1.10.0
   * @returns A new {@link RelativeDateValue} based on this DateValue.
   * @public
   */
  relative(): string {
    return this.value.toRelative() ?? "";
  }
  /**
   * @since 1.10.0
   * @public
   */
  isTruthy(): boolean {
    return this.value.isValid;
  }

  equals(other: this): boolean {
    if (!(other instanceof DateValue)) return false;
    return this.value.toMillis() === other.value.toMillis();
  }

  looseEquals(other: Value): boolean {
    if (other instanceof DateValue) {
      return this.value.toMillis() === other.value.toMillis();
    } else if (other instanceof NumberValue) {
      return this.value.toMillis() === other.number;
    }
    return false;
  }

  /**
   * Create new DateValue from an input string.
   *
   * @since 1.10.0
   * @example
   *   parseFromString("2025-12-31");
   *   parseFromString("2025-12-31T23:59");
   *   parseFromString("2025-12-31T23:59:59");
   *   parseFromString("2025-12-31T23:59:59Z-07");
   *
   * @param input - An ISO 8601 date or datetime string.
   * @public
   */
  static parseFromString(input: string): DateValue | null {
    try {
      return new DateValue(parseDateTime(input));
    } catch (e) {
      return null;
    }
  }
}

export class DurationValue extends NotNullValue {
  constructor(readonly value: Duration) {
    super();
  }

  /**
   * @since 1.10.0
   * @public
   */
  toString(): string {
    return this.value.toString()!;
  }
  /**
   * @since 1.10.0
   * @public
   */
  isTruthy(): boolean {
    return this.value.isValid;
  }

  /**
   * Modifies the provided {@DateValue} by this duration.
   *
   * @since 1.10.0
   * @public
   */
  addToDate(value: DateValue, subtract?: boolean): DateValue {
    return new DateValue(
      subtract ? value.value.minus(this.value) : value.value.plus(this.value),
    );
  }

  /**
   * Convert this duration into milliseconds.
   *
   * @since 1.10.0
   * @public
   */
  getMilliseconds(): number {
    return this.value.toMillis();
  }

  equals(other: this): boolean {
    if (!(other instanceof DurationValue)) return false;
    return this.getMilliseconds() === other.getMilliseconds();
  }

  looseEquals(other: Value): boolean {
    if (other instanceof DurationValue) {
      return this.getMilliseconds() === other.getMilliseconds();
    } else if (other instanceof NumberValue) {
      return this.getMilliseconds() === other.number;
    }
    return false;
  }

  /**
   * Create a new DurationValue using an ISO 8601 duration. See
   * {@link https://en.wikipedia.org/wiki/ISO_8601#Durations} for duration format
   * details.
   *
   * @since 1.10.0
   * @public
   */
  static parseFromString(input: string): DurationValue | null {
    try {
      return new DurationValue(parseDuration(input));
    } catch (_) {}
    return null;
  }
  /**
   * Create a new DurationValue from milliseconds.
   *
   * @since 1.10.0
   * @public
   */
  static fromMilliseconds(milliseconds: number): DurationValue {
    return new DurationValue(Duration.fromMillis(milliseconds));
  }
}

export class FileValue extends NotNullValue {
  constructor(readonly file: TFile) {
    super();
  }

  get value() {
    return this.file;
  }

  /**
   * @since 1.10.0
   * @public
   */
  toString(): string {
    return this.file.path;
  }
  /**
   * @since 1.10.0
   * @public
   */
  isTruthy(): boolean {
    return true;
  }

  equals(other: this): boolean {
    if (!(other instanceof FileValue)) return false;
    return this.file.path === other.file.path;
  }

  looseEquals(other: Value): boolean {
    if (other instanceof FileValue) {
      return other.file.path === this.file.path;
    } else if (other instanceof PrimitiveValue) {
      return this.file.path === other.value;
    }
    return false;
  }
}

export class ObjectValue extends NotNullValue {
  constructor(readonly value: any) {
    super();
  }

  equals(other: this): boolean {
    if (!(other instanceof ObjectValue)) return false;
    return isEqual(this, other);
  }

  looseEquals(other: Value): boolean {
    return isEqual(this, other);
  }

  toString(): string {
    return this.value.toString();
  }

  isTruthy(): boolean {
    return true;
  }
}

/**
 * @since 1.10.0
 * @public
 */
export interface BaseOption {
  /**
   * @since 1.10.0
   * @public
   */
  key: string;
  /**
   * @since 1.10.0
   * @public
   */
  type: string;
  /**
   * @since 1.10.0
   * @public
   */
  displayName: string;
}

function unknownView(type?: string) {
  return {
    name: "Unknown",
    type: type ?? "unknown",
    filter: { and: [] },
    order: [],
    sort: [],
    limit: 0,
  };
}

function toEntry(value: any, type: DType): Value {
  if (value instanceof Value) {
    return value;
  }
  if (value === null || value === undefined) {
    return NullValue.value;
  } else if (type === String) {
    return new StringValue(value);
  } else if (type === Number || type == Decimal || typeof value === "number") {
    return new NumberValue(value);
  } else if (type === DateTime || type === Date) {
    return new DateValue(value);
  } else if (type === Boolean) {
    return new BooleanValue(value);
  } else if (type === Duration) {
    return new DurationValue(value);
  } else if (type === TFile || type == VaultFile) {
    return new FileValue(value);
  }

  return new ObjectValue(value);
}

function convertEntries(
  dataset: [Array<Record<string, unknown>>, Record<string, DType>],
): BasesEntry[] {
  const entries: Array<BasesEntry> = [];
  const [rows, types] = dataset;

  for (const row of rows) {
    const record = row["$rowId"] as VaultRecord;
    if (!record) continue;
    const context: Partial<Record<BasesPropertyId, Value>> = {};
    for (const key of Object.keys(row)) {
      if (key === "$rowId") continue;
      const id = key as BasesPropertyId;
      context[id] = toEntry(row[id], types[id]);
    }
    entries.push(new BasesEntry(record.id, record.file, context));
  }
  return entries;
}

export class QueryController extends Component {
  readonly app!: App;
  data: Array<VaultRecord> = $state([]);
  loadError: string | null = $state(null);

  doc: BasesDocument = $state()!;
  properties: Record<string, { displayName: string }> = $state({});
  formulas: Record<string, string> = $state({});
  searchQuery: string = $state("");
  searchPanelOpen: boolean = $state(false);

  columns = $derived(
    columnsFor(this.data, this.properties, this.formulas, this.app),
  );
  frontMatterTypes = $derived(frontMatterTypesForColumns(this.columns));
  db = $derived(
    Context.create(
      new BasesTable("bases")
        .withApp(this.app)
        .withPropertyColumns(this.frontMatterTypes)
        .data(() => this.data),
    ).withDefaultTable("bases"),
  );
  selectedView: BasesViewBase = $state()!;
  #view: BasesView = $state()!;
  private prevDoc: string = "";
  private lastViewResults = new WeakMap<BasesView, BasesQueryResult>();

  query = $derived(
    generateQuery(this.selectedView!, this.formulas, this.doc.filters),
  );
  metadataDependencies = $derived.by(() => {
    return collectMetadataDependencies({
      documentFilter: this.doc.filters,
      viewFilter: this.selectedView?.filter,
      order: (this.selectedView?.order ?? []) as BasesPropertyId[],
      sort: this.selectedView?.sort ?? [],
      groupByProperty: this.selectedView?.groupBy?.property ?? null,
      imageProperty:
        typeof this.selectedView?.image === "string"
          ? (this.selectedView.image as BasesPropertyId)
          : null,
      formulas: this.formulas,
    });
  });
  reloadSignature = $derived.by(() => {
    return JSON.stringify({
      documentFilter: $state.snapshot(this.doc.filters),
      viewFilter: $state.snapshot(this.selectedView?.filter),
      sort: $state.snapshot(this.selectedView?.sort ?? []),
      limit: this.selectedView?.limit ?? 0,
    });
  });
  dataset: [Array<Record<string, unknown>>, Record<string, DType>] = $state([
    [],
    {},
  ]);
  queryResult: BasesQueryResult = $derived.by(() => {
    const visibleProperties = (this.selectedView?.order ??
      []) as BasesPropertyId[];
    const entries = filterEntriesBySearch(
      convertEntries(this.dataset),
      visibleProperties,
      this.searchQuery,
    );
    return new BasesQueryResult(
      entries,
      this.getAllColumns().map((it) => it.id),
      this.selectedView?.groupBy?.property as BasesPropertyId | undefined,
    );
  });

  constructor(
    app: App,
    document: BasesDocument,
    readonly views: Map<string, BasesViewRegistration>,
    onChange: (doc: BasesDocument) => void,
    readonly readOnly = false,
  ) {
    super();
    this.app = app;
    this.doc = document;
    this.properties = this.doc.properties || {};
    this.formulas = this.doc.formulas || {};
    this.selectedView =
      this.doc.views.find((it) => it.name === this.doc.activeView) ||
      this.doc.views[0] ||
      unknownView();
    this.prevDoc = JSON.stringify(document);

    $effect(() => {
      if (!this.selectedView) return;
      this.doc.activeView = this.selectedView.name;
    });

    $effect(() => {
      const props: BasesDocument = {
        ...$state.snapshot(this.doc),
        properties: $state.snapshot(this.properties),
        formulas: $state.snapshot(this.formulas),
      } as BasesDocument;
      const content = JSON.stringify(props);
      if (content !== this.prevDoc) {
        onChange(props);
        this.prevDoc = content;
      }
    });

    $effect(() => {
      if (!this.#view) return;
      this.syncViewData(this.#view, this.queryResult);
    });

    $effect(() => {
      this.reloadSignature;
      void this.reload();
    });

    $effect(() => {
      this.dataset = this.getRecords(this.query);
    });

    this.registerEvent(
      this.app.metadataCache.on("index-changed", (change) => {
        if (change.reset || change.domains.includes("metadata")) void this.reload();
      }),
    );
    this.registerEvent(
      this.app.metadataCache.on("loaded", () => {
        void this.reload();
      }),
    );
  }

  get view() {
    return this.#view;
  }

  set view(view: BasesView) {
    this.#view = view;
  }

  private syncViewData(view: BasesView, result: BasesQueryResult): void {
    if (this.lastViewResults.get(view) === result) {
      return;
    }

    this.lastViewResults.set(view, result);
    view.data = result;
    view.onDataUpdated();
  }

  get viewConfig(): BasesViewRegistration {
    return this.views.get(this.selectedView.type) ?? this.views.get("unknown")!;
  }

  getRecords(
    qs: string,
  ): [Array<Record<string, unknown>>, Record<string, DType>] {
    const types: Record<string, DType> = {};
    try {
      const [columns, data]: [{ name: symbol; type: DType }[], unknown[][]] =
        this.db.execute(qs);
      columns.forEach((col) => {
        types[col.name.description!] = col.type;
      });
      const dataset = data.map((row: Array<unknown>) => {
        return columns.reduce<Record<string, unknown>>((acc, value, i) => {
          acc[value.name.description!] = row[i];
          return acc;
        }, {});
      }) as Array<Record<string, unknown>>;
      return [dataset, types];
    } catch (e) {
      console.error("Error executing query", e);
      return [[], types];
    }
  }

  getAllColumns() {
    return Object.values(this.columns);
  }

  isVisible(id: BasesPropertyId) {
    return this.selectedView && this.selectedView.order.includes(id);
  }

  toggleVisibility(id: BasesPropertyId) {
    if (this.selectedView) {
      const index = this.selectedView.order.findIndex((it) => it === id);
      if (index === -1) {
        this.selectedView.order.push(id);
        return;
      }
      this.selectedView.order.splice(index, 1);
    }
  }

  getColumn(id: BasesPropertyId) {
    return this.columns[id];
  }

  get count() {
    return this.dataset[0].length;
  }

  get searchCount() {
    return this.queryResult.data.length;
  }

  toggleSearchPanel() {
    this.searchPanelOpen = !this.searchPanelOpen;
  }

  async reload() {
    const generation =
      ((this as QueryController & { _reloadGeneration?: number })
        ._reloadGeneration ?? 0) + 1;
    (
      this as QueryController & { _reloadGeneration?: number }
    )._reloadGeneration = generation;

    try {
      const rows = await queryBasesAppDatabaseRows(
        this.app.appDatabase,
        buildBasesAppDatabaseQuery({
          documentFilter: this.doc.filters,
          viewFilter: this.selectedView?.filter,
          sort: this.selectedView?.sort ?? [],
          limit: this.selectedView?.limit ?? 0,
        }),
      );
      if (
        (this as QueryController & { _reloadGeneration?: number })
          ._reloadGeneration !== generation
      ) {
        return;
      }
      const records = appDatabaseRowsToVaultRecords(this.app, rows);
      if (this.metadataDependencies.backlinks && records.length) {
        const backlinks = new Map<string, Set<string>>();
        for (let offset = 0; offset < records.length; offset += 400) {
          const links = await this.app.metadataCache.queryLinks({
            direction: "incoming",
            paths: records.slice(offset, offset + 400).map((record) => record.id),
            resolution: "resolved",
            limit: 100_000,
          });
          for (const link of links) {
            if (!link.resolvedTargetPath) continue;
            const sources = backlinks.get(link.resolvedTargetPath) ?? new Set<string>();
            sources.add(link.sourcePath);
            backlinks.set(link.resolvedTargetPath, sources);
          }
        }
        for (const record of records) {
          record.backlinks = [...(backlinks.get(record.id) ?? [])];
        }
      }
      this.loadError = null;
      this.data = records;
    } catch (error) {
      console.error("Error loading Bases rows from AppDatabase", error);
      if (
        (this as QueryController & { _reloadGeneration?: number })
          ._reloadGeneration !== generation
      ) {
        return;
      }
      this.loadError = error instanceof Error ? error.message : String(error);
      this.data = [];
    }
  }
}

export abstract class BasesView extends Component {
  private mountedView: ReturnType<typeof mount> | null = null;
  private mountedViewContainer: HTMLElement | null = null;

  /**
   * @since 1.10.0
   * @public
   */
  app!: App;

  /**
   * The type ID of this view
   *
   * @since 1.10.0
   * @public
   */
  abstract type: string;

  /**
   * The config object for this view.
   *
   * @since 1.10.0
   * @public
   */
  config: SharedBasesViewConfig = $state(
    new SharedBasesViewConfig(
      {
        type: "unknown",
        sort: [],
        order: [],
        limit: 0,
        name: "Unknown",
        filter: { and: [] },
      },
      {},
    ),
  );

  /**
   * The most recent output from executing the bases query, applying filters,
   * and evaluating formulas. This object will be replaced with a new result set
   * when changes to the vault or Bases config occur, so views should not keep a
   * reference to it. Also note the contained BasesEntry objects will be
   * recreated.
   *
   * @since 1.10.0
   * @public
   */

  data: BasesQueryResult = $state(new BasesQueryResult([], []));

  protected constructor(readonly controller: QueryController) {
    super();
  }

  protected mountViewComponent(
    component: any,
    props: Record<string, unknown>,
    containerEl: HTMLElement,
  ): void {
    this.unmountViewComponent();
    containerEl.replaceChildren();
    const target = containerEl.createDiv("bases-view__renderer");
    this.mountedViewContainer = target;
    this.mountedView = mount(component, {
      props,
      target,
    });
  }

  protected unmountViewComponent(): void {
    if (this.mountedView) {
      unmount(this.mountedView);
      this.mountedView = null;
    }

    this.mountedViewContainer?.remove();
    this.mountedViewContainer = null;
  }

  onunload(): void {
    this.unmountViewComponent();
  }

  /**
   * All available properties from the dataset.
   *
   * @since 1.10.0
   * @public
   */
  get allProperties(): BasesPropertyId[] {
    if (!this.data) return [];
    return this.data.properties;
  }

  async createFileForView(
    baseFileName?: string,
    frontmatterProcessor?: (frontmatter: any) => void,
  ): Promise<void> {
    const fileName = (baseFileName?.trim() || "Untitled").replace(/\.md$/i, "");
    const path = this.app.fileManager.getAvailablePathForAttachment(
      `${fileName}.md`,
      "",
    );
    const file = await this.app.vault.create(path, "");
    if (frontmatterProcessor) {
      await this.app.fileManager.processFrontMatter(file, frontmatterProcessor);
    }
    await this.app.openFile(file);
  }

  /**
   * Called when there is new data for the query. This view should rerender with
   * the updated data.
   *
   * @since 1.10.0
   * @public
   */
  abstract onDataUpdated(): void;
}

/**
 * Implement this factory function in a {@link BasesViewRegistration} to create a
 * new instance of a custom Bases view.
 *
 * @since 1.10.0
 * @param containerEl - The container below the Bases toolbar where the view
 *   will be displayed.
 * @public
 */
export type BasesViewFactory = (
  controller: QueryController,
  containerEl: HTMLElement,
) => BasesView;

/**
 * Container for options when registering a new Bases view type.
 *
 * @since 1.10.0
 * @public
 */
export interface BasesViewRegistration {
  /**
   * @since 1.10.0
   * @public
   */
  name: string;
  /**
   * Icon ID to be used in the Bases view selector. See
   * {@link https://docs.obsidian.md/Plugins/User+interface/Icons} for available
   * icons and how to add your own.
   *
   * @since 1.10.0
   * @public
   */
  icon: string;
  /**
   * @since 1.10.0
   * @public
   */
  factory: BasesViewFactory;
  /**
   * @since 1.10.0
   * @public
   */
  options?: (config: SharedBasesViewConfig) => BasesAllOptions[];
}

/**
 * A group of BasesEntry objects for a given value of the groupBy key. If there
 * are entries in the results which do not have a value for the groupBy key, the
 * key will be the {@link NullValue}.
 *
 * @since 1.10.0
 * @public
 */
export class BasesEntryGroup {
  constructor(
    readonly entries: BasesEntry[],
    readonly key?: Value,
  ) {}

  /**
   * @since 1.10.0
   * @returns True iff this entry group has a non-null key.
   * @public
   */
  hasKey(): boolean {
    if (this.key === null || this.key === undefined) {
      return false;
    }
    return this.key.isTruthy();
  }
}

/**
 * The BasesQueryResult contains all of the available information from executing
 * the bases query, applying filters, and evaluating formulas. The `data` or
 * `groupedData` should be displayed by your view.
 *
 * @since 1.10.0
 * @public
 */
export class BasesQueryResult {
  constructor(
    readonly data: BasesEntry[],
    readonly properties: BasesPropertyId[],
    readonly groupBy?: BasesPropertyId,
  ) {}

  get groupedData(): BasesEntryGroup[] {
    return groupEntries<BasesPropertyId, Value, BasesEntry>(
      this.data,
      this.groupBy,
      (left, right) => Value.looseEquals(left, right),
    ).map(
      (group) => new BasesEntryGroup(group.entries, group.key ?? undefined),
    );
  }

  getSummaryValue(
    queryController: QueryController,
    entries: BasesEntry[],
    prop: BasesPropertyId,
    summaryKey: string,
  ): Value {
    const values = entries
      .map((entry) => entry.getValue(prop))
      .filter(
        (value): value is Value => !!value && !(value instanceof NullValue),
      );
    const numbers = values
      .filter((value): value is NumberValue => value instanceof NumberValue)
      .map((value) => value.number);

    switch (summaryKey.toLowerCase()) {
      case "count":
        return new NumberValue(entries.length);
      case "count-empty":
        return new NumberValue(entries.length - values.length);
      case "count-non-empty":
      case "count-filled":
        return new NumberValue(values.length);
      case "sum":
        return numbers.length
          ? new NumberValue(numbers.reduce((total, value) => total + value, 0))
          : NullValue.value;
      case "average":
      case "avg":
        return numbers.length
          ? new NumberValue(
              numbers.reduce((total, value) => total + value, 0) /
                numbers.length,
            )
          : NullValue.value;
      case "min":
        return numbers.length
          ? new NumberValue(Math.min(...numbers))
          : NullValue.value;
      case "max":
        return numbers.length
          ? new NumberValue(Math.max(...numbers))
          : NullValue.value;
      default:
        return NullValue.value;
    }
  }
}
