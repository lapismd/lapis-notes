/** @typedef {{path: string, title: string, id: string, label: string, depth: number, parents: string[]}} SpecificationChapter */
/** SUMMARY is the authoring source for both docs hosts and their checks.
 * @param {string} summary
 * @returns {SpecificationChapter[]}
 */
export function specificationChapters(summary) {
  /** @type {SpecificationChapter[]} */
  const chapters = [];
  /** @type {SpecificationChapter[]} */
  const stack = [];
  const paths = new Set();
  const ids = new Set();
  for (const line of summary.split(/\r?\n/)) {
    const match = /^(\s*)- \[([^\]]+)\]\((?:\.\/)?([^\s)#]+\.md)\)/.exec(line);
    if (!match) continue;
    const depth = match[1].length / 2;
    const path = match[3];
    const title = `Specification/${match[2].replaceAll(" / ", "/")}`;
    const id = `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}--docs`;
    if (paths.has(path) || ids.has(id))
      throw new Error(
        `Duplicate specification chapter or route: ${path} (${id})`,
      );
    if (path.startsWith("/") || path.split("/").includes(".."))
      throw new Error(`Unsafe chapter path: ${path}`);
    paths.add(path);
    ids.add(id);
    while (stack.length && stack.at(-1).depth >= depth) stack.pop();
    const chapter = {
      path,
      title,
      id,
      label: title.split("/").at(-1),
      depth,
      parents: stack.map(({ id }) => id),
    };
    chapters.push(chapter);
    stack.push(chapter);
  }
  return chapters;
}

export function docsHref(id, fragment = "", previewUrl) {
  const base = new URL(".", previewUrl);
  base.searchParams.set("path", `/docs/${id}`);
  base.hash = fragment;
  return base.href;
}

/** Resolve source-relative links before converting them to manager routes. */
export function canonicalLink(
  href,
  chapter,
  chapters,
  relocations,
  previewUrl,
) {
  if (!href || /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(href)) return href;
  const source = new URL(href, `https://canonical.invalid/${chapter.path}`);
  const path = decodeURIComponent(source.pathname.slice(1));
  const fragment = decodeURIComponent(source.hash.slice(1));
  const moved = relocations[`${path}#${fragment}`];
  const destination = moved?.path ?? path;
  const anchor = moved?.fragment ?? fragment;
  const target = chapters.find((entry) => entry.path === destination);
  if (!target) return href;
  if (target.path === chapter.path && href.startsWith("#") && !moved)
    return href;
  return docsHref(target.id, anchor, previewUrl);
}
