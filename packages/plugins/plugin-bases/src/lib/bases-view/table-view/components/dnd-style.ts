type StyleValue = string | number | null | undefined | false;

export function styleObjectToString(
  styles: Record<string, StyleValue>,
): string {
  return Object.entries(styles)
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== false,
    )
    .map(([property, value]) => `${property}: ${String(value)};`)
    .join(" ");
}
