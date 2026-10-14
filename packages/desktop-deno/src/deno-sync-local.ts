import { snapshotSyncFileMutation } from "@lapis-notes/api/sync-repository";
import type {
  SyncFileDescriptor,
  SyncHostLocalProvider,
  SyncLocalHostCapabilities,
  SyncOperationAuthority,
} from "@lapis-notes/api/sync-repository";
import type { DesktopSyncSessionClient } from "./deno-sync-session";
import {
  SYNC_LOCAL_CHUNK_BYTES,
  type SyncLocalOperation,
} from "./sync-local-protocol";
function authority(input?: SyncOperationAuthority): SyncOperationAuthority {
  if (!input) throw new Error("Sync operation authority is required");
  return structuredClone(input);
}
function record(
  input: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !keys.includes(key))
  )
    throw new Error("Invalid native Sync response");
  return input as Record<string, unknown>;
}
function natural(input: unknown, minimum = 0): number {
  if (
    typeof input !== "number" ||
    !Number.isSafeInteger(input) ||
    input < minimum
  )
    throw new Error("Invalid native Sync integer");
  return input;
}
function boolean(input: unknown): boolean {
  if (typeof input !== "boolean")
    throw new Error("Invalid native Sync boolean");
  return input;
}
function descriptor(input: unknown): SyncFileDescriptor {
  const file = record(input, [
    "path",
    "fileId",
    "hostFileId",
    "contentGeneration",
  ]);
  if (
    typeof file.path !== "string" ||
    !file.path ||
    typeof file.fileId !== "string" ||
    !file.fileId ||
    (file.hostFileId !== undefined && typeof file.hostFileId !== "string")
  )
    throw new Error("Invalid native Sync file descriptor");
  return {
    path: file.path,
    fileId: file.fileId,
    ...(file.hostFileId !== undefined ? { hostFileId: file.hostFileId } : {}),
    contentGeneration: natural(file.contentGeneration),
  };
}
export function createDesktopSyncLocalProvider(
  client: DesktopSyncSessionClient,
): SyncHostLocalProvider {
  return {
    forRuntime(runtimeId): SyncLocalHostCapabilities {
      const runtime = client.acquire(runtimeId, "local");
      const call = (operation: SyncLocalOperation, args: unknown[]) =>
        client.local(runtimeId, runtime, operation, args);
      const cleanup = (
        operation: "readClose" | "uploadClose" | "captureClose",
        token: string,
      ) => client.cleanup(runtimeId, runtime, operation, token);
      const read = (token: string): ReadableStream<Uint8Array> => {
        let sequence = 0,
          position = 0,
          terminal = false;
        let controller: ReadableStreamDefaultController<Uint8Array>;
        const close = async () => {
          await cleanup("readClose", token);
          unregister();
        };
        const stop = async () => {
          if (!terminal) {
            terminal = true;
            controller.error(new Error("Desktop Sync runtime is revoked"));
          }
          await close();
        };
        const unregister = client.stopWith(runtime, stop);
        return new ReadableStream<Uint8Array>(
          {
            start(value) {
              controller = value;
            },
            async pull() {
              if (terminal) return;
              try {
                const result = (await call("readChunk", [token, sequence])) as {
                  done: boolean;
                  bytes?: Uint8Array;
                  position: number;
                };
                client.assert(runtime);
                if (
                  !result ||
                  typeof result.done !== "boolean" ||
                  (result.done
                    ? result.bytes !== undefined
                    : !(result.bytes instanceof Uint8Array) ||
                      !result.bytes.length ||
                      result.bytes.length > SYNC_LOCAL_CHUNK_BYTES)
                )
                  throw new Error("Invalid native Sync chunk");
                const nextPosition = position + (result.bytes?.length ?? 0);
                if (
                  !Number.isSafeInteger(result.position) ||
                  result.position !== nextPosition
                )
                  throw new Error("Native Sync read position changed");
                position = nextPosition;
                if (terminal) return;
                sequence++;
                if (result.done) {
                  await close();
                  terminal = true;
                  controller.close();
                } else controller.enqueue(result.bytes!);
              } catch (error) {
                if (!terminal) {
                  terminal = true;
                  controller.error(error);
                }
                await close();
              }
            },
            async cancel() {
              terminal = true;
              await close();
            },
          },
          { highWaterMark: 0 },
        );
      };
      const bytes = async (token: string): Promise<Uint8Array> =>
        new Uint8Array(await new Response(read(token)).arrayBuffer());
      const upload = async (
        kind: "write" | "state" | "blob",
        source: ReadableStream<Uint8Array>,
        finish: unknown,
        fence?: SyncOperationAuthority,
      ) => {
        const token = crypto.randomUUID(),
          reader = source.getReader();
        const stop = async () => {
          await reader.cancel(new Error("Desktop Sync runtime is revoked"));
        };
        const unregister = client.stopWith(runtime, stop);
        try {
          await call("uploadStart", [token, kind, fence ?? null]);
          let sequence = 0;
          for (;;) {
            const part = await reader.read();
            client.assert(runtime);
            if (part.done) break;
            if (!(part.value instanceof Uint8Array))
              throw new Error("Invalid Sync input stream chunk");
            for (
              let offset = 0;
              offset < part.value.length;
              offset += SYNC_LOCAL_CHUNK_BYTES
            )
              await call("uploadChunk", [
                token,
                sequence++,
                part.value.subarray(offset, offset + SYNC_LOCAL_CHUNK_BYTES),
              ]);
          }
          return await call("uploadFinish", [token, finish]);
        } finally {
          try {
            await reader.cancel();
          } finally {
            reader.releaseLock();
            unregister();
            await cleanup("uploadClose", token);
          }
        }
      };
      return {
        async list() {
          const token = crypto.randomUUID();
          try {
            await call("captureStart", [token]);
            const files: SyncFileDescriptor[] = [];
            let after = 0;
            for (;;) {
              const page = (await call("capturePage", [token, after])) as {
                files: SyncFileDescriptor[];
                next: number | null;
              };
              if (
                !page ||
                !Array.isArray(page.files) ||
                (page.next !== null &&
                  (!Number.isSafeInteger(page.next) || page.next <= after))
              )
                throw new Error("Invalid native Sync capture page");
              files.push(...page.files.map(descriptor));
              if (page.next !== null && page.next !== after + page.files.length)
                throw new Error("Invalid native Sync capture position");
              if (page.next === null) break;
              after = page.next;
            }
            return files.map((file) => ({
              ...file,
              openRead: async () => {
                const request = crypto.randomUUID();
                await call("fileRead", [request, file]);
                return read(request);
              },
            }));
          } finally {
            await cleanup("captureClose", token);
          }
        },
        repository: {
          async readState() {
            const token = crypto.randomUUID();
            const input = await call("stateRead", [token]);
            if (input === null) return null;
            try {
              const state = record(input, ["id", "version", "epoch"]);
              if (state.id !== token)
                throw new Error("Invalid native Sync state transfer");
              const version = natural(state.version, 1),
                epoch = natural(state.epoch, 1);
              return { version, epoch, ciphertext: await bytes(token) };
            } finally {
              await cleanup("readClose", token);
            }
          },
          async compareAndSwap(expectedVersion, next, fence) {
            const expected = authority(fence),
              captured = structuredClone(next);
            return boolean(
              await upload(
                "state",
                new Blob([Uint8Array.from(captured.ciphertext)]).stream(),
                {
                  expectedVersion,
                  version: captured.version,
                  epoch: captured.epoch,
                },
                expected,
              ),
            );
          },
          blobs: {
            async has(hash) {
              return boolean(await call("blobHas", [hash]));
            },
            async get(hash) {
              const token = crypto.randomUUID();
              await call("blobRead", [token, hash]);
              return bytes(token);
            },
            async put(input) {
              const captured = Uint8Array.from(input);
              const result = record(
                await upload("blob", new Blob([captured]).stream(), null),
                ["hash", "size"],
              );
              if (
                typeof result.hash !== "string" ||
                !/^[a-f0-9]{64}$/u.test(result.hash) ||
                result.size !== captured.byteLength
              )
                throw new Error("Invalid native Sync object receipt");
              return { hash: result.hash, size: captured.byteLength };
            },
          },
        },
        apply: {
          async receipt(operationId, fence) {
            return (await call("receipt", [
              operationId,
              authority(fence),
            ])) as Awaited<
              ReturnType<SyncLocalHostCapabilities["apply"]["receipt"]>
            >;
          },
          async mutate(operation, source, fence) {
            const expected = authority(fence),
              captured = snapshotSyncFileMutation(operation);
            if (captured.kind === "remove")
              return (await call("mutate", [captured, expected])) as Awaited<
                ReturnType<SyncLocalHostCapabilities["apply"]["mutate"]>
              >;
            if (!source)
              throw new Error("Sync writes require a content stream");
            return (await upload(
              "write",
              source,
              captured,
              expected,
            )) as Awaited<
              ReturnType<SyncLocalHostCapabilities["apply"]["mutate"]>
            >;
          },
        },
      };
    },
    revokeRuntime: (runtimeId) => client.close(runtimeId),
  };
}
