import type { ContextKeyService } from "./context-keys.svelte";

export type StatusBarAlignment = "left" | "right";

export interface StatusBarItemDescriptor {
  id: string;
  text?: string;
  icon?: string;
  spin?: boolean;
  tooltip?: string;
  command?: string;
  when?: string;
  alignment?: StatusBarAlignment;
  priority?: number;
  sourcePlugin?: string;
}

interface RegisteredStatusBarItem extends StatusBarItemDescriptor {
  sequence: number;
}

export class StatusBarManager {
  #sequence = 0;
  readonly items: Record<string, RegisteredStatusBarItem> = $state({});

  registerItem(item: StatusBarItemDescriptor): () => void {
    this.upsertItem(item);
    return () => {
      delete this.items[item.id];
    };
  }

  upsertItem(item: StatusBarItemDescriptor): void {
    const existing = this.items[item.id];
    this.items[item.id] = {
      alignment: "right",
      priority: 0,
      ...existing,
      ...item,
      sequence: existing?.sequence ?? this.#sequence++,
    };
  }

  unregisterItem(id: string): void {
    delete this.items[id];
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
