import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const localFunctionsPath = path.join(currentDir, "functions.ts");
const peaqlFunctionsPath = path.join(
  currentDir,
  "../../../node_modules/peaql/src/lib/query/query_env.ts",
);

function extractRegisteredFunctions(filePath: string): Set<string> {
  const source = fs.readFileSync(filePath, "utf8");
  return new Set(
    [...source.matchAll(/createFunction\(\s*"([^"]+)"/g)].map(
      (match) => match[1],
    ),
  );
}

const registeredFunctions = new Set([
  ...extractRegisteredFunctions(localFunctionsPath),
  ...extractRegisteredFunctions(peaqlFunctionsPath),
]);

const currentlySupportedFunctionNames = [
  "abs",
  "contains",
  "containsAll",
  "containsAny",
  "ceil",
  "date",
  "duration",
  "endsWith",
  "escapeHTML",
  "file",
  "filter",
  "floor",
  "format",
  "flat",
  "hasLink",
  "hasProperty",
  "hasTag",
  "html",
  "icon",
  "image",
  "inFolder",
  "if",
  "isEmpty",
  "isType",
  "join",
  "keys",
  "length",
  "list",
  "link",
  "linksTo",
  "lower",
  "map",
  "max",
  "matches",
  "min",
  "now",
  "number",
  "random",
  "reduce",
  "repeat",
  "replace",
  "relative",
  "reverse",
  "round",
  "slice",
  "sort",
  "split",
  "startsWith",
  "asFile",
  "asLink",
  "time",
  "title",
  "toFixed",
  "today",
  "trim",
  "unique",
  "values",
] as const;

const currentAliasOnlyFunctionNames = [
  "containsAllOf",
  "containsAnyOf",
] as const;

const missingDocumentedFunctionNames = [] as const;

describe("Bases function parity checklist", () => {
  test.each(currentlySupportedFunctionNames)(
    "registers current supported function %s",
    (name) => {
      expect(registeredFunctions).toContain(name);
    },
  );

  test.each(currentAliasOnlyFunctionNames)(
    "still relies on non-upstream alias %s",
    (name) => {
      expect(registeredFunctions).toContain(name);
    },
  );

  for (const name of missingDocumentedFunctionNames) {
    test.todo(`support documented Bases function ${name}`);
  }
});
