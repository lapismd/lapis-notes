/**
 * Shared Tailwind utility detection for app / shadcn native-CSS gates.
 */
export type TailwindFinding = {
  file: string;
  line: number;
  token: string;
};

export function lineAt(source: string, offset: number): number {
  return source.slice(0, offset).split("\n").length;
}

export function stringLiterals(
  source: string,
): Array<{ value: string; offset: number }> {
  const values: Array<{ value: string; offset: number }> = [];
  const literal = /(["'])(?:\\.|(?!\1)[^\\])*\1/g;
  for (const match of source.matchAll(literal)) {
    const value = match[0]!.slice(1, -1);
    values.push({ value, offset: match.index ?? 0 });
  }
  return values;
}

export function classValues(
  source: string,
): Array<{ value: string; offset: number }> {
  const values: Array<{ value: string; offset: number }> = [];

  for (const match of source.matchAll(
    /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
  )) {
    values.push({
      value: match[1] ?? match[2] ?? "",
      offset: match.index ?? 0,
    });
  }

  for (const match of source.matchAll(/\bclass\s*=\s*\{([\s\S]{0,1500}?)\}/g)) {
    const expression = match[1] ?? "";
    const expressionOffset = (match.index ?? 0) + match[0]!.indexOf(expression);
    for (const literal of stringLiterals(expression)) {
      values.push({
        value: literal.value,
        offset: expressionOffset + literal.offset,
      });
    }
  }

  for (const match of source.matchAll(
    /\bclass\s*:\s*cn\(([\s\S]{0,1500}?)\)/g,
  )) {
    const expression = match[1] ?? "";
    const expressionOffset = (match.index ?? 0) + match[0]!.indexOf(expression);
    for (const literal of stringLiterals(expression)) {
      values.push({
        value: literal.value,
        offset: expressionOffset + literal.offset,
      });
    }
  }

  for (const match of source.matchAll(/\bclass:([A-Za-z0-9_[\]:/-]+)/g)) {
    values.push({ value: match[1]!, offset: match.index ?? 0 });
  }

  return values;
}

function stripVariants(token: string): string {
  const lastVariant = token.lastIndexOf(":");
  return lastVariant >= 0 ? token.slice(lastVariant + 1) : token;
}

/** True for Tailwind utility candidates (layout/paint). Marker cn-* classes are allowed. */
export function isTailwindUtility(token: string): boolean {
  if (/^cn-[a-z0-9-]+$/i.test(token)) return false;
  const candidate = stripVariants(token.replace(/^!/, ""));
  // Intentional a11y helpers kept as class names across shadcn families.
  if (candidate === "sr-only" || candidate === "not-sr-only") return false;
  if (
    /^(?:flex|inline-flex|grid|block|inline-block|inline|hidden|contents|table|table-row|table-cell|group|peer|container)$/.test(
      candidate,
    )
  ) {
    return true;
  }

  return /^(?:flex|grid|col|row|order|grow|shrink|basis|items|justify|content|self|place|gap|space|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|ms|me|w|h|min-w|max-w|min-h|max-h|size|bg|text|border|rounded|shadow|ring|outline|font|leading|tracking|whitespace|break|truncate|overflow|object|aspect|opacity|cursor|pointer-events|select|transition|duration|delay|ease|animate|absolute|relative|fixed|sticky|static|inset|top|right|bottom|left|start|end|z|visible|invisible|columns|divide|underline|decoration|uppercase|lowercase|capitalize|italic|not-italic|list|align|justify|peer-|group-)-/.test(
    candidate,
  );
}

export function findTailwindUtilitiesInSource(
  source: string,
  relativeFile: string,
): TailwindFinding[] {
  const findings: TailwindFinding[] = [];

  if (
    /from\s+["']tailwind-variants["']/.test(source) ||
    /\btv\s*\(/.test(source)
  ) {
    findings.push({
      file: relativeFile,
      line: 1,
      token: "tailwind-variants",
    });
  }

  for (const classValue of classValues(source)) {
    for (const token of classValue.value.split(/\s+/).filter(Boolean)) {
      if (isTailwindUtility(token)) {
        findings.push({
          file: relativeFile,
          line: lineAt(source, classValue.offset),
          token,
        });
      }
    }
  }

  return findings;
}
