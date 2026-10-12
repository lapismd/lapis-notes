// @vitest-environment node
import { expect, it } from "vitest";
import ts from "typescript";
import { fileURLToPath } from "node:url";

it("emits a portable build helper declaration without a Vite peer graph", () => {
  const source = fileURLToPath(new URL("./vite.ts", import.meta.url));
  const options = {
    declaration: true,
    emitDeclarationOnly: true,
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  };
  const host = ts.createCompilerHost(options);
  let declaration = "";
  host.writeFile = (file, text) => {
    if (file.endsWith("vite.d.ts")) declaration = text;
  };
  const program = ts.createProgram([source], options, host);
  expect(program.emit().emitSkipped).toBe(false);
  expect(declaration).toContain("tursoBundleBuildPlugin");
  expect(declaration).not.toMatch(/from ["']vite["']/);
});
