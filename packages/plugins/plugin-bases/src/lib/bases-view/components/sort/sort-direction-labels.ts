import type { MetadataType } from "@lapis-notes/api";

export const sortDirectionLabels: Partial<
  Record<MetadataType, Array<{ label: string; value: "ASC" | "DESC" }>>
> = {
  unknown: [
    { label: "A → Z", value: "ASC" },
    { label: "Z → A", value: "DESC" },
  ],
  text: [
    { label: "A → Z", value: "ASC" },
    { label: "Z → A", value: "DESC" },
  ],
  date: [
    { label: "Old to new", value: "ASC" },
    { label: "New to old", value: "DESC" },
  ],
  datetime: [
    { label: "Old to new", value: "ASC" },
    { label: "New to old", value: "DESC" },
  ],
  number: [
    { label: "0 → 1", value: "ASC" },
    { label: "1 → 0", value: "DESC" },
  ],
};

export function getSortDirectionLabels(type: MetadataType | undefined) {
  return (
    sortDirectionLabels[type ?? "unknown"] ?? sortDirectionLabels.unknown ?? []
  );
}
