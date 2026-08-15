import { DateTime, Duration } from "luxon";
import { mount, unmount } from "svelte";
import type { App, RenderContext } from "./context.svelte";
import { resolveApplication } from "./application-compatibility";
import { Component } from "./view.svelte";
import type { TFile, TFolder } from "./storage/fs";

export type BasesPropertyType = "note" | "formula" | "file";
export type BasesPropertyId = string | `${BasesPropertyType}.${string}`;

export interface BasesProperty {
  type: BasesPropertyType;
  name: string;
}

export type BasesSortConfig = {
  property: BasesPropertyId;
  direction: "ASC" | "DESC";
};

export interface FormulaContext {}

export abstract class Value {
  static type: string;
  abstract get value(): unknown;

  static equals(a: Value | null, b: Value | null): boolean {
    if (!a || !b) return a === b;
    return a.equals(b as never);
  }

  static looseEquals(a: Value | null, b: Value | null): boolean {
    if (!a || !b) return a === b;
    return a.looseEquals(b);
  }

  abstract toString(): string;
  abstract isTruthy(): boolean;

  equals(other: this): boolean {
    return this === other;
  }

  looseEquals(other: Value): boolean {
    return this.equals(other as this);
  }

  renderTo(el: HTMLElement, ctx: RenderContext): void {
    el.textContent = this.toString();
  }
}

export abstract class NotNullValue extends Value {
  isTruthy(): boolean {
    return true;
  }
}

export abstract class PrimitiveValue<T> extends NotNullValue {
  constructor(readonly value: T) {
    super();
  }

  toString(): string {
    return String(this.value);
  }

  isTruthy(): boolean {
    return Boolean(this.value);
  }

  equals(other: this): boolean {
    return other instanceof PrimitiveValue && this.value === other.value;
  }
}

export class NullValue extends Value {
  static value = new NullValue();

  get value(): null {
    return null;
  }

  toString(): string {
    return "";
  }

  isTruthy(): boolean {
    return false;
  }

  equals(other: this): boolean {
    return other instanceof NullValue;
  }

  looseEquals(other: Value): boolean {
    return other instanceof NullValue;
  }
}

export class BooleanValue extends PrimitiveValue<boolean> {
  static type = "boolean";
}

export class NumberValue extends PrimitiveValue<number> {
  static type = "number";
}

export class StringValue extends PrimitiveValue<string> {
  static type = "text";
}

export class DateValue extends PrimitiveValue<DateTime> {
  static type = "date";

  constructor(value: DateTime | Date | number | string) {
    super(
      value instanceof DateTime
        ? value
        : value instanceof Date
          ? DateTime.fromJSDate(value)
          : typeof value === "number"
            ? DateTime.fromMillis(value)
            : DateTime.fromISO(value),
    );
  }

  toString(): string {
    return this.value.toISO()?.substring(0, 16) ?? "";
  }

  isTruthy(): boolean {
    return this.value.isValid;
  }

  equals(other: this): boolean {
    return (
      other instanceof DateValue &&
      this.value.toMillis() === other.value.toMillis()
    );
  }

  looseEquals(other: Value): boolean {
    if (other instanceof DateValue) {
      return this.value.toMillis() === other.value.toMillis();
    }
    if (other instanceof NumberValue) {
      return this.value.toMillis() === other.value;
    }
    return false;
  }

  dateOnly(): DateValue {
    return new DateValue(this.value.startOf("day"));
  }

  relative(): string {
    return this.value.toRelative() ?? "";
  }

  static parseFromString(input: string): DateValue | null {
    const value = DateTime.fromISO(input);
    return value.isValid ? new DateValue(value) : null;
  }
}

export class DurationValue extends PrimitiveValue<Duration> {
  static type = "duration";

  constructor(value: Duration | string | number) {
    super(
      value instanceof Duration
        ? value
        : typeof value === "number"
          ? Duration.fromMillis(value)
          : Duration.fromISO(value),
    );
  }

  toString(): string {
    return this.value.toString() ?? "";
  }

  isTruthy(): boolean {
    return this.value.isValid;
  }

  equals(other: this): boolean {
    return (
      other instanceof DurationValue &&
      this.getMilliseconds() === other.getMilliseconds()
    );
  }

  looseEquals(other: Value): boolean {
    if (other instanceof DurationValue) {
      return this.getMilliseconds() === other.getMilliseconds();
    }
    if (other instanceof NumberValue) {
      return this.getMilliseconds() === other.value;
    }
    return false;
  }

  addToDate(value: DateValue, subtract?: boolean): DateValue {
    return new DateValue(
      subtract ? value.value.minus(this.value) : value.value.plus(this.value),
    );
  }

  getMilliseconds(): number {
    return this.value.toMillis();
  }

  static parseFromString(input: string): DurationValue | null {
    const value = Duration.fromISO(input);
    return value.isValid ? new DurationValue(value) : null;
  }

  static fromMilliseconds(milliseconds: number): DurationValue {
    return new DurationValue(Duration.fromMillis(milliseconds));
  }
}

export class FileValue extends NotNullValue {
  static type = "file";

  constructor(readonly value: TFile) {
    super();
  }

  toString(): string {
    return this.value.path;
  }

  equals(other: this): boolean {
    return other instanceof FileValue && this.value.path === other.value.path;
  }

  looseEquals(other: Value): boolean {
    if (other instanceof FileValue) {
      return this.value.path === other.value.path;
    }
    if (other instanceof PrimitiveValue) {
      return this.value.path === other.value;
    }
    return false;
  }
}

export class LinkValue extends StringValue {}
export class HTMLValue extends StringValue {}
export class IconValue extends StringValue {}
export class ImageValue extends StringValue {}
export class TagValue extends StringValue {}
export class UrlValue extends StringValue {}

export class RegExpValue extends PrimitiveValue<RegExp> {
  static type = "regexp";
}

export class RelativeDateValue extends DateValue {}

export class ListValue extends NotNullValue {
  static type = "list";
  readonly value: Value[];

  constructor(value: unknown[] = []) {
    super();
    this.value = value
      .map((item) => toValue(item))
      .filter((item): item is Value => !!item);
  }

  toString(): string {
    return this.value.map((item) => item.toString()).join(", ");
  }

  isTruthy(): boolean {
    return this.value.length > 0;
  }

  includes(value: Value): boolean {
    return this.value.some((item) => item.looseEquals(value));
  }

  length(): number {
    return this.value.length;
  }

  get(index: number): Value {
    return this.value[index] ?? NullValue.value;
  }

  concat(other: ListValue): ListValue {
    return new ListValue([...this.value, ...other.value]);
  }

  equals(other: this): boolean {
    return (
      other instanceof ListValue &&
      this.value.length === other.value.length &&
      this.value.every((item, index) => Value.equals(item, other.value[index]))
    );
  }
}

export class ObjectValue extends NotNullValue {
  static type = "object";

  constructor(readonly value: Record<string, unknown>) {
    super();
  }

  toString(): string {
    return JSON.stringify(this.value);
  }

  isTruthy(): boolean {
    return !this.isEmpty();
  }

  isEmpty(): boolean {
    return Object.keys(this.value).length === 0;
  }

  get(key: string): Value | null {
    return toValue(this.value[key]);
  }
}

export function toValue(value: unknown): Value | null {
  if (value instanceof Value) return value;
  if (value === null || value === undefined) return NullValue.value;
  if (value instanceof DateTime || value instanceof Date)
    return new DateValue(value);
  if (value instanceof Duration) return new DurationValue(value);
  if (value instanceof RegExp) return new RegExpValue(value);
  if (value instanceof FileValue) return value;
  if (typeof value === "boolean") return new BooleanValue(value);
  if (typeof value === "number") return new NumberValue(value);
  if (typeof value === "string") return new StringValue(value);
  if (Array.isArray(value))
    return new ListValue(value.map(toValue).filter(Boolean) as Value[]);
  if (typeof value === "object")
    return new ObjectValue(value as Record<string, unknown>);
  return null;
}

export class BasesEntry implements FormulaContext {
  readonly id: string;
  readonly file: TFile;
  readonly values: Record<string, Value | null>;

  constructor(file: TFile, values?: Record<string, Value | null>);
  constructor(id: string, file: TFile, values?: Record<string, Value | null>);
  constructor(
    idOrFile: string | TFile,
    fileOrValues?: TFile | Record<string, Value | null>,
    values: Record<string, Value | null> = {},
  ) {
    if (typeof idOrFile === "string") {
      this.id = idOrFile;
      this.file = fileOrValues as TFile;
      this.values = values;
    } else {
      this.id = idOrFile.path;
      this.file = idOrFile;
      this.values = (fileOrValues as Record<string, Value | null>) ?? {};
    }
  }

  getValue(propertyId: BasesPropertyId): Value | null {
    if (
      propertyId.startsWith("file.") ||
      propertyId.startsWith("note.") ||
      propertyId.startsWith("formula.")
    ) {
      return this.values[propertyId] ?? null;
    }
    return this.values[`note.${propertyId}`] ?? this.values[propertyId] ?? null;
  }
}

export class BasesEntryGroup {
  constructor(
    readonly entries: BasesEntry[] = [],
    readonly key?: Value,
  ) {}

  hasKey(): boolean {
    return !!this.key && this.key !== NullValue.value;
  }
}

export class BasesQueryResult {
  constructor(
    readonly data: BasesEntry[] = [],
    private readonly propertyIds: BasesPropertyId[] = [],
    private readonly groupBy?: BasesPropertyId | null,
  ) {}

  get groupedData(): BasesEntryGroup[] {
    if (!this.groupBy) return [new BasesEntryGroup(this.data)];

    const groups: BasesEntryGroup[] = [];
    for (const entry of this.data) {
      const key = entry.getValue(this.groupBy) ?? NullValue.value;
      let group = groups.find((candidate) =>
        Value.looseEquals(candidate.key ?? null, key),
      );
      if (!group) {
        group = new BasesEntryGroup([], key);
        groups.push(group);
      }
      group.entries.push(entry);
    }
    return groups;
  }

  get properties(): BasesPropertyId[] {
    return this.propertyIds;
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
      .map((value) => value.value);

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

export class QueryController extends Component {
  readonly app: App;

  constructor(application?: App) {
    super();
    this.app = resolveApplication(application);
  }
}

export interface BasesOption {
  key: string;
  type: string;
  displayName: string;
  shouldHide?: () => boolean;
}

export interface BasesTextOption extends BasesOption {
  type: "text";
  default?: string;
  placeholder?: string;
}

export interface BasesMultitextOption extends BasesOption {
  type: "multitext";
  default?: string[];
}

export interface BasesToggleOption extends BasesOption {
  type: "toggle";
  default?: boolean;
}

export interface BasesSliderOption extends BasesOption {
  type: "slider";
  default?: number;
  min?: number;
  max?: number;
  step?: number;
  instant?: boolean;
}

export interface BasesDropdownOption extends BasesOption {
  type: "dropdown";
  default?: string;
  options: Record<string, string>;
}

export interface BasesFileOption extends BasesOption {
  type: "file";
  default?: string;
  placeholder?: string;
  filter?: (file: TFile) => boolean;
}

export interface BasesFolderOption extends BasesOption {
  type: "folder";
  default?: string;
  placeholder?: string;
  filter?: (folder: TFolder) => boolean;
}

export interface BasesFormulaOption extends BasesOption {
  type: "formula";
  default?: string;
  placeholder?: string;
}

export interface BasesPropertyOption extends BasesOption {
  type: "property";
  default?: string;
  placeholder?: string;
  filter?: (prop: BasesPropertyId) => boolean;
}

export interface BasesOptionGroup {
  type: "group";
  displayName: string;
  items: BasesOptions[];
  shouldHide?: () => boolean;
}

export type BasesOptions =
  | BasesTextOption
  | BasesMultitextOption
  | BasesToggleOption
  | BasesSliderOption
  | BasesDropdownOption
  | BasesFileOption
  | BasesFolderOption
  | BasesFormulaOption
  | BasesPropertyOption;

export type BasesAllOptions = BasesOptions | BasesOptionGroup;

export interface BasesConfigFileView {
  type: string;
  name: string;
  filters?: BasesConfigFileFilter;
  groupBy?: {
    property: BasesPropertyId;
    direction: "ASC" | "DESC";
  };
  order?: string[];
  sort?: BasesSortConfig[];
  summaries?: Record<string, string>;
  [key: string]: unknown;
}

export type BasesConfigFileFilter =
  | string
  | { and: BasesConfigFileFilter[] }
  | { or: BasesConfigFileFilter[] }
  | { not: BasesConfigFileFilter[] };

export interface BasesConfigFile {
  views?: BasesConfigFileView[];
  properties?: Record<string, Record<string, unknown>>;
  filters?: BasesConfigFileFilter;
  formulas?: Record<string, string>;
  summaries?: Record<string, string>;
}

export class BasesViewConfig {
  constructor(
    private readonly config: BasesConfigFileView = { type: "", name: "" },
    private readonly columns: Record<string, { displayName?: string }> = {},
  ) {}

  get name(): string {
    return this.config.name;
  }

  get(key: string): unknown {
    return this.config[key];
  }

  getAsPropertyId(key: string): BasesPropertyId | null {
    const value = this.get(key);
    return typeof value === "string" ? value : null;
  }

  getEvaluatedFormula(view: BasesView, key: string): Value {
    return toValue(this.get(key)) ?? NullValue.value;
  }

  set(key: string, value: any | null): void {
    if (value === null) delete this.config[key];
    else this.config[key] = value;
  }

  getOrder(): BasesPropertyId[] {
    return (this.config.order ?? []).filter(
      (property): property is BasesPropertyId => typeof property === "string",
    );
  }

  getSort(): BasesSortConfig[] {
    return (this.config.sort ?? []).filter((sort): sort is BasesSortConfig => {
      return (
        !!sort &&
        typeof sort.property === "string" &&
        (sort.direction === "ASC" || sort.direction === "DESC")
      );
    });
  }

  getDisplayName(propertyId: BasesPropertyId): string {
    return (
      this.columns[propertyId]?.displayName ??
      parsePropertyId(propertyId).name.replaceAll(/[_-]+/g, " ")
    );
  }
}

export type BasesViewFactory = (
  controller: QueryController,
  el: HTMLElement,
) => BasesView;

export interface BasesViewRegistration {
  type: string;
  name: string;
  icon: string;
  factory: BasesViewFactory;
  options?: (config: BasesViewConfig) => BasesAllOptions[];
}

export abstract class BasesView extends Component {
  private mountedView: ReturnType<typeof mount> | null = null;
  private mountedViewContainer: HTMLElement | null = null;

  abstract type: string;
  app: App;
  config: BasesViewConfig = new BasesViewConfig();
  allProperties: BasesPropertyId[] = [];
  data: BasesQueryResult = new BasesQueryResult();

  protected constructor(readonly controller: QueryController) {
    super();
    this.app = controller.app;
  }

  protected mountViewComponent(
    component: any,
    props: Record<string, unknown>,
    containerEl: HTMLElement,
  ): void {
    this.unmountViewComponent();
    containerEl.replaceChildren();
    const target = containerEl.createDiv("w-full h-full");
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

  abstract onDataUpdated(): void;

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
}

export function parsePropertyId(propertyId: BasesPropertyId): BasesProperty {
  const [prefix, ...rest] = propertyId.split(".");
  if (prefix === "file" || prefix === "formula" || prefix === "note") {
    return { type: prefix, name: rest.join(".") };
  }
  return { type: "note", name: propertyId };
}
