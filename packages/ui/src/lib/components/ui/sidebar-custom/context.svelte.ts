import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
import { getContext, setContext } from "svelte";
import {
  SIDEBAR_KEYBOARD_SHORTCUT,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
} from "$lib/components/ui/sidebar-custom/constants.js";

type Getter<T> = () => T;

export type SidebarStateProps = {
  /**
   * A getter function that returns the current open state of the sidebar. We
   * use a getter function here to support `bind:open` on the `Sidebar.Provider`
   * component.
   */
  open: Getter<boolean>;

  /**
   * A function that sets the open state of the sidebar. To support `bind:open`,
   * we need a source of truth for changing the open state to ensure it will be
   * synced throughout the sub-components and any `bind:` references.
   */
  setOpen: (open: boolean) => void;

  id: string;
  collapsedSize?: string;
  initialWidth?: string;
};

export class SidebarState {
  readonly props: SidebarStateProps;
  open = $derived.by(() => this.props.open());
  openMobile = $state(false);
  isDraggingRail = $state(false);
  width = $state(SIDEBAR_WIDTH);
  setOpen: SidebarStateProps["setOpen"];
  #isMobile: IsMobile;
  state = $derived.by(() => (this.open ? "expanded" : "collapsed"));
  size = $derived.by(() => {
    if (this.isMobile) {
      return "0 px";
    } else if (!this.open) {
      return this.props.collapsedSize ?? SIDEBAR_WIDTH_ICON;
    }
    return this.width;
  });

  constructor(props: SidebarStateProps) {
    this.setOpen = props.setOpen;
    this.#isMobile = new IsMobile();
    this.props = props;
    this.width = this.props.initialWidth ?? SIDEBAR_WIDTH;
  }

  // Convenience getter for checking if the sidebar is mobile
  // without this, we would need to use `sidebar.isMobile.current` everywhere
  get isMobile() {
    return this.#isMobile.current;
  }

  // Event handler to apply to the `<svelte:window>`
  handleShortcutKeydown = (e: KeyboardEvent) => {
    if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.toggle();
    }
  };

  setOpenMobile = (value: boolean) => {
    this.openMobile = value;
  };

  toggle = () => {
    return this.#isMobile.current
      ? (this.openMobile = !this.openMobile)
      : this.setOpen(!this.open);
  };
}

const SYMBOL_KEY = "scn-sidebar";

/**
 * Instantiates a new `SidebarState` instance and sets it in the context.
 *
 * @param props The constructor props for the `SidebarState` class.
 * @returns The `SidebarState` instance.
 */
export function setSidebar(
  props: SidebarStateProps | SidebarState,
): SidebarState {
  const sidebar =
    props instanceof SidebarState ? props : new SidebarState(props);
  return setContext(Symbol.for(SYMBOL_KEY), sidebar);
}

/**
 * Retrieves the `SidebarState` instance from the context. This is a class
 * instance, so you cannot destructure it.
 *
 * @returns The `SidebarState` instance.
 */
export function useSidebar(): SidebarState {
  return getContext(Symbol.for(SYMBOL_KEY));
}
