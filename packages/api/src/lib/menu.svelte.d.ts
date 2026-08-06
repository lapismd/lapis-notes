import { type MountComponent } from "$lib/hooks/mountComponent.svelte";
declare const MENU_ITEM_TAG: unique symbol;
export declare class MenuItem {
    readonly menu: Menu;
    readonly [MENU_ITEM_TAG] = true;
    private props;
    get section(): string;
    get title(): string | DocumentFragment;
    get icon(): string | null;
    get checked(): boolean | null;
    get disabled(): boolean;
    get isLabel(): boolean;
    click(evt: MouseEvent | KeyboardEvent): any;
    static create(menu: Menu): MenuItem;
    /**
     * Private constructor. Use {@link addItem} instead.
     *
     * @public
     */
    private constructor();
    /** @public */
    setTitle(title: string | DocumentFragment): this;
    /**
     * @param icon - ID of the icon, can use any icon loaded with {@link addIcon}
     *   or from the built-in lucide library.
     * @public
     * @see The Obsidian icon library includes the {@link https://lucide.dev/ Lucide icon library}, any icon name from their site will work here.
     */
    setIcon(icon: string | null): this;
    /** @public */
    setChecked(checked: boolean | null): this;
    /** @public */
    setDisabled(disabled: boolean): this;
    setWarning(warning?: boolean): this;
    /** @public */
    setIsLabel(isLabel: boolean): this;
    /** @public */
    onClick(callback: (evt: MouseEvent | KeyboardEvent) => any): this;
    /**
     * Sets the section this menu item should belong in. To find the section IDs
     * of an existing menu, inspect the DOM elements to see their `data-section`
     * attribute.
     *
     * @public
     */
    setSection(section: string): this;
}
export declare function isMenuItem(value: unknown): value is MenuItem;
export interface MenuPositionDef {
    /** @public */
    x: number;
    /** @public */
    y: number;
    /** @public */
    width?: number;
    /** @public */
    overlap?: boolean;
    /** @public */
    left?: boolean;
}
export declare class MenuSeparator {
    readonly section: string;
    constructor(section?: string);
}
type Separator = "separator";
type MenuEntry = MenuItem | Separator | Menu;
export declare class Menu {
    component: MountComponent<any> | null;
    open: boolean;
    filter: string;
    private lastSection;
    private readonly props;
    get noIcon(): boolean;
    get useNativeMenu(): boolean;
    get items(): Record<string, MenuEntry[]>;
    get renderedItems(): Record<string, ("separator" | MenuItem | Menu)[]>;
    get filteredItems(): Record<string, ("separator" | MenuItem | Menu)[]>;
    get title(): string;
    get section(): string;
    popover(): this;
    dropdown(): this;
    search(value: string): this;
    clear(): this;
    /** @public */
    constructor();
    /** @public */
    setNoIcon(): this;
    setTitle(title: string): this;
    setSection(section: string): this;
    /**
     * Force this menu to use native or DOM. (Only works on the desktop app)
     *
     * @public
     */
    setUseNativeMenu(useNativeMenu: boolean): this;
    /**
     * Adds a menu item. Only works when menu is not shown yet.
     *
     * @public
     */
    addItem(cb: (item: MenuItem) => any): this;
    addMenu(cb: (item: Menu) => any): this;
    addGroups(...groups: Array<string | Array<string>>): this;
    /**
     * Adds a separator. Only works when menu is not shown yet.
     *
     * @public
     */
    addSeparator(section?: string): this;
    /** @public */
    hide(): this;
    /** @public */
    close(): void;
    /** @public */
    onHide(callback: () => any): void;
    showAtElement(target?: HTMLElement | null): this;
    showAtMouseEvent(evt: Event): this;
    forEvent(evt: Event): this;
    showAtPosition(position: MenuPositionDef, doc?: Document): this;
}
export {};
