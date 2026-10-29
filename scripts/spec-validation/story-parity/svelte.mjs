import { presentationOverrides, containsShell } from "./presentation.mjs";
import { parse } from "svelte/compiler";
import { unknown } from "./syntax.mjs";

export function literal(node, env = {}) {
  if (!node) return unknown;
  if (node.type === "Literal") return node.value;
  if (node.type === "Identifier")
    return Object.hasOwn(env, node.name) ? env[node.name] : unknown;
  if (node.type === "LogicalExpression") {
    const a = literal(node.left, env);
    if (a === unknown) return unknown;
    if (node.operator === "||") return a || literal(node.right, env);
    if (node.operator === "&&") return a && literal(node.right, env);
    if (node.operator === "??") return a ?? literal(node.right, env);
  }
  if (node.type === "UnaryExpression" && node.operator === "!") {
    const value = literal(node.argument, env);
    return value === unknown ? unknown : !value;
  }
  if (node.type === "BinaryExpression") {
    const a = literal(node.left, env),
      b = literal(node.right, env);
    if (a === unknown || b === unknown) return unknown;
    if (["===", "=="].includes(node.operator)) return a === b;
    if (["!==", "!="].includes(node.operator)) return a !== b;
  }
  return unknown;
}
function attribute(node, name, env) {
  const attr = node.attributes?.find(
    (a) => a.type === "Attribute" && a.name === name,
  );
  if (!attr) return undefined;
  if (attr.value === true) return true;
  if (Array.isArray(attr.value)) {
    if (attr.value.length === 1 && attr.value[0].type === "Text")
      return attr.value[0].data;
    if (attr.value.length === 1 && attr.value[0].expression)
      return literal(attr.value[0].expression, env);
    return unknown;
  }
  return literal(attr.value?.expression, env);
}
const componentMatches = (ref, subject) =>
  ref && subject === `${ref.path}#${ref.name}`;
export function compositionModel(source, read, options = {}) {
  const cache = new Map();
  const shell = options.shell ?? "@lapis-notes/workspace#WorkspaceShell";
  const controlsPath = "stories/catalog/FixtureControls.svelte";
  function model(file) {
    if (cache.has(file)) return cache.get(file);
    const text = read(file);
    if (text === null) throw Error(`Missing component ${file}`);
    const ast = parse(text, { modern: true, filename: file }),
      imports = new Map(),
      defaults = {};
    for (const script of [ast.module, ast.instance])
      for (const node of script?.content.body ?? []) {
        if (node.type === "ImportDeclaration")
          for (const binding of node.specifiers)
            imports.set(binding.local.name, {
              kind: "reference",
              path: source.target(file, node.source.value),
              name:
                binding.imported?.name ??
                (binding.type === "ImportNamespaceSpecifier" ? "*" : "default"),
            });
        if (node.type === "VariableDeclaration")
          for (const declaration of node.declarations)
            if (
              declaration.id.type === "ObjectPattern" &&
              declaration.init?.callee?.name === "$props"
            )
              for (const p of declaration.id.properties)
                if (p.key?.name)
                  defaults[p.key.name] =
                    p.value.type === "AssignmentPattern"
                      ? literal(p.value.right)
                      : unknown;
      }
    const result = { ast, imports, defaults, text };
    cache.set(file, result);
    return result;
  }
  function inspect(ref, props, kind, subject, chain = []) {
    if (!ref || ref === unknown)
      return { reaches: false, errors: ["Unresolved rendered component."] };
    if (kind === "application" && componentMatches(ref, shell))
      return { reaches: true, roots: 1, errors: [] };
    if (kind === "component" && componentMatches(ref, subject))
      return { reaches: true, errors: [] };
    if (ref.path === controlsPath) return { reaches: false, errors: [] };
    if (!ref.path?.startsWith("stories/") || !ref.path.endsWith(".svelte"))
      return {
        reaches: false,
        errors:
          kind === "application"
            ? [
                `Rendered ${ref.path}#${ref.name} replaces application presentation; use FixtureControls for synthetic actions.`,
              ]
            : [],
      };
    if (chain.includes(ref.path))
      return { reaches: false, errors: ["Cyclic fixture composition."] };
    const current = model(ref.path),
      env = { ...current.defaults, ...props },
      errors = [];
    if (kind === "application")
      errors.push(...presentationOverrides(ref.path, current, source, read));
    function nodes(fragment, technical = false, lifecycleContext = false) {
      let roots = 0;
      for (const node of fragment?.nodes ?? []) {
        if (node.type === "IfBlock") {
          const condition = literal(node.test, env);
          if (condition !== unknown)
            roots += nodes(
              condition ? node.consequent : node.alternate,
              technical,
              lifecycleContext,
            );
          else {
            const expression = current.text.slice(
              node.test.start,
              node.test.end,
            );
            const setup = (fragment) =>
              fragment?.nodes?.some(
                (n) =>
                  (n.type === "Component" &&
                    current.imports.get(n.name)?.path === controlsPath) ||
                  ["status", "alert"].includes(attribute(n, "role", env)),
              );
            const lifecycle =
              setup(node.consequent) ||
              setup(node.alternate) ||
              /\b(?:app|ready|error|failure|failed|status|booting)\b/.test(
                expression,
              );
            const left = nodes(
                node.consequent,
                technical,
                lifecycleContext || lifecycle,
              ),
              right = nodes(
                node.alternate,
                technical,
                lifecycleContext || lifecycle,
              );
            if (kind === "application" && left !== right && !lifecycle)
              errors.push(
                `${ref.path}: unresolved application/alternate rendering branch.`,
              );
            roots += Math.max(left, right);
          }
        } else if (node.type === "Component") {
          const [name, member] = node.name.split("."),
            imported = current.imports.get(name);
          const selected =
            imported && member ? { ...imported, name: member } : imported;
          if (selected?.path === controlsPath) {
            if (
              kind === "application" &&
              containsShell(
                node.fragment,
                current.imports,
                (candidate) =>
                  inspect(candidate, {}, kind, subject, [...chain, ref.path])
                    .reaches,
              )
            )
              errors.push(
                `${ref.path}: FixtureControls cannot contain a production shell.`,
              );
            continue;
          }
          if (
            kind === "application" &&
            lifecycleContext &&
            componentMatches(
              selected,
              "@lapismd/design-core/workspace/startup#WorkspaceStartup",
            )
          )
            continue;
          const args = {};
          for (const attr of node.attributes ?? [])
            if (attr.type === "Attribute")
              args[attr.name] = attribute(node, attr.name, env);
          const outcome = inspect(selected, args, kind, subject, [
            ...chain,
            ref.path,
          ]);
          if (
            kind === "application" &&
            componentMatches(selected, shell) &&
            (args.style !== undefined || args.class !== undefined)
          )
            errors.push(
              `${ref.path}: fixture class or inline style cannot override the production shell.`,
            );
          if (
            outcome.reaches &&
            componentMatches(selected, shell) &&
            node.fragment?.nodes?.some(
              (n) => n.type !== "Text" || n.data.trim(),
            )
          )
            errors.push(
              `${ref.path}: production WorkspaceShell cannot receive replacement children.`,
            );
          roots += outcome.roots ?? Number(outcome.reaches);
          errors.push(...outcome.errors);
          if (kind === "component" && !outcome.reaches)
            roots += nodes(node.fragment, technical, lifecycleContext);
        } else if (
          ["SvelteComponent", "RenderTag", "SvelteElement"].includes(node.type)
        ) {
          if (kind === "application")
            errors.push(
              `${ref.path}: dynamic application composition requires a statically resolved adapter.`,
            );
        } else if (node.type === "Text" && node.data.trim()) {
          if (kind === "application" && !technical)
            errors.push(
              `${ref.path}: fixture text must be isolated in FixtureControls.`,
            );
        } else if (node.fragment) {
          if (kind === "component")
            for (const attr of node.attributes ?? [])
              if (
                attr.type === "UseDirective" &&
                componentMatches(current.imports.get(attr.name), subject)
              )
                roots += 1;
          const cls = attribute(node, "class", env),
            role = attribute(node, "role", env);
          const hidden =
            attribute(node, "hidden", env) === true ||
            attribute(node, "aria-hidden", env) === "true";
          const status =
            typeof cls === "string" &&
            /(?:observer|__status|__error|__boot|-boot|sr-only)/.test(cls);
          const harmless =
            technical ||
            hidden ||
            status ||
            ["alert", "status"].includes(role) ||
            node.name === "output";
          if (
            kind === "application" &&
            ["button", "input", "select", "textarea"].includes(node.name) &&
            !hidden
          )
            errors.push(
              `${ref.path}: synthetic ${node.name} must be inside FixtureControls.`,
            );
          roots += nodes(node.fragment, harmless, lifecycleContext);
        } else if (node.body) {
          const child = nodes(node.body, technical, lifecycleContext);
          if (kind === "application" && node.type === "EachBlock" && child)
            errors.push(
              `${ref.path}: application shell cannot repeat through fixture iteration.`,
            );
          roots += child;
        }
      }
      return roots;
    }
    let roots = nodes(current.ast.fragment);
    if (kind === "component") {
      function visit(node) {
        if (!node || typeof node !== "object") return;
        if (
          node.type === "CallExpression" &&
          componentMatches(current.imports.get(node.callee?.name), subject)
        )
          roots += 1;
        for (const [key, value] of Object.entries(node))
          if (key !== "loc")
            if (Array.isArray(value)) value.forEach(visit);
            else if (value && typeof value === "object") visit(value);
      }
      visit(current.ast.instance);
    }
    if (kind === "application" && roots > 1)
      errors.push(
        `${ref.path}: application fixture must render exactly one production shell.`,
      );
    return { reaches: roots > 0, roots, errors };
  }
  return { inspect, model };
}
