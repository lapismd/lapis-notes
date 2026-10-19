import type { ContextKeyService } from "./context-keys.svelte";
import type { Menu } from "./menu.svelte";
export type StatusBarAlignment = "left" | "center" | "right";
export interface StatusBarItemDescriptor {
  id: string;
  mount?: (host: HTMLElement) => () => void;
  text?: string;
  segments?: string[];
  icon?: string;
  spin?: boolean;
  tooltip?: string;
  command?: string;
  buildMenu?: (menu: Menu) => void;
  when?: string;
  alignment?: StatusBarAlignment;
  priority?: number;
  sourcePlugin?: string;
}
interface RegisteredStatusBarItem extends StatusBarItemDescriptor {
  sequence: number;
}
export declare class StatusBarManager {
  #private;
  readonly items: Record<string, RegisteredStatusBarItem>;
  registerItem(item: StatusBarItemDescriptor): () => void;
  upsertItem(item: StatusBarItemDescriptor): void;
  unregisterItem(id: string): void;
  subscribe(listener: () => void): () => void;
  private notify;
  getVisibleItems(
    alignment: StatusBarAlignment,
    contextKeys: ContextKeyService,
  ): StatusBarItemDescriptor[];
}
export {};
