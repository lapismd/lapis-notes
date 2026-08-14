type VirtualRowLike = {
  index: number;
};

type KeyedDisplayItem = {
  key: string;
};

export type VisibleVirtualRow<TItem extends KeyedDisplayItem> = {
  virtualRow: VirtualRowLike;
  item: TItem;
};

export function resolveVisibleVirtualRows<TItem extends KeyedDisplayItem>(
  virtualRows: VirtualRowLike[],
  displayItems: TItem[],
): Array<VisibleVirtualRow<TItem>> {
  if (!displayItems.length) {
    return [];
  }

  return virtualRows.flatMap((virtualRow) => {
    const item = displayItems[virtualRow.index];
    return item ? [{ virtualRow, item }] : [];
  });
}

export function resolveVirtualTotalSize(
  displayItemCount: number,
  totalSize: number,
): number {
  return displayItemCount ? totalSize : 0;
}
