import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  projectMigration,
  renderTasks,
  run,
  validateLedger,
} from "../migration-progress.mjs";

const root = new URL("../../", import.meta.url);
const spec = "spec/src/architecture/rust-application-services.md#ln-core-001";
const task = (id, status = "Waiting") => ({
  id,
  status,
  spec,
  area: "Roadmap",
  work: "Existing feature",
  detail: "Original gate remains.",
});
const ledger = (tasks = [task("R1")]) => ({
  updated: "2026-10-24 21:46:56 UTC",
  tasks,
});
const source = `# Migration Status

Last updated **2026-10-23 10:00:00 UTC**. Current checkpoint.

Verified source remains separate from host adoption.

<!-- migration-tasks:start -->
stale generated content
<!-- migration-tasks:end -->

### Consumer qualification

Exact existing receipts.

## Hosted AI and history parity

Historical intake remains unchanged.
`;

function fixture(t) {
  const dir = mkdtempSync(resolve(tmpdir(), "lapis-migration-progress-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(resolve(dir, "spec/src/architecture"), { recursive: true });
  writeFileSync(resolve(dir, spec.split("#")[0]), '<a id="ln-core-001"></a>');
  writeFileSync(
    resolve(dir, "spec/migration-progress.json"),
    JSON.stringify(ledger()),
  );
  writeFileSync(resolve(dir, "MIGRATION.md"), source);
  return dir;
}

test("master tracker groups gates and links naturally sorted task IDs", () => {
  const source = readFileSync(new URL("MIGRATION.md", root), "utf8");
  const headings = [...source.matchAll(/^### Gate status: (.+)$/gmu)];
  assert.deepEqual(
    headings.map((match) => match[1]),
    ["Working", "Waiting", "Source complete", "Complete"],
  );
  let total = 0;
  for (const [index, heading] of headings.entries()) {
    const section = source.slice(
      heading.index,
      headings[index + 1]?.index ??
        source.indexOf("### Consumer qualification"),
    );
    const ids = [
      ...section.matchAll(/^\| \[(R[\d.]+)\]\((spec\/src\/[^)]+)\)/gmu),
    ];
    total += ids.length;
    const names = ids.map((match) => match[1]);
    assert.deepEqual(
      names,
      [...names].sort((a, b) => a.localeCompare(b, "en", { numeric: true })),
    );
    for (const [, , target] of ids) {
      const [file, anchor] = target.split("#");
      const contract = readFileSync(new URL(file, root), "utf8");
      assert.ok(contract.includes(`<a id="${anchor}"></a>`), target);
    }
  }
  const declared = JSON.parse(
    readFileSync(new URL("spec/migration-progress.json", root), "utf8"),
  ).tasks;
  assert.equal(total, declared.length);
  const rendered = [
    ...source.matchAll(/^\| \[(R[\d.]+)\]\(spec\/src\//gmu),
  ].map((match) => match[1]);
  assert.deepEqual(
    [...rendered].sort(),
    declared.map((item) => item.id).sort(),
  );
});

test("generation orders gates, omits empty groups and leaves the ledger untouched", async () => {
  const tasks = [
    task("R10", "Complete"),
    task("R1.3.10"),
    task("R1.3.2"),
    task("R2", "Working"),
  ];
  const before = structuredClone(tasks);
  const output = await renderTasks(tasks);
  assert.deepEqual(tasks, before);
  assert.deepEqual(
    [...output.matchAll(/^### Gate status: (.+)$/gmu)].map((match) => match[1]),
    ["Working", "Waiting", "Complete"],
  );
  assert.ok(output.indexOf("[R1.3.2]") < output.indexOf("[R1.3.10]"));
  assert.ok(output.indexOf("[R1.3.10]") < output.indexOf("[R10]"));
  assert.ok(output.includes(`](${spec})`));
});

test("source-complete and deferred gates remain distinct from completed work", async () => {
  const output = await renderTasks([
    task("R1", "Source complete"),
    task("R2", "Deferred"),
  ]);
  assert.match(output, /### Gate status: Source complete/u);
  assert.match(output, /### Gate status: Deferred/u);
  assert.doesNotMatch(output, /### Gate status: Complete/u);
});

test("Markdown table delimiters in task descriptions are escaped", async () => {
  const output = await renderTasks([
    { ...task("R1"), detail: "Native | hosted" },
  ]);
  assert.ok(output.includes("Native \\| hosted"));
});

test("projection updates the UTC stamp and preserves authored checkpoint and history", async () => {
  const output = await projectMigration(source, ledger());
  assert.match(output, /Last updated \*\*2026-10-24 21:46:56 UTC\*\*/u);
  assert.ok(
    output.includes("Verified source remains separate from host adoption."),
  );
  const after = "<!-- migration-tasks:end -->";
  assert.equal(output.split(after)[1], source.split(after)[1]);
  assert.equal(await projectMigration(output, ledger()), output);
});

test("projection rejects missing, duplicate or reversed generated blocks and timestamps", async () => {
  for (const invalid of [
    source.replace("<!-- migration-tasks:end -->", ""),
    source + "<!-- migration-tasks:start -->",
    source
      .replace("<!-- migration-tasks:start -->", "<!-- migration-tasks:end -->")
      .replace(
        "<!-- migration-tasks:end -->\n\n###",
        "<!-- migration-tasks:start -->\n\n###",
      ),
    source.replace("UTC**", "GMT**"),
    source + "\nLast updated **2026-10-24 21:46:56 UTC**\n",
  ])
    await assert.rejects(projectMigration(invalid, ledger()));
});

test("ledger validation rejects duplicate IDs, unknown gates and invalid metadata", () => {
  const invalid = ledger([
    task("R1"),
    { ...task("R1", "Done"), work: "", detail: "two\nlines" },
  ]);
  invalid.updated = "not a UTC timestamp";
  const errors = validateLedger(invalid, fileURLToPath(root));
  for (const fragment of [
    "UTC",
    "Duplicate task ID",
    "unknown gate status",
    "work",
    "detail",
  ])
    assert.ok(
      errors.some((error) => error.includes(fragment)),
      fragment,
    );
  assert.ok(
    validateLedger(ledger([task("H1")]), fileURLToPath(root)).some((error) =>
      error.includes("Invalid task ID"),
    ),
  );
  assert.ok(
    validateLedger(
      { updated: ledger().updated, tasks: [] },
      fileURLToPath(root),
    ).length,
  );
  assert.ok(
    validateLedger(
      { ...ledger(), updated: "2026-02-30 21:46:56 UTC" },
      fileURLToPath(root),
    ).some((error) => error.includes("UTC")),
  );
});

test("ledger validation rejects missing files, anchors and noncanonical links", () => {
  for (const target of [
    "spec/src/architecture/missing.md#ln-core-001",
    spec.replace("001", "999"),
    "../../outside.md#ln-core-001",
    "https://example.com/spec.md",
  ])
    assert.ok(
      validateLedger(
        ledger([{ ...task("R1"), spec: target }]),
        fileURLToPath(root),
      ).length,
      target,
    );
});

test("check mode detects edits and regeneration restores only the generated projection", async (t) => {
  const dir = fixture(t);
  await assert.rejects(run(dir), /stale; run pnpm progress:generate/u);
  assert.equal(readFileSync(resolve(dir, "MIGRATION.md"), "utf8"), source);
  await run(dir, true);
  assert.match(await run(dir), /passes \(1 tasks/u);
  const generated = readFileSync(resolve(dir, "MIGRATION.md"), "utf8");
  writeFileSync(
    resolve(dir, "MIGRATION.md"),
    generated.replace("Existing feature", "Hand edit"),
  );
  await assert.rejects(run(dir), /stale/u);
  await run(dir, true);
  assert.equal(readFileSync(resolve(dir, "MIGRATION.md"), "utf8"), generated);
  const changed = ledger([{ ...task("R1"), status: "Working" }]);
  writeFileSync(
    resolve(dir, "spec/migration-progress.json"),
    JSON.stringify(changed),
  );
  await assert.rejects(run(dir), /stale/u);
});

test("repository tracker is current and both normal and specification lanes check drift", async () => {
  assert.deepEqual(
    validateLedger(
      JSON.parse(
        readFileSync(new URL("spec/migration-progress.json", root), "utf8"),
      ),
      fileURLToPath(root),
    ),
    [],
  );
  assert.match(await run(fileURLToPath(root)), /Migration progress passes/u);
  const manifest = JSON.parse(
    readFileSync(new URL("package.json", root), "utf8"),
  );
  assert.ok(manifest.scripts.check.includes("pnpm check:progress"));
  assert.equal(
    manifest.scripts["progress:generate"],
    "node scripts/migration-progress.mjs --write",
  );
  assert.match(
    readFileSync(new URL("spec-validator.config.mjs", root), "utf8"),
    /args: \["check:progress"\]/u,
  );
});
