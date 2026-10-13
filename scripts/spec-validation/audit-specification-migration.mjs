import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// Run against the migration change, not as a freeze on future governed changes.
const baseline = JSON.parse(
  readFileSync("spec/archive/2026-10-13-specification/baseline.json", "utf8"),
);
const relocation = JSON.parse(readFileSync("spec/relocations.json", "utf8"));
const requirements = new Map();
const verification = new Map();
const normalize = (source) =>
  source
    .replace(/<a id="[^"]+"><\/a>/g, "")
    .replace(/\s+/g, " ")
    .trim();
const links = (source, file) =>
  source.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (whole, label, href) => {
    if (/^[a-z]+:/i.test(href)) return whole;
    return `[${label}](${new URL(href, `https://canonical.invalid/spec/src/${file}`).pathname})`;
  });
for (const file of readdirSync("spec/src", { recursive: true }).filter((file) =>
  file.endsWith(".md"),
)) {
  const source = readFileSync(path.join("spec/src", file), "utf8");
  const sections = [...source.matchAll(/^## (LN-[A-Z]+-\d{3}) — .+$/gm)];
  for (const [index, match] of sections.entries()) {
    const body = source.slice(
      match.index + match[0].length,
      sections[index + 1]?.index ?? source.length,
    );
    const statement = /^\*\*Requirement\.\*\* (.+)$/m.exec(body)?.[1];
    assert.ok(statement, `${match[1]} has a parsed statement`);
    assert.ok(!requirements.has(match[1]), `duplicate requirement ${match[1]}`);
    requirements.set(match[1], {
      statement,
      file,
      acceptance: body.split("### Acceptance details\n")[1]?.trim(),
    });
  }
  if (file.startsWith("verification/")) {
    for (const row of source
      .split("\n")
      .filter((line) => line.startsWith("| LN-"))) {
      const cells = row
        .split(/(?<!\\)\|/)
        .slice(1, -1)
        .map((cell) => cell.trim());
      assert.ok(
        !verification.has(cells[0]),
        `duplicate verification ${cells[0]}`,
      );
      verification.set(cells[0], { cells: cells.slice(1), file });
    }
  }
}
const formatChanges = new Set(["LN-GOV-015", "LN-GOV-016"]);
const additions = new Set([
  "LN-GOV-048",
  "LN-GOV-049",
  "LN-CAT-113",
  "LN-CAT-114",
  "LN-CAT-115",
  "LN-CAT-116",
]);
for (const [id, original] of Object.entries(baseline.requirements)) {
  const current = requirements.get(id);
  assert.ok(current, `missing ${id}`);
  if (!formatChanges.has(id))
    assert.equal(
      normalize(links(current.statement, current.file)),
      normalize(links(original.statement, original.chapter)),
      `changed constraint ${id}`,
    );
  assert.equal(
    normalize(current.acceptance ?? ""),
    normalize(original.acceptance ?? ""),
    `changed acceptance ${id}`,
  );
  const evidence = verification.get(id);
  assert.ok(evidence, `missing verification ${id}`);
  assert.equal(
    evidence.cells[1],
    baseline.verification[id][1],
    `changed status ${id}`,
  );
  assert.equal(
    normalize(links(evidence.cells[2], evidence.file)),
    normalize(links(baseline.verification[id][2], "verification.md")),
    `changed evidence ${id}`,
  );
  assert.equal(
    evidence.cells[0].match(/^\[([^\]]+)\]/)?.[1],
    baseline.verification[id][0],
    `changed chapter label ${id}`,
  );
  assert.equal(
    relocation[`${original.chapter}#${id.toLowerCase()}`]?.path,
    current.file,
    `missing relocation ${id}`,
  );
}
for (const id of requirements.keys())
  assert.ok(
    baseline.requirements[id] || additions.has(id),
    `unexpected ID ${id}`,
  );
assert.equal(requirements.size, 1371);
assert.equal(verification.size, requirements.size);
console.log(
  "Preserved 1365 requirement IDs, constraints, acceptance sections, statuses, and evidence rows; two format-rule changes and six documentation requirements identified separately.",
);
