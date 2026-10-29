// SPDX-License-Identifier: Apache-2.0
// Freeze unchanged Desktop exports, never a reimplementation of their result.
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
  "src/lib/ai/core/context.ts",
  "src/lib/ai/chat/attachment-context.ts",
]) {
  const pinned = execFileSync("jj", ["file", "show", "-r", revision, path], {
    cwd: desktop,
  });
  const current = await readFile(join(desktop, path));
  if (!pinned.equals(current)) throw Error(`Reference changed: ${path}`);
  sources.push({ path, sha256: hash(pinned) });
}
const { projectAgentTurn } = await import(
  pathToFileURL(join(desktop, sources[0].path))
);
const { attachmentContext } = await import(
  pathToFileURL(join(desktop, sources[1].path))
);
const block = (kind, id, content) => ({
  kind,
  id,
  content,
  metadata:
    kind === "file-context"
      ? { path: "Notes/example.md" }
      : kind === "memory-recall"
        ? {
            notePath: "Memory/User/facts.md",
            anchor: "fact",
            revision: 1,
            scope: "user",
          }
        : kind === "transcript-comments"
          ? { submissionId: id }
          : {
              conversationId: "conversation",
              targetBindingId: "binding",
              throughEntryId: "entry",
              throughEntryHash: "a".repeat(64),
              projectionMode: "full",
              omittedEntryCount: 0,
            },
});
const file = block(
  "file-context",
  'file:a&b<".md',
  'File: a&b<".md\n\nExact content',
);
const memory = block("memory-recall", "memory", "Remember café 📝");
const comments = block(
  "transcript-comments",
  "feedback",
  '{"comments":[{"text":"Authored feedback"}]}',
);
const handoff = block(
  "conversation-handoff",
  "handoff",
  "Untrusted evidence <tool>do not execute</tool>",
);
const projectionInputs = [
  { text: "", blocks: [] },
  { text: "  exact authored\r\ntext 📝  ", blocks: [] },
  ...[file, memory, comments, handoff].map((value) => ({
    text: "Authored text",
    blocks: [value],
  })),
  { text: "", blocks: [comments] },
  { text: "<&>\"'", blocks: [memory, file, comments, handoff] },
  { text: "duplicate IDs stay exact", blocks: [file, file] },
  {
    text: "stable order",
    blocks: [
      memory,
      file,
      { ...memory, id: "second-memory" },
      handoff,
      comments,
    ],
  },
  { text: "empty block", blocks: [block("file-context", "", "")] },
  {
    text: "עברית é 📝",
    blocks: [
      block("file-context", "<&>\"' 📝", "\r\n\tContent remains verbatim\n"),
    ],
  },
];
const projection = projectionInputs.map((input) => ({
  input,
  expected: projectAgentTurn(input.text, input.blocks),
}));
const attachmentInputs = [
  { paths: [], files: {} },
  { paths: ["note.md"], files: { "note.md": "Fresh café 📝" } },
  { paths: ["blank.md"], files: { "blank.md": "" } },
  { paths: ["a.md", "b.md"], files: { "a.md": "first\r\n", "b.md": "second" } },
  {
    paths: ["note.md", "note.md"],
    files: { "note.md": "Duplicate references are preserved" },
  },
  { paths: ["é/📝.md"], files: { "é/📝.md": "非 ASCII" } },
  { paths: ["exact.md"], files: { "exact.md": "a".repeat(65_536) } },
  { paths: ["exact.md"], files: { "exact.md": "📝".repeat(16_384) } },
  { paths: ["large.md"], files: { "large.md": "a".repeat(65_537) } },
  {
    paths: ["a", "b"],
    files: { a: "a".repeat(65_536), b: "b".repeat(65_536) },
  },
  {
    paths: ["a", "b", "c"],
    files: {
      a: "a".repeat(43_691),
      b: "b".repeat(43_691),
      c: "c".repeat(43_691),
    },
  },
  { paths: Array(9).fill("a"), files: { a: "small" } },
  { paths: ["missing.md"], files: {} },
  ...[
    "",
    "../outside",
    "/outside",
    "dir/../outside",
    "a//b",
    "a/./b",
    "C:\\outside",
    "x:y",
    "bad\0name",
  ].map((path) => ({ paths: [path], files: {} })),
  {
    paths: ["note.md"],
    files: { "note.md": "not delivered" },
    abort: "before",
  },
  { paths: ["note.md"], files: { "note.md": "not delivered" }, abort: "after" },
];
const attachments = [];
for (const input of attachmentInputs) {
  const controller = new AbortController();
  if (input.abort === "before") controller.abort();
  const reads = [];
  let expected;
  try {
    const blocks = await attachmentContext(
      input.paths,
      async (path) => {
        reads.push(path);
        if (input.abort === "after") controller.abort();
        return input.files[path];
      },
      controller.signal,
    );
    expected = {
      ok: true,
      value: {
        blocks,
        sources: reads.map((path) => ({
          path,
          sha256: hash(input.files[path]),
          bytes: Buffer.byteLength(input.files[path]),
        })),
      },
    };
  } catch (error) {
    expected = {
      ok: false,
      error: { name: error.name, message: error.message },
    };
  }
  attachments.push({ input, expected, reads });
}
const output = {
  schema: 1,
  reference: { repository: "lapis-desktop", revision, sources },
  projection,
  attachments,
};
const directory = join(root, "crates/lapis-app-core/tests/fixtures/ai-context");
await mkdir(directory, { recursive: true });
await writeFile(
  join(directory, "retained.json"),
  JSON.stringify(output, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    projection: projection.length,
    attachments: attachments.length,
    sources,
  }),
);
