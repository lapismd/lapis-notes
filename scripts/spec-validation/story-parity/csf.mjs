import { renderedStory } from "./render.mjs";
import ts from "typescript";
import { unknown, unbox, key, targetPath } from "./syntax.mjs";

export function sourceModel(files, read) {
  const known = new Set(files),
    modules = new Map();
  const target = (file, path) => targetPath(known, file, path);
  function module(file) {
    if (modules.has(file)) return modules.get(file);
    const source = read(file);
    if (source === null) throw Error(`Missing source ${file}`);
    const tree = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    if (tree.parseDiagnostics.length) throw Error(`Cannot parse ${file}`);
    const result = {
      file,
      source,
      tree,
      bindings: new Map(),
      imports: new Map(),
      exports: new Map(),
      stories: [],
    };
    modules.set(file, result);
    for (const node of tree.statements) {
      if (ts.isImportDeclaration(node) && node.importClause) {
        const path = target(file, node.moduleSpecifier.text),
          clause = node.importClause;
        if (clause.name)
          result.imports.set(clause.name.text, { path, name: "default" });
        const imports = clause.namedBindings;
        if (imports && ts.isNamespaceImport(imports))
          result.imports.set(imports.name.text, { path, name: "*" });
        else
          for (const binding of imports?.elements ?? [])
            result.imports.set(binding.name.text, {
              path,
              name: (binding.propertyName ?? binding.name).text,
            });
      }
      const exported = node.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );
      if (ts.isVariableStatement(node))
        for (const declaration of node.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name)) continue;
          result.bindings.set(declaration.name.text, declaration.initializer);
          if (exported) {
            result.exports.set(declaration.name.text, declaration.name.text);
            result.stories.push({
              name: declaration.name.text,
              node: declaration,
            });
          }
        }
      if (ts.isFunctionDeclaration(node) && node.name) {
        result.bindings.set(node.name.text, node);
        if (exported) result.exports.set(node.name.text, node.name.text);
      }
      if (ts.isExportAssignment(node))
        result.exports.set("default", node.expression);
      if (
        ts.isExportDeclaration(node) &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause)
      )
        for (const binding of node.exportClause.elements)
          result.exports.set(
            binding.name.text,
            node.moduleSpecifier
              ? {
                  path: target(file, node.moduleSpecifier.text),
                  name: (binding.propertyName ?? binding.name).text,
                }
              : (binding.propertyName ?? binding.name).text,
          );
    }
    return result;
  }
  function reference(path, name, stack = []) {
    if (!path) return unknown;
    if (!path.startsWith("stories/") || path.endsWith(".svelte"))
      return { kind: "reference", path, name };
    if (name === "*") return { kind: "namespace", path };
    const id = `${path}#${name}`;
    if (stack.includes(id)) return unknown;
    const exported = module(path).exports.get(name);
    if (typeof exported === "string")
      return symbol(path, exported, {}, [...stack, id]);
    if (exported?.path)
      return reference(exported.path, exported.name, [...stack, id]);
    return evaluate(path, exported, {}, [...stack, id]);
  }
  function symbol(file, name, env = {}, stack = []) {
    if (name === "undefined") return undefined;
    if (Object.hasOwn(env, name)) return env[name];
    const model = module(file),
      imported = model.imports.get(name);
    if (imported) return reference(imported.path, imported.name, stack);
    if (!model.bindings.has(name) || stack.includes(`${file}:${name}`))
      return unknown;
    return evaluate(file, model.bindings.get(name), env, [
      ...stack,
      `${file}:${name}`,
    ]);
  }
  function call(fn, args, stack = []) {
    if (fn?.kind !== "function" || stack.length > 60) return unknown;
    const env = { ...fn.env };
    fn.node.parameters.forEach((p, i) => {
      if (ts.isIdentifier(p.name))
        env[p.name.text] =
          args[i] === undefined
            ? evaluate(fn.file, p.initializer, env, stack)
            : args[i];
      else if (ts.isObjectBindingPattern(p.name))
        for (const binding of p.name.elements) {
          const name = key(binding.propertyName ?? binding.name);
          env[key(binding.name)] =
            args[i]?.[name] ??
            evaluate(fn.file, binding.initializer, env, stack);
        }
    });
    const body = fn.node.body;
    if (!ts.isBlock(body)) return evaluate(fn.file, body, env, stack);
    function statements(nodes) {
      for (const node of nodes) {
        if (ts.isReturnStatement(node))
          return evaluate(fn.file, node.expression, env, stack);
        if (ts.isVariableStatement(node))
          for (const declaration of node.declarationList.declarations)
            if (ts.isIdentifier(declaration.name))
              env[declaration.name.text] = evaluate(
                fn.file,
                declaration.initializer,
                env,
                stack,
              );
        if (ts.isIfStatement(node)) {
          const condition = evaluate(fn.file, node.expression, env, stack);
          const branch =
            condition === unknown
              ? null
              : condition
                ? node.thenStatement
                : node.elseStatement;
          if (condition === unknown) return unknown;
          if (branch) {
            const value = statements(
              ts.isBlock(branch) ? branch.statements : [branch],
            );
            if (value !== undefined) return value;
          }
        }
        if (
          ts.isExpressionStatement(node) &&
          ts.isBinaryExpression(node.expression) &&
          node.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
        ) {
          const left = unbox(node.expression.left);
          if (ts.isPropertyAccessExpression(left)) {
            const owner = evaluate(fn.file, left.expression, env, stack);
            if (owner && typeof owner === "object" && !owner.kind)
              owner[left.name.text] = evaluate(
                fn.file,
                node.expression.right,
                env,
                stack,
              );
            else return unknown;
          } else return unknown;
        }
      }
    }
    return statements(body.statements) ?? unknown;
  }
  function evaluate(file, expression, env = {}, stack = []) {
    const node = unbox(expression);
    if (!node || stack.length > 60) return unknown;
    if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node))
      return ts.isNumericLiteral(node) ? Number(node.text) : node.text;
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isIdentifier(node)) return symbol(file, node.text, env, stack);
    if (
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node) ||
      ts.isFunctionDeclaration(node)
    )
      return { kind: "function", file, node, env: { ...env } };
    if (ts.isObjectLiteralExpression(node)) {
      const result = {};
      for (const property of node.properties) {
        if (ts.isSpreadAssignment(property)) {
          const value = evaluate(file, property.expression, env, stack);
          if (value && typeof value === "object" && !value.kind)
            Object.assign(result, value);
          else result.unresolvedSpread = true;
        } else if (ts.isShorthandPropertyAssignment(property))
          result[key(property.name)] = symbol(
            file,
            key(property.name),
            env,
            stack,
          );
        else if (ts.isPropertyAssignment(property))
          result[key(property.name)] = evaluate(
            file,
            property.initializer,
            env,
            stack,
          );
      }
      return result;
    }
    if (ts.isArrayLiteralExpression(node))
      return node.elements.map((n) => evaluate(file, n, env, stack));
    if (
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)
    ) {
      const value = evaluate(file, node.expression, env, stack),
        name = ts.isPropertyAccessExpression(node)
          ? node.name.text
          : evaluate(file, node.argumentExpression, env, stack);
      if (value?.kind === "namespace")
        return reference(value.path, name, stack);
      if (value?.kind === "reference" && value.name === "*")
        return { ...value, name };
      return value && typeof value === "object" && !value.kind
        ? value[name]
        : unknown;
    }
    if (ts.isCallExpression(node))
      return call(
        evaluate(file, node.expression, env, stack),
        node.arguments.map((n) => evaluate(file, n, env, stack)),
        stack,
      );
    if (ts.isConditionalExpression(node)) {
      const condition = evaluate(file, node.condition, env, stack);
      return condition === unknown
        ? unknown
        : evaluate(
            file,
            condition ? node.whenTrue : node.whenFalse,
            env,
            stack,
          );
    }
    if (
      ts.isPrefixUnaryExpression(node) &&
      node.operator === ts.SyntaxKind.ExclamationToken
    ) {
      const value = evaluate(file, node.operand, env, stack);
      return value === unknown ? unknown : !value;
    }
    if (ts.isBinaryExpression(node)) {
      const a = evaluate(file, node.left, env, stack),
        b = evaluate(file, node.right, env, stack);
      if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken)
        return a === unknown ? unknown : a ? b : a;
      if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken)
        return a === unknown ? unknown : a || b;
      if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
        return a === unknown ? unknown : (a ?? b);
      if (a === unknown || b === unknown) return unknown;
      if (
        [
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.SyntaxKind.EqualsEqualsToken,
        ].includes(node.operatorToken.kind)
      )
        return a === b;
      if (
        [
          ts.SyntaxKind.ExclamationEqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsToken,
        ].includes(node.operatorToken.kind)
      )
        return a !== b;
    }
    return unknown;
  }

  return {
    module,
    evaluate,
    symbol,
    call,
    reference,
    target,
    rendered: (file, story) =>
      renderedStory({ module, reference, call }, file, story),
  };
}
