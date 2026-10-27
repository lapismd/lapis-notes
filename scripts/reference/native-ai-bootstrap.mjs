// SPDX-License-Identifier: Apache-2.0
// Invoke unchanged Desktop sources, retaining complete results and read order.
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
const revision = "6c6243202e05b04e57de0a737829ca3a48e3ed3e";
const root = process.cwd();
const git = execFileSync("jj", ["git", "root"], { encoding: "utf8" }).trim();
const desktop =
  process.env.LAPIS_CONTEXT_REFERENCE_ROOT ??
  join(dirname(dirname(git)), "lapis-desktop");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const sources = [];
for (const path of [
  "src/lib/ai/bootstrap/build.ts",
  "src/lib/ai/bootstrap/format.ts",
  "src/lib/ai/bootstrap/folder-instructions.ts",
  "src/lib/ai/bootstrap/types.ts",
  "src/lib/ai/bootstrap/instructions.ts",
  "src/lib/ai/skills/manifest.ts",
]) {
  const pinned = execFileSync("jj", ["file", "show", "-r", revision, path], {
    cwd: desktop,
  });
  if (!pinned.equals(await readFile(join(desktop, path))))
    throw Error(`Reference changed: ${path}`);
  sources.push({ path, sha256: hash(pinned) });
}
const { buildSessionBootstrap } = await import(
  pathToFileURL(join(desktop, sources[0].path))
);
const cases = [];
const add = (input, files = {}, read = true) =>
  cases.push({ input, files, read });
add({ scopeDir: "" }, {}, false);
add(
  {
    scopeDir: "Projects/Lapis",
    conversationId: "conversation",
    launchNotePath: "Projects/Lapis/Note.md",
    workspaceLabel: "Workspace",
    tools: [
      { name: "notes_search", description: "Search\r\n  notes\tcarefully." },
    ],
    skills: [{ name: "lapis-notes", description: "Notes", version: "v1" }],
  },
  {},
  false,
);
add(
  { scopeDir: "Projects/Lapis" },
  {
    ".lapis/AGENTS.md": "Root rules",
    "Projects/.lapis/AGENTS.md": "Project rules",
    "Projects/Lapis/.lapis/AGENTS.md": "Leaf rules",
  },
);
add(
  { scopeDir: "Projects/Lapis" },
  {
    ".lapis/AGENTS.md": " \uFEFF\r\n ",
    "Projects/.lapis/AGENTS.md": " \uFEFF café 📝\r\nnext\rline\uFEFF ",
  },
);
add(
  { scopeDir: "a//b/" },
  {
    ".lapis/AGENTS.md": "Root",
    "a/.lapis/AGENTS.md": "Parent",
    "a/b/.lapis/AGENTS.md": "Leaf",
  },
);
for (const text of [
  "Read /Users/private/file",
  'Read "C:\\private\\file"',
  "Use file://private/file",
  "Use .lapis/skills/private",
  "Use .agents/skills/private",
  "Use .agents/user/skills/private",
  "a".repeat(10001) + " /Users/hidden",
])
  add({ scopeDir: "" }, { ".lapis/AGENTS.md": text });
for (const text of [
  "Use relative/notes.md",
  "https://example.test/path",
  "Do not treat A:B as a path.",
  "café 📝 and CRLF\r\nlines",
  "Read FILE://mixed-case",
  "U+0085\u0085retained",
])
  add({ scopeDir: "" }, { ".lapis/AGENTS.md": text });
for (const size of [9999, 10000, 10001])
  add({ scopeDir: "" }, { ".lapis/AGENTS.md": "x".repeat(size) });
add({ scopeDir: "" }, { ".lapis/AGENTS.md": "📝".repeat(5001) });
add(
  { scopeDir: "a/b/c" },
  {
    ".lapis/AGENTS.md": "a".repeat(10000),
    "a/.lapis/AGENTS.md": "b".repeat(10000),
    "a/b/.lapis/AGENTS.md": "c".repeat(10000),
    "a/b/c/.lapis/AGENTS.md": "must not be read",
  },
);
add(
  {
    scopeDir: ".agents/skills/lapis-notes",
    launchNotePath: ".agents/skills/lapis-notes/SKILL.md",
  },
  {},
  false,
);
add(
  { scopeDir: ".agents/skills/lapis-notes" },
  { ".agents/skills/lapis-notes/.lapis/AGENTS.md": "Scoped rules" },
);
for (const label of [
  "",
  "  ",
  "café 📝",
  " /Users/private",
  "C:\\private\\file",
  "file://private",
])
  add({ scopeDir: "", workspaceLabel: label }, {}, false);
for (const path of [
  "/Users/private/file",
  "C:\\private\\file",
  "file://private/file",
  "Notes/normal.md",
  " .agents/user/skills/research/SKILL.md ",
])
  add({ scopeDir: "", launchNotePath: path }, {}, false);
add(
  {
    scopeDir: "",
    tools: [
      {
        name: "search",
        description: "Spaces\u00A0and\uFEFF\tlines\nnormalized",
      },
      { name: "other", description: "\u0085 stays" },
    ],
    skills: [],
  },
  {},
  false,
);
add(
  {
    scopeDir: "",
    tools: [{ name: "search", description: "Reads /Users/private/file" }],
  },
  {},
  false,
);
add(
  {
    scopeDir: "",
    skills: [{ name: "/Users/private", description: "", version: "v1" }],
  },
  {},
  false,
);
// These source slices create ill-formed UTF-16; the existing native JSON port refuses it.
add({ scopeDir: "" }, { ".lapis/AGENTS.md": "x".repeat(9999) + "📝" });
add(
  { scopeDir: "a/b" },
  {
    ".lapis/AGENTS.md": "a".repeat(10000),
    "a/.lapis/AGENTS.md": "b".repeat(10000),
    "a/b/.lapis/AGENTS.md": "x".repeat(4999) + "📝",
  },
);
const results = [];
for (const entry of cases) {
  const reads = [];
  let expected;
  try {
    const value = await buildSessionBootstrap({
      ...entry.input,
      ...(entry.read
        ? {
            readText: async (path) => {
              reads.push(path);
              return entry.files[path];
            },
          }
        : {}),
    });
    expected = value.text.isWellFormed()
      ? { ok: true, value }
      : {
          ok: false,
          nativeUnicodeRefusal: true,
          sourceWire: JSON.stringify(value),
        };
  } catch (error) {
    expected = {
      ok: false,
      error: { name: error.name, message: error.message },
    };
  }
  results.push({ ...entry, reads, expected });
}
const directory = join(root, "crates/lapis-app-core/tests/fixtures/ai-context");
await mkdir(directory, { recursive: true });
await writeFile(
  join(directory, "bootstrap.json"),
  JSON.stringify(
    {
      schema: 1,
      reference: { repository: "lapis-desktop", revision, sources },
      cases: results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    cases: results.length,
    unicodeRefusals: results.filter((c) => c.expected.nativeUnicodeRefusal)
      .length,
    sources,
  }),
);
