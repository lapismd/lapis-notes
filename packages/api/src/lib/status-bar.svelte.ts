import type { ContextKeyService } from "./context-keys.svelte";
import type { Menu } from "./menu.svelte";

export type StatusBarAlignment = "left" | "right";

export interface StatusBarItemDescriptor {
  id: string;
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

function sameSegments(
  left: string[] | undefined,
  right: string[] | undefined,
): boolean {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function sameVisibleStatusBarItem(
  left: RegisteredStatusBarItem,
  right: RegisteredStatusBarItem,
): boolean {
  return (
    left.id === right.id &&
    left.text === right.text &&
    sameSegments(left.segments, right.segments) &&
    left.icon === right.icon &&
    left.spin === right.spin &&
    left.tooltip === right.tooltip &&
    left.command === right.command &&
    left.when === right.when &&
    (left.alignment ?? "right") === (right.alignment ?? "right") &&
    (left.priority ?? 0) === (right.priority ?? 0) &&
    left.sourcePlugin === right.sourcePlugin
  );
}

export class StatusBarManager {
  #sequence = 0;
  readonly #listeners = new Set<() => void>();
  readonly items: Record<string, RegisteredStatusBarItem> = $state({});

  registerItem(item: StatusBarItemDescriptor): () => void {
    this.upsertItem(item);
    return () => {
      delete this.items[item.id];
      this.notify();
    };
  }

  upsertItem(item: StatusBarItemDescriptor): void {
    const existing = this.items[item.id];
    const next: RegisteredStatusBarItem = {
      alignment: "right",
      priority: 0,
      ...existing,
      ...item,
      sequence: existing?.sequence ?? this.#sequence++,
    };
    if (existing && sameVisibleStatusBarItem(existing, next)) {
      return;
    }
    this.items[item.id] = next;
    this.notify();
  }

  unregisterItem(id: string): void {
    if (this.items[id]) {
      delete this.items[id];
      this.notify();
    }
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    listener();
    return () => this.#listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.#listeners) listener();
  }

  getVisibleItems(
    alignment: StatusBarAlignment,
    contextKeys: ContextKeyService,
  ): StatusBarItemDescriptor[] {
    return Object.values(this.items)
      .filter(
        (item) =>
          (item.alignment ?? "right") === alignment &&
          contextKeys.evaluate(item.when),
      )
      .sort((left, right) => {
        const priority = (left.priority ?? 0) - (right.priority ?? 0);
        return priority !== 0 ? priority : left.sequence - right.sequence;
      })
      .map(({ sequence: _sequence, ...item }) => item);
  }
}
