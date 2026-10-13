import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";
import ts from "typescript";
import { specificationChapters } from "./specification-navigation.mjs";

const chapters = specificationChapters(
  readFileSync("spec/src/SUMMARY.md", "utf8"),
);
const root = "stories/spec";
const expected = new Map(
  chapters.map((chapter) => {
    const file = path.join(root, chapter.path.replace(/\.md$/, ".mdx"));
    const canonical = path
      .relative(path.dirname(file), path.join("spec/src", chapter.path))
      .replaceAll("\\", "/");
    return [
      file,
      `import { Markdown, Meta } from "@storybook/addon-docs/blocks";\nimport content from "${canonical}?raw";\n\n<Meta title="${chapter.title}" />\n\n<Markdown>{content}</Markdown>\n`,
    ];
  }),
);
const write = process.argv.includes("--write");
let changed = false;
for (const chapter of chapters) {
  const file = path.join("spec/src", chapter.path);
  const source = readFileSync(file, "utf8");
  if (!source.includes("## Topics\n\n") || /^## LN-/m.test(source)) continue;
  const children = chapters.filter(
    (entry) => entry.parents.at(-1) === chapter.id,
  );
  const links = children
    .map(
      (entry) =>
        `- [${entry.label}](${path.relative(path.dirname(chapter.path), entry.path).replaceAll("\\", "/")})`,
    )
    .join("\n");
  const generated = source.replace(
    /## Topics\n\n[\s\S]*$/,
    `## Topics\n\n${links}\n`,
  );
  if (source === generated) continue;
  changed = true;
  if (write) writeFileSync(file, generated);
  else
    console.error(
      `SPEC-TOPICS-SYNC LN-CAT-115 ${file}:1 — regenerate topic links with pnpm spec:mirrors`,
    );
}
for (const [file, content] of expected) {
  let current;
  try {
    current = readFileSync(file, "utf8");
  } catch {
    /* a newly indexed chapter */
  }
  if (current === content) continue;
  changed = true;
  if (write) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  } else
    console.error(
      `SPEC-MIRROR-SYNC LN-CAT-115 ${file}:1 — regenerate with pnpm spec:mirrors`,
    );
}
for (const file of readdirSync(root, { recursive: true })) {
  const full = path.join(root, file);
  if (!file.endsWith(".mdx") || expected.has(full)) continue;
  changed = true;
  if (write) unlinkSync(full);
  else
    console.error(
      `SPEC-MIRROR-STALE LN-CAT-115 ${full}:1 — remove through pnpm spec:mirrors`,
    );
}
{
  const tree = new Map();
  for (const { title } of chapters) {
    let node = tree;
    for (const part of title.split("/").slice(1)) {
      if (!node.has(part)) node.set(part, new Map());
      node = node.get(part);
    }
  }
  function order(node) {
    return [...node].flatMap(([label, children]) =>
      children.size ? [label, order(children)] : [label],
    );
  }
  const file = ".storybook/preview.ts";
  const source = readFileSync(file, "utf8");
  const parsed = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  let range;
  function visit(node) {
    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(parsed) === "order" &&
      ts.isArrayLiteralExpression(node.initializer) &&
      node.initializer.elements[0]?.getText(parsed) === '"Specification"'
    ) {
      const branch = node.initializer.elements[1];
      range = [branch.getStart(parsed), branch.end];
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  if (!range)
    throw new Error("Specification-first inline Storybook order is missing");
  const expectedOrder = order(tree);
  function readOrder(node) {
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(readOrder);
    if (ts.isStringLiteral(node)) return node.text;
    throw new Error(
      "Specification order must contain literal labels and arrays",
    );
  }
  const actualOrder = readOrder(
    ts.createSourceFile(
      "order.ts",
      source.slice(range[0], range[1]),
      ts.ScriptTarget.Latest,
      true,
    ).statements[0].expression,
  );
  if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
    changed = true;
    if (write)
      writeFileSync(
        file,
        source.slice(0, range[0]) +
          JSON.stringify(expectedOrder, null, 2) +
          source.slice(range[1]),
      );
    else
      console.error(
        `SPEC-ORDER-SYNC LN-CAT-115 ${file}:1 — regenerate sidebar order with pnpm spec:mirrors`,
      );
  }
}
if (!write && changed) process.exitCode = 1;
else
  console.log(
    `${chapters.length} specification mirrors ${write ? "generated" : "current"} from SUMMARY.`,
  );
