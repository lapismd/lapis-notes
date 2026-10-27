/** Reject executable/external content before a host displays plugin SVG markup. */
export function assertSafeIconSvg(svg: string): void {
  const tags = new Set([
    "svg",
    "g",
    "path",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "defs",
    "lineargradient",
    "radialgradient",
    "stop",
    "clippath",
    "mask",
    "pattern",
    "symbol",
    "use",
    "title",
    "desc",
  ]);
  if (/xml:base\s*=|<!|<\?|&#|\\|javascript\s*:|data\s*:/iu.test(svg))
    throw new Error("Unsafe icon SVG.");
  for (const match of svg.matchAll(/<\/?\s*([\w:-]+)/gu)) {
    if (!tags.has(match[1].toLowerCase()))
      throw new Error("Unsupported icon SVG element.");
  }
  if (
    /\s(?:on[\w:-]+)\s*=/iu.test(svg) ||
    /@import|expression\s*\(/iu.test(svg)
  )
    throw new Error("Executable icon SVG.");
  for (const match of svg.matchAll(
    /(?:\b(?:xlink:)?href\s*=\s*)(["'])(.*?)\1/giu,
  )) {
    if (!/^#[\w:.-]+$/u.test(match[2]))
      throw new Error("External icon SVG reference.");
  }
  if (/\b(?:xlink:)?href\s*=\s*[^\s"']/iu.test(svg))
    throw new Error("Unquoted icon SVG reference.");
  for (const match of svg.matchAll(/url\s*\((.*?)\)/giu)) {
    if (!/^\s*["']?#[\w:.-]+["']?\s*$/u.test(match[1]))
      throw new Error("External icon SVG URL.");
  }
}
