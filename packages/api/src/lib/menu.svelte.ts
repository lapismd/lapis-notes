/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  mountComponent,
  type MountComponent,
} from "$lib/hooks/mountComponent.svelte";
import MenuComponent from "$lib/components/menu/menu.svelte";
import { fuzzyMatchScore } from "@lapis-notes/ui";
import { trimMenuEdgeSeparators } from "./menu-utils";

type MenuItemSpec = {
  section: string;
  title: string | DocumentFragment;
  icon: string | null;
  checked: boolean | null;
  disabled: boolean;
  isLabel: boolean;
  onClick: (evt: MouseEvent | KeyboardEvent) => any;
};

const MENU_ITEM_TAG = Symbol.for("@lapis-notes/menu-item");

export class MenuItem {
  readonly [MENU_ITEM_TAG] = true;

  private props: MenuItemSpec = $state({
    section: "default",
    title: "",
    icon: "",
    checked: null,
    disabled: false,
    isLabel: false,
    onClick: () => {
      this.menu.setOpen(false);
    },
  });

  get section() {
    return this.props.section;
  }

  get title() {
    return this.props.title;
  }

  get icon() {
    return this.props.icon;
  }

  get checked() {
    return this.props.checked;
  }

  get disabled() {
    return this.props.disabled;
  }

  get isLabel() {
    return this.props.isLabel;
  }

  click(evt: MouseEvent | KeyboardEvent) {
    return this.props.onClick(evt);
  }

  static create(menu: Menu) {
    return new MenuItem(menu);
  }

  /**
   * Private constructor. Use {@link addItem} instead.
   *
   * @public
   */
  private constructor(readonly menu: Menu) {}

  /** @public */
  setTitle(title: string | DocumentFragment): this {
    this.props.title = title;
    return this;
  }
  /**
   * @param icon - ID of the icon, can use any icon loaded with {@link addIcon}
   *   or from the built-in lucide library.
   * @public
   * @see The Obsidian icon library includes the {@link https://lucide.dev/ Lucide icon library}, any icon name from their site will work here.
   */
  setIcon(icon: string | null): this {
    this.props.icon = icon;
    return this;
  }

  /** @public */
  setChecked(checked: boolean | null): this {
    this.props.checked = checked;
    return this;
  }
  /** @public */
  setDisabled(disabled: boolean): this {
    this.props.disabled = disabled;
    return this;
  }

  setWarning(warning: boolean = true): this {
    return this.setSection(warning ? "danger" : this.section);
  }

  /** @public */
  setIsLabel(isLabel: boolean): this {
    this.props.isLabel = isLabel;
    return this;
  }

  /** @public */
  onClick(callback: (evt: MouseEvent | KeyboardEvent) => any): this {
    this.props.onClick = (evt) => {
      callback(evt);
      this.menu.setOpen(false);
    };
    return this;
  }

  /**
   * Sets the section this menu item should belong in. To find the section IDs
   * of an existing menu, inspect the DOM elements to see their `data-section`
   * attribute.
   *
   * @public
   */
  setSection(section: string): this {
    this.props.section = section;
    return this;
  }
}

export function isMenuItem(value: unknown): value is MenuItem {
  return Boolean(value && typeof value === "object" && MENU_ITEM_TAG in value);
}

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

export class MenuSeparator {
  constructor(readonly section: string = "default") {}
}

type Separator = "separator";

type MenuEntry = MenuItem | Separator | Menu;

type MenuSpec = {
  noIcon: boolean;
  section: string;
  type: "context-menu" | "popover" | "dropdown-menu";
  useNativeMenu: boolean;
  items: Record<string, Array<MenuEntry>>;
  onHide: () => void;
  title: string;
};

export class Menu {
  component: MountComponent<any> | null = null;
  open: boolean = $state(false);
  filter: string = $state("");
  private lastSection: string = "default";

  private readonly props: MenuSpec = {
    noIcon: false,
    section: "default",
    type: "context-menu",
    useNativeMenu: false,
    items: {},
    title: "",
    onHide: () => {},
  };

  get noIcon() {
    return this.props.noIcon;
  }

  get useNativeMenu() {
    return this.props.useNativeMenu;
  }

  get items() {
    return this.props.items ?? {};
  }

  get renderedItems() {
    return trimMenuEdgeSeparators(this.items);
  }

  get filteredItems() {
    const data: Record<string, Array<MenuEntry>> = {};
    for (const [id, values] of Object.entries(this.items)) {
      const items = values
        .map((item) => {
          let score = 1;
          if (isMenuItem(item) && typeof item.title === "string") {
            score = fuzzyMatchScore(item.title, this.filter, []);
          }
          return { item, score };
        })
        .filter((i) => i.score > 0)
        .map((i) => i.item);
      if (items.length) {
        data[id] = items;
      }
    }
    return trimMenuEdgeSeparators(data);
  }

  get title() {
    return this.props.title;
  }

  get section() {
    return this.props.section;
  }

  popover(): this {
    this.props.type = "popover";
    return this;
  }

  dropdown(): this {
    this.props.type = "dropdown-menu";
    return this;
  }

  search(value: string): this {
    this.filter = value;
    return this;
  }

  clear(): this {
    this.props.items = {};
    return this;
  }

  /** @public */
  constructor() {}

  /** @public */
  setNoIcon(): this {
    this.props.noIcon = true;
    return this;
  }

  setTitle(title: string): this {
    this.props.title = title;
    return this;
  }

  setSection(section: string): this {
    this.props.section = section;
    return this;
  }

  /**
   * Force this menu to use native or DOM. (Only works on the desktop app)
   *
   * @public
   */
  setUseNativeMenu(useNativeMenu: boolean): this {
    this.props.useNativeMenu = useNativeMenu;
    return this;
  }

  setOpen(open: boolean): this {
    const wasOpen = this.open;
    this.open = open;
    if (wasOpen && !open) {
      this.props.onHide();
    }
    return this;
  }

  /**
   * Adds a menu item. Only works when menu is not shown yet.
   *
   * @public
   */
  addItem(cb: (item: MenuItem) => any): this {
    const item = MenuItem.create(this);
    cb(item);
    this.lastSection = item.section;
    this.props.items[item.section] ||= [];
    this.props.items[item.section].push(item);
    return this;
  }

  addMenu(cb: (item: Menu) => any): this {
    const item = new Menu();
    cb(item);
    this.lastSection = item.section;
    this.props.items[item.section] ||= [];
    this.props.items[item.section].push(item);
    return this;
  }

  addGroups(...groups: Array<string | Array<string>>): this {
    groups.flat().forEach((group) => (this.props.items[group] ||= []));
    return this;
  }

  /**
   * Adds a separator. Only works when menu is not shown yet.
   *
   * @public
   */
  addSeparator(section?: string): this {
    const items = this.props.items[section ?? this.lastSection];
    if (!items.length || items[items.length - 1] === "separator") return this;
    items.push("separator");
    return this;
  }

  /** @public */
  hide(): this {
    return this.setOpen(false);
  }

  /** @public */
  close(): void {
    this.setOpen(false);
  }

  /** @public */
  onHide(callback: () => any): void {
    this.props.onHide = callback;
  }

  showAtElement(target?: HTMLElement | null): this {
    if (target) {
      if (this.component && this.component.target === target) {
        this.component.props.menu = this;
        this.setOpen(true);
      } else {
        this.setOpen(true);
        this.component?.destroy();
        this.component = mountComponent(MenuComponent, {
          target,
          props: {
            anchor: target,
            type: this.props.type,
            menu: this,
          },
        });
      }
    }
    return this;
  }

  showAtMouseEvent(evt: Event): this {
    const target = evt.target as HTMLElement;
    return this.showAtElement(target);
  }

  forEvent(evt: Event): this {
    return this.showAtMouseEvent(evt);
  }

  showAtPosition(position: MenuPositionDef, doc?: Document): this {
    const target = (doc ?? document).elementFromPoint(position.x, position.y);
    return this.showAtElement(target as HTMLElement);
  }
}
