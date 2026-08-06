import { type ButtonSize, type ButtonVariant } from "./design-core-button-types";
import { type MountComponent } from "$lib/hooks/mountComponent.svelte";
import type { App } from "./context.svelte";
import type { Plugin } from "./plugin";
import type { ObjectType } from "./configuration.svelte";
export declare abstract class BaseComponent {
    /** @public */
    abstract disabled: boolean;
    /**
     * Facilitates chaining
     *
     * @public
     */
    then(cb: (component: this) => any): this;
    /** @public */
    abstract setDisabled(disabled: boolean): this;
}
export declare abstract class ValueComponent<T> extends BaseComponent {
    metadata: Record<string, any>;
    /** @public */
    registerOptionListener(listeners: Record<string, (value?: T) => T>, key: string): this;
    /** @public */
    abstract getValue(): T;
    /** @public */
    abstract setValue(value: T): this;
    setMetadata(key: string, value: any): this;
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
export declare class ExtraButtonComponent extends BaseComponent {
    readonly containerEl: HTMLElement;
    private component;
    private text;
    private icon;
    constructor(containerEl: HTMLElement);
    get extraSettingsEl(): HTMLButtonElement;
    setTooltip(value: string, options?: TooltipOptions): this;
    setCta(): this;
    setVariant(variant: ButtonVariant): this;
    setSize(size: ButtonSize): void;
    setWarning(): this;
    removeCta(): this;
    setButtonText(name: string): this;
    setIcon(icon: string): this;
    setClass(cls: string): this;
    createChildren(): import("svelte").Snippet<[]>;
    onClick(onclick: (evt: MouseEvent) => any): this;
    get disabled(): boolean;
    setDisabled(disabled: boolean): this;
}
export declare class ButtonComponent extends BaseComponent {
    readonly containerEl: HTMLElement;
    private component;
    private text;
    private icon;
    constructor(containerEl: HTMLElement);
    get buttonEl(): HTMLButtonElement;
    setTooltip(value: string, options?: TooltipOptions): this;
    setCta(): this;
    setVariant(variant: ButtonVariant): this;
    setSize(size: ButtonSize): void;
    setWarning(): this;
    setButtonText(name: string): this;
    setIcon(icon: string): this;
    setClass(cls: string): this;
    createChildren(): import("svelte").Snippet<[]>;
    onClick(onclick: (evt: MouseEvent) => any): this;
    get disabled(): boolean;
    setDisabled(disabled: boolean): this;
}
export declare class ToggleComponent extends ValueComponent<boolean> {
    readonly containerEl: HTMLElement;
    private component;
    /** @public */
    constructor(containerEl: HTMLElement);
    get toggleEl(): HTMLElement;
    get disabled(): boolean;
    /** @public */
    setDisabled(disabled: boolean): this;
    /** @public */
    getValue(): boolean;
    /** @public */
    setValue(on: boolean): this;
    /** @public */
    setTooltip(tooltip: string, options?: TooltipOptions): this;
    /** @public */
    onClick(): void;
    /** @public */
    onChange(callback: (value: boolean) => any): this;
}
export declare class IconPickerComponent extends ValueComponent<string> {
    readonly containerEl: HTMLElement;
    private component;
    /** @public */
    constructor(containerEl: HTMLElement);
    setCta(): this;
    setVariant(variant: ButtonVariant): this;
    setSize(size: ButtonSize): void;
    setWarning(): this;
    /** @public */
    setDisabled(disabled: boolean): this;
    get disabled(): any;
    /** @public */
    getValue(): string;
    /** @public */
    setValue(value: string): this;
    setButtonText(name: string): this;
    setIcon(icon: string): this;
    /** @public */
    setTooltip(tooltip: string, options?: TooltipOptions): this;
    onChange(callback: (value: string) => any): this;
}
export declare class ProgressBarComponent extends ValueComponent<number> {
    readonly containerEl: HTMLElement;
    private component;
    /** @public */
    constructor(containerEl: HTMLElement);
    get toggleEl(): HTMLElement;
    get disabled(): any;
    /** @public */
    setDisabled(disabled: boolean): this;
    /** @public */
    getValue(): number;
    /** @public */
    setValue(value: number): this;
    /** @public */
    setTooltip(tooltip: string, options?: TooltipOptions): this;
}
export declare class SliderComponent extends ValueComponent<number | number[]> {
    readonly containerEl: HTMLElement;
    private component;
    /** @public */
    constructor(containerEl: HTMLElement);
    get sliderEl(): HTMLElement;
    get disabled(): boolean;
    /** @public */
    setDisabled(disabled: boolean): this;
    setDynamicTooltip(): this;
    setLimits(min: number, max: number, step: number): this;
    setType(type: "single" | "multiple"): this;
    /** @public */
    getValue(): number | number[];
    /** @public */
    setValue(value: number | number[]): this;
    onChange(callback: (value: number | number[]) => any): this;
}
export declare class Modal {
    readonly app: App;
    private component;
    readonly containerEl: HTMLElement | undefined;
    constructor(app: App);
    onOpenChange(open: boolean): void;
    onOpen(): void;
    onClose(): void;
    open(): void;
    close(): void;
    setTitle(title: string | DocumentFragment): this;
    setContent(content: string | DocumentFragment): this;
    get titleEl(): HTMLElement;
    get contentEl(): HTMLElement;
    get modalEl(): HTMLElement;
}
export declare class DropdownComponent extends ValueComponent<string | string[]> {
    readonly containerEl: HTMLElement;
    private component;
    /** @public */
    constructor(containerEl: HTMLElement);
    addOption(value: string, label: string): this;
    addOptions(options: Record<string, string>): this;
    get selectEl(): HTMLElement;
    get disabled(): boolean;
    /** @public */
    setDisabled(disabled: boolean): this;
    setType(type: "single" | "multiple"): this;
    /** @public */
    getValue(): string | string[];
    /** @public */
    setValue(value: string | string[]): this;
    onChange(callback: (value: string | string[]) => any): this;
}
export declare class AbstractTextComponent<T extends HTMLInputElement | HTMLTextAreaElement> extends ValueComponent<string> {
    protected component: MountComponent<any>;
    /** @public */
    constructor(component: MountComponent<any>);
    get inputEl(): T;
    get disabled(): boolean;
    /** @public */
    setDisabled(disabled: boolean): this;
    /** @public */
    getValue(): string;
    /** @public */
    setValue(value: string): this;
    /** @public */
    setPlaceholder(placeholder: string): this;
    /** @public */
    onChanged(): void;
    /** @public */
    onChange(callback: (value: string) => any): this;
}
export declare class TextComponent extends AbstractTextComponent<HTMLInputElement> {
    /** @public */
    constructor(containerEl: HTMLElement);
    setType(type: string): this;
}
export declare class TextAreaComponent extends AbstractTextComponent<HTMLTextAreaElement> {
    /** @public */
    constructor(containerEl: HTMLElement);
}
export declare class SearchComponent extends AbstractTextComponent<HTMLInputElement> {
    /** @public */
    constructor(containerEl: HTMLElement);
    get clearButtonEl(): HTMLElement;
    onChange(callback: (value: string) => any): this;
    onChanged(): void;
}
export declare class MomentFormatComponent extends TextComponent {
}
export declare class ListSettingComponent extends ValueComponent<unknown[]> {
    readonly containerEl: HTMLElement;
    private component;
    constructor(containerEl: HTMLElement);
    setItemType(type: "string" | "number" | "integer" | "boolean"): this;
    get disabled(): boolean;
    setDisabled(_disabled: boolean): this;
    getValue(): unknown[];
    setValue(value: unknown[]): this;
    onChange(callback: (value: unknown[]) => any): this;
}
export type ObjectMapOption = {
    value: string;
    label: string;
    disabled?: boolean;
};
export declare class ObjectGridSettingComponent extends ValueComponent<Record<string, unknown>> {
    readonly containerEl: HTMLElement;
    private component;
    constructor(containerEl: HTMLElement);
    setSchema(schema: ObjectType): this;
    get disabled(): boolean;
    setDisabled(_disabled: boolean): this;
    getValue(): Record<string, unknown>;
    setValue(value: Record<string, unknown>): this;
    onChange(callback: (value: Record<string, unknown>) => any): this;
}
export declare class ObjectMapSettingComponent extends ValueComponent<Record<string, unknown>> {
    readonly containerEl: HTMLElement;
    private component;
    constructor(containerEl: HTMLElement);
    setSchema(schema: ObjectType): this;
    setValueOptions(options: ObjectMapOption[]): this;
    get disabled(): boolean;
    setDisabled(_disabled: boolean): this;
    getValue(): Record<string, unknown>;
    setValue(value: Record<string, unknown>): this;
    onChange(callback: (value: Record<string, unknown>) => any): this;
}
export declare class DateSettingComponent extends ValueComponent<string> {
    readonly containerEl: HTMLElement;
    private component;
    constructor(containerEl: HTMLElement);
    setFormat(format: "date" | "time"): this;
    get disabled(): boolean;
    setDisabled(_disabled: boolean): this;
    getValue(): string;
    setValue(value: string): this;
    onChange(callback: (value: string) => any): this;
}
export declare abstract class SettingTab {
    readonly app: App;
    /**
     * Outermost HTML element on the setting tab.
     *
     * @public
     */
    containerEl: HTMLElement;
    constructor(app: App);
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
    hide(): void;
}
export declare abstract class PluginSettingTab extends SettingTab {
    readonly plugin: Plugin;
    /** @public */
    constructor(app: App, plugin: Plugin);
}
export type SettingItemSpec = {
    title: string | DocumentFragment;
    id: string;
    icon: string | null;
    disabled: boolean;
    tab?: SettingTab;
    parent?: SettingGroup;
};
export declare class SettingItem {
    private props;
    key: string;
    static create(props?: Partial<SettingItemSpec>): SettingItem;
    private constructor();
    update(): this;
    get title(): string | DocumentFragment;
    get icon(): string | null;
    get disabled(): boolean;
    get id(): string | DocumentFragment;
    get tab(): SettingTab | undefined;
    setTitle(title: string | DocumentFragment): this;
    setId(id: string): this;
    /**
     * @param icon - ID of the icon, can use any icon loaded with {@link addIcon}
     *   or from the built-in lucide library.
     * @public
     * @see The Obsidian icon library includes the {@link https://lucide.dev/ Lucide icon library}, any icon name from their site will work here.
     */
    setIcon(icon: string | null): this;
    setDisabled(disabled: boolean): this;
    setTab(tab: SettingTab): this;
}
export type SettingGroupSpec = {
    id: string;
    title: string | DocumentFragment;
    items: SettingItem[];
    parent?: AppSettings;
};
export declare class SettingGroup {
    items: SettingItem[];
    private props;
    key: string;
    static create(props?: Partial<SettingGroupSpec>): SettingGroup;
    private constructor();
    update(): this;
    get id(): string;
    get title(): string | DocumentFragment;
    setId(id: string): this;
    setTitle(title: string): this;
    addItem(cb: (item: SettingItem) => any): this;
    removeItem(id: string): this;
}
/**
 * Mutable registry of settings groups and items shown in the settings UI.
 *
 * @public
 */
export declare class AppSettings {
    readonly groups: SettingGroup[];
    key: string;
    constructor();
    addGroup(cb: (item: SettingGroup) => any): this;
    update(): this;
    find(id: string): SettingGroup | undefined;
    findItem(id: string): SettingItem | undefined;
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
export declare class ColorComponent extends AbstractTextComponent<HTMLInputElement> {
    /** @public */
    constructor(containerEl: HTMLElement);
    getValueRgb(): RGB;
    getValueHsl(): HSL;
    setValueRgb(rgb: RGB): this;
    /** @public */
    setValueHsl(hsl: HSL): this;
    private componentToHex;
    private rgbToHex;
    private hslToHex;
    private rgbToHsl;
}
export declare class Setting {
    readonly containerEl: HTMLElement;
    components: BaseComponent[];
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
    constructor(containerEl: HTMLElement);
    /**
     * Facilitates chaining
     *
     * @public
     */
    then(cb: (component: this) => any): this;
    setName(name: string | DocumentFragment): this;
    setVisibility(visible: boolean): void;
    setDesc(desc: string | DocumentFragment): this;
    setClass(cls: string): this;
    setTooltip(tooltip: string, options?: TooltipOptions): this;
    setDisabled(disabled: boolean): this;
    clear(): this;
    addComponent<T extends BaseComponent>(component: T): this;
    setHeading(): this;
    addButton(cb: (component: ButtonComponent) => any): this;
    addExtraButton(cb: (component: ExtraButtonComponent) => any): this;
    addToggle(cb: (component: ToggleComponent) => any): this;
    addText(cb: (component: TextComponent) => any): this;
    addSearch(cb: (component: SearchComponent) => any): this;
    addTextArea(cb: (component: TextAreaComponent) => any): this;
    addSlider(cb: (component: SliderComponent) => any): this;
    addProgressBar(cb: (component: ProgressBarComponent) => any): this;
    addColorPicker(cb: (component: ColorComponent) => any): this;
    addIconPicker(cb: (component: IconPickerComponent) => any): this;
    addDropdown(cb: (component: DropdownComponent) => any): this;
    addMomentFormat(cb: (component: MomentFormatComponent) => any): this;
    addList(cb: (component: ListSettingComponent) => any): this;
    addObjectGrid(cb: (component: ObjectGridSettingComponent) => any): this;
    addObjectMap(cb: (component: ObjectMapSettingComponent) => any): this;
    addDatePicker(cb: (component: DateSettingComponent) => any): this;
}
