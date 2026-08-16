import ts from "typescript";

const ACCESS_KINDS = new Set(["command", "file", "internal", "alias"]);
const VIEW_METHODS = new Map([
  ["registerView", 2],
  ["registerSidebarView", 3],
]);

function lineFor(sourceFile, position, lineOffset) {
  return (
    sourceFile.getLineAndCharacterOfPosition(position).line + 1 + lineOffset
  );
}

function property(object, name) {
  return object.properties.find(
    (entry) =>
      ts.isPropertyAssignment(entry) &&
      (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name)) &&
      entry.name.text === name,
  );
}

function stringValue(node) {
  return node && ts.isStringLiteral(node.initializer)
    ? node.initializer.text
    : null;
}

function finding(sourceFile, node, lineOffset, code, message) {
  return {
    code,
    file: sourceFile.fileName,
    line: lineFor(sourceFile, node.getStart(sourceFile), lineOffset),
    message,
  };
}

function auditAccess(sourceFile, access, lineOffset) {
  if (!ts.isObjectLiteralExpression(access)) {
    return [
      finding(
        sourceFile,
        access,
        lineOffset,
        "VIEW-COMMAND-ACCESS-INVALID",
        "view access metadata must be an explicit object with a command, file, internal, or alias kind",
      ),
    ];
  }

  const kind = stringValue(property(access, "kind"));
  if (!kind || !ACCESS_KINDS.has(kind)) {
    return [
      finding(
        sourceFile,
        access,
        lineOffset,
        "VIEW-COMMAND-ACCESS-INVALID",
        "view access metadata must declare kind: command, file, internal, or alias",
      ),
    ];
  }

  if (kind !== "command") return [];
  const command = property(access, "command");
  if (!command || !ts.isObjectLiteralExpression(command.initializer)) {
    return [
      finding(
        sourceFile,
        access,
        lineOffset,
        "VIEW-COMMAND-OPEN-SHAPE",
        "command view access must declare its Open command metadata",
      ),
    ];
  }

  // A typed registry can spread a previously validated command declaration.
  if (command.initializer.properties.some(ts.isSpreadAssignment)) return [];

  const id = stringValue(property(command.initializer, "id"));
  const name = stringValue(property(command.initializer, "name"));
  const findings = [];
  if (!id?.startsWith("open-")) {
    findings.push(
      finding(
        sourceFile,
        command.initializer,
        lineOffset,
        "VIEW-COMMAND-OPEN-SHAPE",
        "command view access must use an open-* command id",
      ),
    );
  }
  if (!name?.startsWith("Open ")) {
    findings.push(
      finding(
        sourceFile,
        command.initializer,
        lineOffset,
        "VIEW-COMMAND-OPEN-SHAPE",
        "command view access must use a concise Open … command name",
      ),
    );
  }
  return findings;
}

function auditScript(source, fileName, lineOffset = 0) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const findings = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isThis(node.expression.expression)
    ) {
      const accessIndex = VIEW_METHODS.get(node.expression.name.text);
      if (accessIndex !== undefined) {
        const access = node.arguments[accessIndex];
        if (!access) {
          findings.push(
            finding(
              sourceFile,
              node,
              lineOffset,
              "VIEW-COMMAND-ACCESS-MISSING",
              `${node.expression.name.text} must declare ViewAccess metadata`,
            ),
          );
        } else {
          findings.push(...auditAccess(sourceFile, access, lineOffset));
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return findings;
}

/**
 * Audit one TypeScript or Svelte source file. Exported for deterministic
 * fixture coverage without loading repository state.
 */
export function auditSource(source, fileName = "fixture.ts") {
  if (!fileName.endsWith(".svelte")) return auditScript(source, fileName);

  const findings = [];
  const scriptPattern = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
  for (const match of source.matchAll(scriptPattern)) {
    const before = source.slice(0, match.index);
    const lineOffset = before.split("\n").length - 1;
    findings.push(...auditScript(match[1], fileName, lineOffset));
  }
  return findings;
}

function firstPartySource(file) {
  return (
    /^(?:packages\/file-explorer|packages\/plugins\/plugin-[^/]+)\/src\/.*\.(?:[cm]?ts|tsx|svelte)$/.test(
      file,
    ) && !/\.(?:spec|test)\.[cm]?tsx?$/.test(file)
  );
}

function rule(context, code) {
  const mapped = context.config.diagnostics[code];
  if (!mapped) {
    throw new Error(`missing diagnostic mapping for ${code}`);
  }
  return mapped;
}

export const name = "viewCommandAudit";

export function validate(context) {
  const findings = [];
  for (const file of context.trackedFiles.filter(firstPartySource).sort()) {
    const source = context.readOptional(`${context.model.repoRoot}/${file}`);
    if (source === null) continue;
    for (const entry of auditSource(source, file)) {
      findings.push({ ...entry, rule: rule(context, entry.code) });
    }
  }
  return findings;
}
