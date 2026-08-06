import { Button } from "@lapismd/design-core/shadcn/button";
import type { ButtonSize, ButtonVariant } from "./design-core-button-types";
import { Input } from "@lapismd/design-core/shadcn/input";
import { Textarea } from "@lapismd/design-core/shadcn/textarea";
import { Slider } from "@lapismd/design-core/shadcn/slider";
import { Progress } from "@lapismd/design-core/shadcn/progress";
import { Select } from "./components/select";
import { Switch } from "@lapismd/design-core/shadcn/switch";

import { createRawSnippet, tick } from "svelte";
import {
  mountComponent,
  type MountComponent,
} from "$lib/hooks/mountComponent.svelte";
import { setIcon } from "$lib/icons";
import type { HTMLInputAttributes } from "svelte/elements";

import type { App } from "./context.svelte";
import { dialogPortalPropsForDocument } from "./dialog-portal";
import type { Plugin } from "./plugin";
import IconList from "$lib/components/icon/icon-list.svelte";
import ListSetting from "$lib/components/configuration/list-setting.svelte";
import OptionsComboboxSetting from "$lib/components/configuration/options-combobox-setting.svelte";
import ObjectGridSetting from "$lib/components/configuration/object-grid-setting.svelte";
import ObjectMapSetting from "$lib/components/configuration/object-map-setting.svelte";
import ObjectArraySetting from "$lib/components/configuration/object-array-setting.svelte";
import DateSetting from "$lib/components/configuration/date-setting.svelte";
import type { ArrayType, ObjectType } from "./configuration.svelte";
import { md5 } from "./utils";
import ModalComponent from "@lapis-notes/ui/modal";
import Search from "@lapis-notes/ui/search";
import { debounce } from "lodash-es";
import {
  ensureSectionHeadingActionsEl,
  getSettingMountEl,
  openSettingSection,
  removeEmptyImplicitSection,
  setActiveSectionHeadingDescription,
  takeElementContent,
} from "./setting-section-layout";

export {
  SETTING_SECTION_BODY_CLASS,
  SETTING_SECTION_CLASS,
  SETTING_SECTION_HEADING_ACTIONS_CLASS,
  SETTING_SECTION_HEADING_CLASS,
  SETTING_SECTION_HEADING_DESCRIPTION_CLASS,
  SETTING_SECTION_HEADING_TITLE_CLASS,
} from "./setting-section-layout";

export abstract class BaseComponent {
  /** @public */
  abstract disabled: boolean;
  /**
   * Facilitates chaining
   *
   * @public
   */
  then(cb: (component: this) => any): this {
    cb(this);
    return this;
  }
  /** @public */
  abstract setDisabled(disabled: boolean): this;
}

export abstract class ValueComponent<T> extends BaseComponent {
  metadata: Record<string, any> = {};

  /** @public */
  registerOptionListener(
    listeners: Record<string, (value?: T) => T>,
    key: string,
  ): this {
    return this;
  }
  /** @public */
  abstract getValue(): T;
  /** @public */
  abstract setValue(value: T): this;

  setMetadata(key: string, value: any): this {
    this.metadata[key] = value;
    return this;
  }
}

export type TooltipPlacement = "bottom" | "right" | "left" | "top";

export interface TooltipOptions {
  /** @public */
  placement?: TooltipPlacement;
  /** @public */
  classes?: string[];
  /** @public */
  gap?: number;

  /** @public */
  delay?: number;
}

export class ExtraButtonComponent extends BaseComponent {
  private component!: MountComponent<any>;

  private text: string = "";
  private icon: string = "";

  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(Button, {
      target: containerEl,
      props: {
        ref: null,
        variant: "ghost",
      },
    });
  }

  get extraSettingsEl(): HTMLButtonElement {
    return (this.component.props.ref ??
      this.containerEl.querySelector("button")) as HTMLButtonElement;
  }

  setTooltip(value: string, options?: TooltipOptions): this {
    this.component.props["data-tooltip"] = value;
    this.component.props["data-tooltip-position"] =
      options?.placement ?? "bottom";
    return this;
  }

  setCta(): this {
    this.component.props.variant = "default";
    return this;
  }

  setVariant(variant: ButtonVariant): this {
    this.component.props.variant = variant;
    return this;
  }

  setSize(size: ButtonSize) {
    this.component.props.size = size;
  }

  setWarning(): this {
    this.component.props.variant = "destructive";
    return this;
  }

  removeCta(): this {
    this.component.props.variant = "ghost";
    return this;
  }

  setButtonText(name: string): this {
    this.text = name;
    this.icon = "";
    this.component.props.children = this.createChildren();
    return this;
  }

  setIcon(icon: string): this {
    this.icon = icon;
    this.text = "";
    this.component.props.children = this.createChildren();
    return this;
  }

  setClass(cls: string): this {
    this.component.props["class"] = cls;
    return this;
  }

  createChildren() {
    return createRawSnippet(() => ({
      render: () => `<span></span>`,
      setup: (element) => {
        const parent = element.parentElement ?? this.extraSettingsEl;
        this.icon
          ? setIcon(parent!, this.icon)
          : (parent.innerHTML = this.text);
      },
    }));
  }

  onClick(onclick: (evt: MouseEvent) => any): this {
    this.component.props.onclick = onclick;
    return this;
  }

  get disabled() {
    return !!this.component.props.disabled;
  }

  setDisabled(disabled: boolean): this {
    this.component.props.disabled = disabled;
    return this;
  }
}

export class ButtonComponent extends BaseComponent {
  private component!: MountComponent<any>;

  private text: string = "";
  private icon: string = "";

  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(Button, {
      target: containerEl,
      props: {
        ref: null,
        variant: "ghost",
      },
    });
  }

  get buttonEl(): HTMLButtonElement {
    return (this.component.props.ref ??
      this.containerEl.querySelector("button")) as HTMLButtonElement;
  }

  setTooltip(value: string, options?: TooltipOptions): this {
    this.component.props["data-tooltip"] = value;
    this.component.props["data-tooltip-position"] =
      options?.placement ?? "bottom";
    return this;
  }

  setCta(): this {
    this.component.props.variant = "default";
    return this;
  }

  setVariant(variant: ButtonVariant): this {
    this.component.props.variant = variant;
    return this;
  }

  setSize(size: ButtonSize) {
    this.component.props.size = size;
  }

  setWarning(): this {
    this.component.props.variant = "destructive";
    return this;
  }

  setButtonText(name: string): this {
    this.text = name;
    this.icon = "";
    this.component.props.children = this.createChildren();
    return this;
  }

  setIcon(icon: string): this {
    this.icon = icon;
    this.text = "";
    this.component.props.children = this.createChildren();
    return this;
  }

  setClass(cls: string): this {
    this.component.props["class"] = cls;
    return this;
  }

  createChildren() {
    return createRawSnippet(() => ({
      render: () => `<span></span>`,
      setup: (element) => {
        const parent = element.parentElement ?? this.buttonEl;
        this.icon
          ? setIcon(parent!, this.icon)
          : (parent.innerHTML = this.text);
      },
    }));
  }

  onClick(onclick: (evt: MouseEvent) => any): this {
    this.component.props.onclick = onclick;
    return this;
  }

  get disabled() {
    return !!this.component.props.disabled;
  }

  setDisabled(disabled: boolean): this {
    this.component.props.disabled = disabled;
    return this;
  }
}

export class ToggleComponent extends ValueComponent<boolean> {
  private component!: MountComponent<any>;

  /** @public */
  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(Switch, {
      target: containerEl,
    });
  }

  get toggleEl(): HTMLElement {
    return this.component.props.ref!;
  }

  get disabled() {
    return !!this.component.props.disabled;
  }

  /** @public */
  setDisabled(disabled: boolean): this {
    this.component.props.disabled = disabled;
    return this;
  }
  /** @public */
  getValue(): boolean {
    return this.component.props.checked ?? false;
  }
  /** @public */
  setValue(on: boolean): this {
    this.component.props.checked = on;
    return this;
  }

  /** @public */
  setTooltip(tooltip: string, options?: TooltipOptions): this {
    return this;
  }
  /** @public */
  onClick(): void {
    this.component.props.checked = !this.getValue();
  }
  /** @public */
  onChange(callback: (value: boolean) => any): this {
    this.component.props.onCheckedChange = debounce(callback, 500);
    return this;
  }
}

export class IconPickerComponent extends ValueComponent<string> {
  private component!: MountComponent<any>;

  /** @public */
  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(IconList, {
      target: containerEl,
      props: {
        value: "",
        ref: null,
        disabled: false,
      },
    });
  }

  setCta(): this {
    this.component.props.variant = "default";
    return this;
  }

  setVariant(variant: ButtonVariant): this {
    this.component.props.variant = variant;
    return this;
  }

  setSize(size: ButtonSize) {
    this.component.props.size = size;
  }

  setWarning(): this {
    this.component.props.variant = "destructive";
    return this;
  }

  /** @public */
  setDisabled(disabled: boolean): this {
    this.component.props.disabled = disabled;
    return this;
  }

  get disabled() {
    return this.component.props.disabled;
  }

  /** @public */
  getValue(): string {
    return this.component.props.value ?? "";
  }

  /** @public */
  setValue(value: string): this {
    this.component.props.value = value;
    return this;
  }

  setButtonText(name: string): this {
    this.component.props.label = name;
    return this;
  }

  setIcon(icon: string): this {
    return this.setValue(icon);
  }

  /** @public */
  setTooltip(tooltip: string, options?: TooltipOptions): this {
    return this;
  }

  onChange(callback: (value: string) => any): this {
    this.component.props.onValueChange = debounce(callback, 500);
    return this;
  }
}

export class ProgressBarComponent extends ValueComponent<number> {
  private component!: MountComponent<any>;

  /** @public */
  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(Progress, {
      target: containerEl,
    });
  }

  get toggleEl(): HTMLElement {
    return this.component.props.ref!;
  }

  get disabled() {
    return this.component.props.class?.includes("disabled");
  }

  /** @public */
  setDisabled(disabled: boolean): this {
    this.component.props.class = disabled ? "disabled" : "";
    return this;
  }

  /** @public */
  getValue(): number {
    return this.component.props.value ?? 0;
  }
  /** @public */
  setValue(value: number): this {
    this.component.props.value = value;
    return this;
  }

  /** @public */
  setTooltip(tooltip: string, options?: TooltipOptions): this {
    return this;
  }
}

export class SliderComponent extends ValueComponent<number | number[]> {
  private component!: MountComponent<any>;

  /** @public */
  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(Slider, {
      target: containerEl,
      props: {
        value: 0,
        ref: null,
        type: "single",
      },
    });
  }

  get sliderEl(): HTMLElement {
    return this.component.props.ref!;
  }

  get disabled() {
    return !!this.component.props.disabled;
  }

  /** @public */
  setDisabled(disabled: boolean): this {
    this.component.props.disabled = disabled;
    return this;
  }

  setDynamicTooltip(): this {
    return this;
  }

  setLimits(min: number, max: number, step: number): this {
    this.component.props.min = min;
    this.component.props.max = max;
    this.component.props.step = step;
    return this;
  }

  setType(type: "single" | "multiple"): this {
    this.component.props.type = type;
    return this;
  }

  /** @public */
  getValue(): number | number[] {
    return (this.component.props.value ??
      this.component.props.type === "single")
      ? 0
      : [];
  }

  /** @public */
  setValue(value: number | number[]): this {
    this.component.props.value = value;
    return this;
  }

  onChange(callback: (value: number | number[]) => any): this {
    this.component.props.onValueChange = debounce(callback, 500);
    return this;
  }
}

export class Modal {
  private component!: MountComponent<any>;
  readonly containerEl: HTMLElement | undefined;

  constructor(readonly app: App) {
    const hostDocument = app.workspace.getCommandHostDocument();
    this.containerEl = hostDocument.createElement("div");
    this.component = mountComponent(ModalComponent, {
      target: this.containerEl,
      props: {
        open: false,
        contentEl: null,
        modalEl: null,
        titleEl: null,
        content: "",
        title: "",
        portalProps: dialogPortalPropsForDocument(hostDocument),
        onOpenChange: this.onOpenChange.bind(this),
      } as any,
    });
  }

  onOpenChange(open: boolean) {
    open ? this.onOpen() : this.onClose();
  }

  onOpen(): void {}

  onClose(): void {}

  open(): void {
    this.component.props.open = true;
    tick().then(() => setTimeout(() => this.onOpen()));
  }

  close(): void {
    this.component.props.open = false;
    tick().then(() => setTimeout(() => this.onClose()));
  }

  setTitle(title: string | DocumentFragment): this {
    this.component.props.title = title;
    return this;
  }

  setContent(content: string | DocumentFragment): this {
    this.component.props.content = content;
    return this;
  }

  get titleEl(): HTMLElement {
    return this.component.props.titleEl!;
  }

  get contentEl(): HTMLElement {
    return this.component.props.contentEl!;
  }

  get modalEl(): HTMLElement {
    return this.component.props.modalEl!;
  }
}

export class DropdownComponent extends ValueComponent<string | string[]> {
  private component!: MountComponent<any>;

  /** @public */
  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(Select, {
      target: containerEl,
      props: {
        type: "single",
        items: [],
      },
    });
  }

  addOption(value: string, label: string): this {
    this.component.props.items!.push({ label, value });
    return this;
  }

  addOptions(options: Record<string, string>): this {
    const items: Array<{ label: string; value: string }> = [];
    for (const [value, label] of Object.entries(options)) {
      items.push({ label, value });
    }
    this.component.props.items!.push(...items);
    return this;
  }

  setItems(
    items: Array<{ label: string; value: string; disabled?: boolean }>,
  ): this {
    this.component.props.items = items;
    return this;
  }

  get selectEl(): HTMLElement {
    return this.component.props.ref!;
  }

  get disabled() {
    return !!this.component.props.disabled;
  }

  /** @public */
  setDisabled(disabled: boolean): this {
    this.component.props.disabled = disabled;
    return this;
  }

  setType(type: "single" | "multiple"): this {
    this.component.props.type = type;
    return this;
  }

  /** @public */
  getValue(): string | string[] {
    return (this.component.props.value ??
      this.component.props.type === "single")
      ? ""
      : [];
  }

  /** @public */
  setValue(value: string | string[]): this {
    this.component.props.value = value;
    return this;
  }

  onChange(callback: (value: string | string[]) => any): this {
    this.component.props.onValueChange = debounce(callback, 500);
    return this;
  }
}

export class AbstractTextComponent<
  T extends HTMLInputElement | HTMLTextAreaElement,
> extends ValueComponent<string> {
  /** @public */
  constructor(protected component: MountComponent<any>) {
    super();
  }

  get inputEl(): T {
    return this.component.props.ref as T;
  }

  get disabled() {
    return !!this.component.props.disabled;
  }

  /** @public */
  setDisabled(disabled: boolean): this {
    this.component.props.disabled = disabled;
    return this;
  }

  /** @public */
  getValue(): string {
    return this.component.props.value;
  }

  /** @public */
  setValue(value: string): this {
    this.component.props.value = value;
    return this;
  }
  /** @public */
  setPlaceholder(placeholder: string): this {
    this.component.props.placeholder = placeholder;
    return this;
  }
  /** @public */
  onChanged(): void {}

  /** @public */
  onChange(callback: (value: string) => any): this {
    callback = debounce(callback, 500);
    this.component.props.oninput = () => {
      callback(this.inputEl.value);
    };
    return this;
  }
}

export class TextComponent extends AbstractTextComponent<HTMLInputElement> {
  /** @public */
  constructor(containerEl: HTMLElement) {
    super(
      mountComponent(Input, {
        target: containerEl,
        props: {
          ref: null,
          type: "text",
          value: "",
        },
      }),
    );
  }

  setType(type: string): this {
    (this.component.props as HTMLInputAttributes).type = type;
    return this;
  }
}

export class TextAreaComponent extends AbstractTextComponent<HTMLTextAreaElement> {
  /** @public */
  constructor(containerEl: HTMLElement) {
    super(
      mountComponent(Textarea, {
        target: containerEl,
        props: {
          ref: null,
          type: "text",
          value: "",
        },
      }),
    );
  }
}

export class SearchComponent extends AbstractTextComponent<HTMLInputElement> {
  /** @public */
  constructor(containerEl: HTMLElement) {
    super(
      mountComponent(Search, {
        target: containerEl,
        props: {
          ref: null,
          value: "",
          onChange: null,
        },
      }),
    );
  }

  get clearButtonEl(): HTMLElement {
    return (
      this.component.props.clearButtonEl ??
      this.component.props.ref ??
      this.inputEl
    );
  }

  onChange(callback: (value: string) => any): this {
    callback = debounce(callback, 500);
    this.component.props.onChange = callback;
    return this;
  }

  onChanged(): void {
    this.component.props.onChange?.(this.getValue());
  }
}

export class MomentFormatComponent extends TextComponent {}

export class ListSettingComponent extends ValueComponent<unknown[]> {
  private component!: MountComponent<any>;

  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(ListSetting, {
      target: containerEl,
      props: {
        itemType: "string",
        value: [],
        valueOptions: [],
        allowUnknownOptions: false,
      },
    });
  }

  setItemType(type: "string" | "number" | "integer" | "boolean"): this {
    this.component.props.itemType = type;
    return this;
  }

  setValueOptions(options: ObjectMapOption[]): this {
    this.component.props.valueOptions = options;
    return this;
  }

  setAllowUnknownOptions(allowUnknownOptions: boolean): this {
    this.component.props.allowUnknownOptions = allowUnknownOptions;
    return this;
  }

  get disabled() {
    return false;
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }

  getValue(): unknown[] {
    return this.component.props.value ?? [];
  }

  setValue(value: unknown[]): this {
    this.component.props.value = value;
    return this;
  }

  onChange(callback: (value: unknown[]) => any): this {
    this.component.props.onValueChange = debounce(callback, 300);
    return this;
  }
}

export class OptionsComboboxSettingComponent extends ValueComponent<string> {
  private component!: MountComponent<any>;

  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(OptionsComboboxSetting, {
      target: containerEl,
      props: {
        value: "",
        options: [],
      },
    });
  }

  setValueOptions(options: ObjectMapOption[]): this {
    this.component.props.options = options;
    return this;
  }

  get disabled() {
    return false;
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }

  getValue(): string {
    return this.component.props.value ?? "";
  }

  setValue(value: string): this {
    this.component.props.value = value;
    return this;
  }

  onChange(callback: (value: string) => any): this {
    this.component.props.onValueChange = debounce(callback, 300);
    return this;
  }

  onQueryChange(callback: (query: string) => any): this {
    this.component.props.onQueryChange = debounce(callback, 200);
    return this;
  }
}

export type ObjectMapOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export class ObjectGridSettingComponent extends ValueComponent<
  Record<string, unknown>
> {
  private component!: MountComponent<any>;

  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(ObjectGridSetting, {
      target: containerEl,
      props: {
        schema: { type: "object", properties: {} },
        value: {},
      },
    });
  }

  setSchema(schema: ObjectType): this {
    this.component.props.schema = schema;
    return this;
  }

  get disabled() {
    return false;
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }

  getValue(): Record<string, unknown> {
    return this.component.props.value ?? {};
  }

  setValue(value: Record<string, unknown>): this {
    this.component.props.value = value;
    return this;
  }

  onChange(callback: (value: Record<string, unknown>) => any): this {
    this.component.props.onValueChange = debounce(callback, 300);
    return this;
  }
}

export class ObjectMapSettingComponent extends ValueComponent<
  Record<string, unknown>
> {
  private component!: MountComponent<any>;

  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(ObjectMapSetting, {
      target: containerEl,
      props: {
        schema: { type: "object", properties: {}, additionalProperties: true },
        value: {},
        valueOptions: [],
      },
    });
  }

  setSchema(schema: ObjectType): this {
    this.component.props.schema = schema;
    return this;
  }

  setValueOptions(options: ObjectMapOption[]): this {
    this.component.props.valueOptions = options;
    return this;
  }

  onValueQueryChange(callback: (query: string) => any): this {
    this.component.props.onValueQueryChange = debounce(callback, 200);
    return this;
  }

  get disabled() {
    return false;
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }

  getValue(): Record<string, unknown> {
    return this.component.props.value ?? {};
  }

  setValue(value: Record<string, unknown>): this {
    this.component.props.value = value;
    return this;
  }

  onChange(callback: (value: Record<string, unknown>) => any): this {
    this.component.props.onValueChange = debounce(callback, 300);
    return this;
  }
}

export class ObjectArraySettingComponent extends ValueComponent<
  Record<string, unknown>[]
> {
  private component!: MountComponent<any>;

  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(ObjectArraySetting, {
      target: containerEl,
      props: {
        schema: {
          type: "array",
          items: { type: "object", properties: {} },
        },
        value: [],
        columnOptions: {},
        columnOnQueryChange: {},
      },
    });
  }

  setSchema(schema: ArrayType & { items: ObjectType }): this {
    this.component.props.schema = schema;
    return this;
  }

  setColumnOptions(options: Record<string, ObjectMapOption[]>): this {
    this.component.props.columnOptions = options;
    return this;
  }

  setColumnOnQueryChange(
    handlers: Record<string, (query: string) => void>,
  ): this {
    this.component.props.columnOnQueryChange = handlers;
    return this;
  }

  get disabled() {
    return false;
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }

  getValue(): Record<string, unknown>[] {
    return this.component.props.value ?? [];
  }

  setValue(value: Record<string, unknown>[]): this {
    this.component.props.value = value;
    return this;
  }

  onChange(callback: (value: Record<string, unknown>[]) => any): this {
    this.component.props.onValueChange = debounce(callback, 300);
    return this;
  }
}

export class DateSettingComponent extends ValueComponent<string> {
  private component!: MountComponent<any>;

  constructor(readonly containerEl: HTMLElement) {
    super();
    this.component = mountComponent(DateSetting, {
      target: containerEl,
      props: {
        value: "",
        format: "date",
      },
    });
  }

  setFormat(format: "date" | "time"): this {
    this.component.props.format = format;
    return this;
  }

  get disabled() {
    return false;
  }

  setDisabled(_disabled: boolean): this {
    return this;
  }

  getValue(): string {
    return this.component.props.value ?? "";
  }

  setValue(value: string): this {
    this.component.props.value = value;
    return this;
  }

  onChange(callback: (value: string) => any): this {
    this.component.props.onValueChange = debounce(callback, 300);
    return this;
  }
}

export abstract class SettingTab {
  /**
   * Outermost HTML element on the setting tab.
   *
   * @public
   */
  containerEl: HTMLElement = $state()!;

  constructor(readonly app: App) {}

  /**
   * Called when the settings tab should be rendered.
   *
   * @public
   */
  abstract display(): void;

  /**
   * Hides the contents of the setting tab. Any registered components should be
   * unloaded when the view is hidden. Override this if you need to perform
   * additional cleanup.
   *
   * @public
   */
  hide(): void {}
}

export abstract class PluginSettingTab extends SettingTab {
  /** @public */
  constructor(
    app: App,
    readonly plugin: Plugin,
  ) {
    super(app);
  }
}

export type SettingItemSpec = {
  title: string | DocumentFragment;
  id: string;
  icon: string | null;
  disabled: boolean;
  tab?: SettingTab;
  parent?: SettingGroup;
};

export class SettingItem {
  private props: SettingItemSpec = $state({
    id: crypto.randomUUID(),
    title: "",
    icon: "",
    disabled: false,
  });

  key: string = $state(this.props.id);

  static create(props: Partial<SettingItemSpec> = {}) {
    return new SettingItem(props);
  }

  private constructor(props: Partial<SettingItemSpec> = {}) {
    this.props = { ...this.props, ...props };
    this.update();
  }

  update(): this {
    this.key = md5(
      `${JSON.stringify({
        id: this.props.id,
        title: this.props.title,
        icon: this.props.icon,
        disabled: this.props.disabled,
      })}`,
    );
    this.props.parent?.update();
    return this;
  }

  get title() {
    return this.props.title;
  }

  get icon() {
    return this.props.icon;
  }

  get disabled() {
    return this.props.disabled;
  }

  get id() {
    return this.props.id || this.props.title;
  }

  get tab() {
    return this.props.tab;
  }

  setTitle(title: string | DocumentFragment): this {
    this.props.title = title;
    return this.update();
  }

  setId(id: string): this {
    this.props.id = id;
    return this.update();
  }

  /**
   * @param icon - ID of the icon, can use any icon loaded with {@link addIcon}
   *   or from the built-in lucide library.
   * @public
   * @see The Obsidian icon library includes the {@link https://lucide.dev/ Lucide icon library}, any icon name from their site will work here.
   */
  setIcon(icon: string | null): this {
    this.props.icon = icon;
    return this.update();
  }

  setDisabled(disabled: boolean): this {
    this.props.disabled = disabled;
    return this.update();
  }

  setTab(tab: SettingTab): this {
    this.props.tab = tab;
    return this.update();
  }
}

export type SettingGroupSpec = {
  id: string;
  title: string | DocumentFragment;
  items: SettingItem[];
  parent?: AppSettings;
};

export class SettingGroup {
  items = $state<SettingItem[]>([]);
  private props: SettingGroupSpec = $state({
    id: crypto.randomUUID(),
    title: "",
    items: [],
  });

  key: string = $state(md5(JSON.stringify(this.props)));

  static create(props: Partial<SettingGroupSpec> = {}) {
    return new SettingGroup(props);
  }

  private constructor(props: Partial<SettingGroupSpec> = {}) {
    this.props = { ...this.props, ...props };
    this.items = this.props.items;
    this.props.items = this.items;
    this.update();
  }

  update(): this {
    this.key = md5(
      `${JSON.stringify({ ...this.props, items: this.items.map((it) => it.key) })}`,
    );
    this.props.parent?.update();
    return this;
  }

  get id() {
    return this.props.id;
  }

  get title() {
    return this.props.title;
  }

  setId(id: string): this {
    this.props.id = id;
    return this.update();
  }

  setTitle(title: string): this {
    this.props.title = title;
    return this.update();
  }

  addItem(cb: (item: SettingItem) => any): this {
    const item = SettingItem.create({ parent: this });
    cb(item);
    this.items.push(item);
    return this.update();
  }

  removeItem(id: string) {
    this.items = this.items.filter((it) => it.id !== id);
    return this.update();
  }
}

/**
 * Mutable registry of settings groups and items shown in the settings UI.
 *
 * @public
 */
export class AppSettings {
  readonly groups: SettingGroup[] = $state([]);
  key: string = $state(
    md5(`${JSON.stringify(this.groups.map((it) => it.key))}`),
  );

  constructor() {
    this.update();
  }

  addGroup(cb: (item: SettingGroup) => any): this {
    const group = SettingGroup.create({ parent: this });
    cb(group);
    this.groups.push(group);
    return this.update();
  }

  update(): this {
    this.key = md5(`${JSON.stringify(this.groups.map((it) => it.key))}`);
    return this;
  }

  find(id: string) {
    return this.groups.find((it) => it.id === id);
  }

  findItem(id: string) {
    for (const group of this.groups) {
      const item = group.items.find((it) => it.id === id);
      if (item) {
        return item;
      }
    }

    return undefined;
  }
}

export interface RGB {
  /**
   * Red integer value between 0 and 255
   *
   * @public
   */
  r: number;
  /**
   * Green integer value between 0 and 255
   *
   * @public
   */
  g: number;
  /**
   * Blue integer value between 0 and 255
   *
   * @public
   */
  b: number;
}

export interface HSL {
  /**
   * Hue integer value between 0 and 360
   *
   * @public
   */
  h: number;
  /**
   * Saturation integer value between 0 and 100
   *
   * @public
   */
  s: number;
  /**
   * Lightness integer value between 0 and 100
   *
   * @public
   */
  l: number;
}

export class ColorComponent extends AbstractTextComponent<HTMLInputElement> {
  /** @public */
  constructor(containerEl: HTMLElement) {
    super(
      mountComponent(Input, {
        target: containerEl,
        props: {
          type: "color",
          ref: null,
          value: null,
          class: "shadow-none w-auto h-auto p-0 border-none rounded-full",
        },
      }),
    );
  }

  getValueRgb(): RGB {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
      this.getValue() || "#000000",
    );
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  getValueHsl(): HSL {
    return this.rgbToHsl(this.getValueRgb());
  }

  setValueRgb(rgb: RGB): this {
    this.setValue(this.rgbToHex(rgb));
    return this;
  }

  /** @public */
  setValueHsl(hsl: HSL): this {
    this.setValue(this.hslToHex(hsl));
    return this;
  }

  private componentToHex(c: number) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  private rgbToHex({ r, g, b }: RGB) {
    return (
      "#" +
      this.componentToHex(r) +
      this.componentToHex(g) +
      this.componentToHex(b)
    );
  }

  private hslToHex({ h, s, l }: HSL) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0"); // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  private rgbToHsl({ r, g, b }: RGB) {
    r /= 255;
    g /= 255;
    b /= 255;
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s
      ? l === r
        ? (g - b) / s
        : l === g
          ? 2 + (b - r) / s
          : 4 + (r - g) / s
      : 0;
    return {
      h: 60 * h < 0 ? 60 * h + 360 : 60 * h,
      s: 100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
      l: (100 * (2 * l - s)) / 2,
    };
  }
}

function createSettingItemElement(): {
  settingEl: HTMLDivElement;
  infoEl: HTMLDivElement;
  nameEl: HTMLDivElement;
  descEl: HTMLDivElement;
  controlEl: HTMLDivElement;
} {
  const settingEl = document.createElement("div");
  settingEl.className = "setting-item";
  const infoEl = document.createElement("div");
  infoEl.className = "setting-item-info";
  const nameEl = document.createElement("div");
  nameEl.className = "setting-item-name";
  const descEl = document.createElement("div");
  descEl.className = "setting-item-description";
  const controlEl = document.createElement("div");
  controlEl.className = "setting-item-control";
  infoEl.append(nameEl, descEl);
  settingEl.append(infoEl, controlEl);
  return { settingEl, infoEl, nameEl, descEl, controlEl };
}

export class Setting {
  components: BaseComponent[] = [];
  private mountedToDom = false;
  private mountScheduled = false;
  private isHeadingRow = false;
  /** @public */
  settingEl: HTMLElement;
  /** @public */
  infoEl: HTMLElement;
  /** @public */
  nameEl: HTMLElement;
  /** @public */
  descEl: HTMLElement;
  /** @public */
  controlEl: HTMLElement;

  constructor(readonly containerEl: HTMLElement) {
    const elements = createSettingItemElement();
    this.settingEl = elements.settingEl;
    this.infoEl = elements.infoEl;
    this.nameEl = elements.nameEl;
    this.descEl = elements.descEl;
    this.controlEl = elements.controlEl;
  }

  private mountSettingRow(): void {
    if (this.mountedToDom || this.isHeadingRow) {
      return;
    }

    getSettingMountEl(this.containerEl).appendChild(this.settingEl);
    this.mountedToDom = true;
  }

  private scheduleMount(): void {
    if (this.isHeadingRow || this.mountScheduled || this.mountedToDom) {
      return;
    }

    this.mountScheduled = true;
    queueMicrotask(() => {
      this.mountScheduled = false;
      if (this.isHeadingRow || this.mountedToDom) {
        return;
      }
      this.mountSettingRow();
    });
  }

  /**
   * Facilitates chaining
   *
   * @public
   */
  then(cb: (component: this) => any): this {
    cb(this);
    return this;
  }

  setName(name: string | DocumentFragment): this {
    this.nameEl.empty();
    if (typeof name === "string") {
      this.nameEl.setText(name);
    } else {
      this.nameEl.appendChild(name);
    }
    this.scheduleMount();
    return this;
  }

  setVisibility(visible: boolean) {
    this.mountSettingRow();
    this.settingEl.toggleVisibility(visible);
  }

  setDesc(desc: string | DocumentFragment): this {
    this.descEl.empty();
    if (typeof desc === "string") {
      this.descEl.setText(desc);
    } else {
      this.descEl.appendChild(desc);
    }
    if (this.isHeadingRow) {
      setActiveSectionHeadingDescription(this.containerEl, desc);
      return this;
    }
    this.scheduleMount();
    return this;
  }

  setClass(cls: string): this {
    this.settingEl.classList.add(
      ...cls
        .split(" ")
        .map((it) => it.trim())
        .filter((it) => it),
    );
    if (!this.isHeadingRow) {
      this.mountScheduled = false;
      this.mountSettingRow();
    }
    return this;
  }

  setTooltip(tooltip: string, options?: TooltipOptions): this {
    this.settingEl.dataset.tooltip = tooltip;
    this.settingEl.dataset.tooltipPosition = options?.placement ?? "top";
    return this;
  }

  setDisabled(disabled: boolean): this {
    this.components.forEach((component) => component.setDisabled(disabled));
    this.settingEl.toggleClass("is-disabled", disabled);
    return this;
  }

  clear(): this {
    this.components = [];
    this.controlEl.empty();
    return this;
  }

  addComponent<T extends BaseComponent>(component: T): this {
    this.components.push(component);
    return this;
  }

  setHeading(): this {
    this.isHeadingRow = true;
    const title = takeElementContent(this.nameEl);
    const description = this.descEl.textContent?.trim()
      ? takeElementContent(this.descEl)
      : null;

    if (this.mountedToDom) {
      this.settingEl.remove();
      removeEmptyImplicitSection(this.containerEl);
    }

    openSettingSection(this.containerEl, title, description);
    return this;
  }

  addButton(cb: (component: ButtonComponent) => any): this {
    if (this.isHeadingRow) {
      const actionsEl = ensureSectionHeadingActionsEl(this.containerEl);
      if (actionsEl) {
        const button = new ButtonComponent(actionsEl);
        this.components.push(button);
        setTimeout(() => cb(button));
      }
      return this;
    }

    this.mountSettingRow();
    const button = new ButtonComponent(this.controlEl);
    this.components.push(button);
    setTimeout(() => cb(button));
    return this;
  }

  addExtraButton(cb: (component: ExtraButtonComponent) => any): this {
    if (this.isHeadingRow) {
      const actionsEl = ensureSectionHeadingActionsEl(this.containerEl);
      if (actionsEl) {
        const button = new ExtraButtonComponent(actionsEl);
        this.components.push(button);
        setTimeout(() => cb(button));
      }
      return this;
    }

    this.mountSettingRow();
    const button = new ExtraButtonComponent(this.controlEl);
    this.components.push(button);
    setTimeout(() => cb(button));
    return this;
  }

  addToggle(cb: (component: ToggleComponent) => any): this {
    this.mountSettingRow();
    const toggle = new ToggleComponent(this.controlEl);
    this.components.push(toggle);
    setTimeout(() => cb(toggle));
    return this;
  }

  addText(cb: (component: TextComponent) => any): this {
    this.mountSettingRow();
    const text = new TextComponent(this.controlEl);
    this.components.push(text);
    setTimeout(() => cb(text));
    return this;
  }

  addSearch(cb: (component: SearchComponent) => any): this {
    this.mountSettingRow();
    const text = new SearchComponent(this.controlEl);
    this.components.push(text);
    setTimeout(() => cb(text));
    return this;
  }

  addTextArea(cb: (component: TextAreaComponent) => any): this {
    this.mountSettingRow();
    const text = new TextAreaComponent(this.controlEl);
    this.components.push(text);
    setTimeout(() => cb(text));
    return this;
  }

  addSlider(cb: (component: SliderComponent) => any): this {
    this.mountSettingRow();
    const slider = new SliderComponent(this.controlEl);
    this.components.push(slider);
    setTimeout(() => cb(slider));
    return this;
  }

  addProgressBar(cb: (component: ProgressBarComponent) => any): this {
    this.mountSettingRow();
    const progress = new ProgressBarComponent(this.controlEl);
    this.components.push(progress);
    setTimeout(() => cb(progress));
    return this;
  }

  addColorPicker(cb: (component: ColorComponent) => any): this {
    this.mountSettingRow();
    const picker = new ColorComponent(this.controlEl);
    this.components.push(picker);
    setTimeout(() => cb(picker));
    return this;
  }

  addIconPicker(cb: (component: IconPickerComponent) => any): this {
    this.mountSettingRow();
    const picker = new IconPickerComponent(this.controlEl);
    this.components.push(picker);
    setTimeout(() => cb(picker));
    return this;
  }

  addDropdown(cb: (component: DropdownComponent) => any): this {
    this.mountSettingRow();
    const dropdown = new DropdownComponent(this.controlEl);
    this.components.push(dropdown);
    setTimeout(() => cb(dropdown));
    return this;
  }

  addMomentFormat(cb: (component: MomentFormatComponent) => any): this {
    this.mountSettingRow();
    const text = new MomentFormatComponent(this.controlEl);
    this.components.push(text);
    setTimeout(() => cb(text));
    return this;
  }

  addList(cb: (component: ListSettingComponent) => any): this {
    this.mountSettingRow();
    const list = new ListSettingComponent(this.controlEl);
    this.components.push(list);
    setTimeout(() => cb(list));
    return this;
  }

  addOptionsCombobox(
    cb: (component: OptionsComboboxSettingComponent) => any,
  ): this {
    this.mountSettingRow();
    const combobox = new OptionsComboboxSettingComponent(this.controlEl);
    this.components.push(combobox);
    setTimeout(() => cb(combobox));
    return this;
  }

  addObjectGrid(cb: (component: ObjectGridSettingComponent) => any): this {
    this.mountSettingRow();
    const grid = new ObjectGridSettingComponent(this.controlEl);
    this.components.push(grid);
    setTimeout(() => cb(grid));
    return this;
  }

  addObjectMap(cb: (component: ObjectMapSettingComponent) => any): this {
    this.mountSettingRow();
    const map = new ObjectMapSettingComponent(this.controlEl);
    this.components.push(map);
    setTimeout(() => cb(map));
    return this;
  }

  addObjectArray(cb: (component: ObjectArraySettingComponent) => any): this {
    this.mountSettingRow();
    const table = new ObjectArraySettingComponent(this.controlEl);
    this.components.push(table);
    setTimeout(() => cb(table));
    return this;
  }

  addDatePicker(cb: (component: DateSettingComponent) => any): this {
    this.mountSettingRow();
    const picker = new DateSettingComponent(this.controlEl);
    this.components.push(picker);
    setTimeout(() => cb(picker));
    return this;
  }
}
