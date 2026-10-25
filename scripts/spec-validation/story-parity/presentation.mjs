/** Inspect fixture-owned styles only; public package styles remain authoritative. */
export function presentationOverrides(file, current, source, read) {
  const styles = [[file, current.ast.css?.content.styles ?? ""]];
  const seen = new Set();
  function stylesheet(owner, path) {
    if (!path.startsWith(".")) return;
    const target = source.target(owner, path);
    if (!target || seen.has(target)) return;
    seen.add(target);
    const css = read(target);
    if (css === null) throw Error(`Missing fixture stylesheet ${target}`);
    styles.push([target, css]);
    for (const match of css.matchAll(/@import\s+["']([^"']+)["']/g))
      stylesheet(target, match[1]);
  }
  for (const script of [current.ast.module, current.ast.instance])
    for (const node of script?.content.body ?? [])
      if (
        node.type === "ImportDeclaration" &&
        node.source.value.endsWith(".css")
      )
        stylesheet(file, node.source.value);
  const overrides =
    /(?:\.(?:cm-|markdown-|ui-(?:transcript|composer|workspace-(?:tabs|toolbar|sidebar)))[\w-]*|data-ui-part\s*=)[^{]*\{[^}]*\b(?:padding|margin|width|height|display|background|color|transform|font|border)(?:-[a-z-]+)?\s*:/s;
  return styles
    .filter(([, css]) => overrides.test(css))
    .map(
      ([path]) => `${path}: fixture styles override production presentation.`,
    );
}

export function containsShell(fragment, imports, inspect) {
  for (const node of fragment?.nodes ?? []) {
    if (node.type === "Component") {
      const [name, member] = node.name.split("."),
        imported = imports.get(name);
      const ref = imported && member ? { ...imported, name: member } : imported;
      if (ref && inspect(ref)) return true;
    }
    for (const key of [
      "fragment",
      "consequent",
      "alternate",
      "body",
      "fallback",
    ])
      if (containsShell(node[key], imports, inspect)) return true;
  }
  return false;
}
