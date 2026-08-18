import {
  APPLY_PATCH_INPUT_SCHEMA,
  EDIT_INPUT_SCHEMA,
  READ_INPUT_SCHEMA,
  WRITE_INPUT_SCHEMA,
  applyUpdateChunksToText,
  executeApplyPatch,
  executeEdit,
  executeRead,
  executeWrite,
  parseApplyPatch,
  prepareApplyPatchInput,
  prepareEditInput,
  prepareReadInput,
  prepareWriteInput,
  type FileToolOperations,
  type ResolveFileToolPath,
} from "@lapismd/ai-host/file-tools";
import type {
  AppTool,
  AppToolApprovalDetails,
  AppToolExecutionContext,
  AppToolJsonValue,
  AppToolResult,
} from "../agent-tools";
import type { Vault } from "../storage/vault.svelte";
import {
  assertPayloadSize,
  isAllowedFileToolPath,
  revisionFromStat,
} from "./paths";
import { createVaultFileOperations } from "./vault-operations";

function asSchema(schema: object): Record<string, unknown> {
  return structuredClone(schema) as Record<string, unknown>;
}

function createScopedResolver(
  context: AppToolExecutionContext,
): ResolveFileToolPath {
  return (path) => {
    const resolved = context.scope.resolve(path);
    if (!isAllowedFileToolPath(resolved)) {
      throw new Error("File path must not address internal content.");
    }
    return resolved;
  };
}

function conflictResult(
  path: string,
  reason: string,
  matchCount?: number,
  hunkIndex?: number,
): AppToolResult {
  const structuredContent = {
    status: "conflict",
    path,
    reason,
    ...(matchCount === undefined ? {} : { matchCount }),
    ...(hunkIndex === undefined ? {} : { hunkIndex }),
  } satisfies AppToolJsonValue;
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `Edit conflict for ${path}: ${reason}`,
      },
    ],
    structuredContent,
  };
}

function createReadTool(vault: Vault, operations: FileToolOperations): AppTool {
  return {
    name: "read",
    description: `
Read a bounded line range from a scoped vault text file.
Prefer this tool over cat or sed in the agent cwd; host cwd is not the browser vault.
`.trim(),
    inputSchema: asSchema(READ_INPUT_SCHEMA),
    outputSchema: { type: "object" },
    effect: "read",
    execute: async (input, context) => {
      context.signal.throwIfAborted();
      const prepared = prepareReadInput(input);
      const result = await executeRead(
        operations,
        createScopedResolver(context),
        prepared,
      );
      context.signal.throwIfAborted();
      const structuredContent = {
        ...result,
        revision: revisionFromStat(await vault.stat(result.path)),
      } satisfies AppToolJsonValue;
      return {
        content: [{ type: "text", text: result.text }],
        structuredContent,
      };
    },
  };
}

function createWriteTool(
  vault: Vault,
  operations: FileToolOperations,
): AppTool {
  return {
    name: "write",
    description: `
Create or overwrite a scoped vault text file after creating missing parents.
Prefer this tool over shell redirects in the agent cwd; paths are vault-relative.
`.trim(),
    inputSchema: asSchema(WRITE_INPUT_SCHEMA),
    outputSchema: { type: "object" },
    effect: "write",
    describeApproval: async (input, context) => {
      const prepared = prepareWriteInput(input);
      assertPayloadSize(prepared.content, "File content");
      const path = createScopedResolver(context)(prepared.path);
      const existing = await operations.stat(path);
      if (existing?.type === "directory") {
        throw new Error(`${path} is a folder`);
      }
      const before =
        existing?.type === "file" ? await operations.readFile(path) : "";
      return {
        title: `Write ${path}`,
        description: existing
          ? "Overwrite this scoped text file."
          : "Create this scoped text file.",
        path,
        diff: { before, after: prepared.content },
      };
    },
    execute: async (input, context) => {
      context.signal.throwIfAborted();
      const prepared = prepareWriteInput(input);
      assertPayloadSize(prepared.content, "File content");
      const result = await executeWrite(
        operations,
        createScopedResolver(context),
        prepared,
      );
      context.signal.throwIfAborted();
      const structuredContent = {
        status: result.created ? "created" : result.changed ? "updated" : "unchanged",
        ...result,
        revision: revisionFromStat(await vault.stat(result.path)),
      } satisfies AppToolJsonValue;
      return {
        content: [
          {
            type: "text",
            text: result.created
              ? `Created ${result.path}`
              : result.changed
                ? `Wrote ${result.path}`
                : `Unchanged ${result.path}`,
          },
        ],
        structuredContent,
      };
    },
  };
}

function createEditTool(
  vault: Vault,
  operations: FileToolOperations,
): AppTool {
  return {
    name: "edit",
    description: `
Replace unique exact text hunks in a scoped vault text file.
Prefer this tool over sed or patching files in the agent cwd.
`.trim(),
    inputSchema: asSchema(EDIT_INPUT_SCHEMA),
    outputSchema: { type: "object" },
    effect: "write",
    describeApproval: async (input, context) => {
      const prepared = prepareEditInput(input);
      const path = createScopedResolver(context)(prepared.path);
      return {
        title: `Edit ${path}`,
        description: "Replace unique exact text hunks in this file.",
        path,
        diffs: prepared.edits.map((edit) => ({
          path,
          before: edit.oldText,
          after: edit.newText,
        })),
      } satisfies AppToolApprovalDetails;
    },
    execute: async (input, context) => {
      context.signal.throwIfAborted();
      const prepared = prepareEditInput(input);
      const result = await executeEdit(
        operations,
        createScopedResolver(context),
        prepared.path,
        prepared.edits,
      );
      if (!result.ok) {
        return conflictResult(
          result.path,
          result.reason,
          result.matchCount,
          result.hunkIndex,
        );
      }
      context.signal.throwIfAborted();
      const structuredContent = {
        status: "edited",
        path: result.path,
        revision: revisionFromStat(await vault.stat(result.path)),
      } satisfies AppToolJsonValue;
      return {
        content: [{ type: "text", text: `Edited ${result.path}` }],
        structuredContent,
      };
    },
  };
}

function createApplyPatchTool(operations: FileToolOperations): AppTool {
  return {
    name: "apply_patch",
    description: `
Apply a V4A patch that adds, updates, moves, or deletes scoped vault text files.
Prefer this tool over applying patches in the agent cwd.
`.trim(),
    inputSchema: asSchema(APPLY_PATCH_INPUT_SCHEMA),
    outputSchema: { type: "object" },
    effect: "write",
    describeApproval: async (input, context) => {
      const prepared = prepareApplyPatchInput(input);
      assertPayloadSize(prepared.input, "Patch");
      const resolvePath = createScopedResolver(context);
      const hunks = parseApplyPatch(prepared.input);
      const diffs: NonNullable<AppToolApprovalDetails["diffs"]> = [];
      const paths: string[] = [];
      for (const hunk of hunks) {
        if (hunk.kind === "add") {
          const path = resolvePath(hunk.path);
          paths.push(path);
          diffs.push({ path, before: "", after: hunk.contents });
          continue;
        }
        if (hunk.kind === "delete") {
          const path = resolvePath(hunk.path);
          paths.push(path);
          diffs.push({
            path,
            before: await operations.readFile(path),
            after: "",
          });
          continue;
        }
        const path = resolvePath(hunk.path);
        const current = await operations.readFile(path);
        const after = applyUpdateChunksToText(current, path, hunk.chunks);
        if (hunk.movePath) {
          const destination = resolvePath(hunk.movePath);
          paths.push(path, destination);
          diffs.push({ path, before: current, after: "" });
          diffs.push({ path: destination, before: "", after });
          continue;
        }
        paths.push(path);
        diffs.push({ path, before: current, after });
      }
      return {
        title:
          paths.length === 1
            ? `Patch ${paths[0]}`
            : `Patch ${paths.length} files`,
        description: "Apply a validated V4A patch to scoped text files.",
        path: paths[0],
        paths,
        diffs,
      };
    },
    execute: async (input, context) => {
      context.signal.throwIfAborted();
      const prepared = prepareApplyPatchInput(input);
      assertPayloadSize(prepared.input, "Patch");
      const result = await executeApplyPatch(
        operations,
        createScopedResolver(context),
        prepared.input,
      );
      context.signal.throwIfAborted();
      const structuredContent = {
        status: "patched",
        ...result.summary,
      } satisfies AppToolJsonValue;
      return {
        content: [{ type: "text", text: result.text }],
        structuredContent,
      };
    },
  };
}

export function createVaultFileAppTools(vault: Vault): AppTool[] {
  const operations = createVaultFileOperations(vault);
  return [
    createReadTool(vault, operations),
    createWriteTool(vault, operations),
    createEditTool(vault, operations),
    createApplyPatchTool(operations),
  ];
}
