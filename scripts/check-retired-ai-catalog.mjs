import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const retiredReference =
  /@lapis-notes\/ai(?:["'\s/@]|$)|@lapismd\/ai-controller(?:["'\s/@]|$)|stories\/plugins\/ai(?:["'\s/]|$)|plugins-ai--|plugins-ai-|from\s+["'](?:\.\.?\/)+ai\//;

export function auditRetiredAiCatalog(directory = root) {
  const errors = [];
  for (const file of [
    "stories/plugins/ai",
    "scripts/lib/controller-connection-bridge.ts",
    ".env.storybook.local.example",
  ]) {
    if (existsSync(path.join(directory, file)))
      errors.push(`${file}:1: remove the retired shared-AI catalog source`);
  }
  function inspect(relative) {
    const absolute = path.join(directory, relative);
    if (!existsSync(absolute)) return;
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      if (["node_modules", "dist", "build", ".turbo"].includes(entry.name))
        continue;
      const file = path.join(relative, entry.name);
      if (entry.isDirectory()) inspect(file);
      else if (
        /\.(?:[cm]?[jt]sx?|svelte|json|mdx|css|html)$/.test(entry.name)
      ) {
        readFileSync(path.join(directory, file), "utf8")
          .split("\n")
          .forEach((line, index) => {
            if (retiredReference.test(line))
              errors.push(
                `${file}:${index + 1}: remove the retired shared-AI import or mapping`,
              );
          });
      }
    }
  }
  for (const relative of ["stories", ".storybook"]) inspect(relative);
  const manifest = JSON.parse(
    readFileSync(path.join(directory, "package.json"), "utf8"),
  );
  for (const section of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ])
    for (const name of ["@lapis-notes/ai", "@lapismd/ai-controller"])
      if (Object.hasOwn(manifest[section] ?? {}, name))
        errors.push(`package.json:1: remove retired root dependency ${name}`);
  // The frozen desktop owns its remaining controller contract until host retirement.
  // Only the removed shared plugin must also disappear from the resolved graph.
  for (const file of [
    "pnpm-lock.yaml",
    "scripts/prepare-local-plugin-consumer.mjs",
  ])
    if (
      existsSync(path.join(directory, file)) &&
      /@lapis-notes\/ai(?:["'\s/@:]|$)/.test(
        readFileSync(path.join(directory, file), "utf8"),
      )
    )
      errors.push(`${file}:1: remove the retired shared-AI package edge`);
  for (const file of [
    "turbo.json",
    "scripts/lib/turbo-invocation.mjs",
    ".storybook/vite-final.ts",
  ])
    if (
      existsSync(path.join(directory, file)) &&
      /LAPIS_AGENT_RUNTIME_(?:URL|TOKEN)/.test(
        readFileSync(path.join(directory, file), "utf8"),
      )
    )
      errors.push(`${file}:1: remove retired controller attachment inputs`);
  return errors;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const errors = auditRetiredAiCatalog();
  if (errors.length) {
    console.error(
      errors
        .map((message) => `RETIRED-AI-CATALOG LN-CAT-123 ${message}`)
        .join("\n"),
    );
    process.exitCode = 1;
  } else
    console.log("Retired shared-AI catalog and dependency boundaries pass.");
}
