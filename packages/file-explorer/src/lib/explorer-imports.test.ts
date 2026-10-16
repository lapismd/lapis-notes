import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import { importExplorerFiles } from "./explorer-imports";

function fixture() {
  const registry = {
    track: vi.fn((operation: () => Promise<void>) => operation()),
  };
  const createFile = vi.fn<
    (
      path: string,
      data: ArrayBuffer,
      options?: { mtime?: number },
    ) => Promise<unknown>
  >(async () => undefined);
  const app = {
    fileEditingSessions: registry,
    fileManager: { createFile },
  } as unknown as App;
  return { app, registry, createFile };
}

it("imports complete binary bytes under the selected folder through new-file intent", async () => {
  const { app, createFile } = fixture();
  const bytes = new Uint8Array([0, 255, 1, 128]);
  const file = new File([bytes], "café.png", { lastModified: 1234 });
  await importExplorerFiles(app, "Attachments", [file]);
  expect(createFile).toHaveBeenCalledOnce();
  expect(createFile).toHaveBeenCalledWith(
    "Attachments/café.png",
    bytes.buffer,
    { mtime: 1234 },
  );
});

it("leaves an empty or cancelled import unchanged", async () => {
  const { app, createFile } = fixture();
  await importExplorerFiles(app, "", []);
  expect(createFile).not.toHaveBeenCalled();
});

it("rejects invalid filenames and oversized imports before reading or writing", async () => {
  for (const name of ["..", ".", "../outside", "a/b", "a\\b", "a\0b"]) {
    const { app, createFile } = fixture();
    const arrayBuffer = vi.fn(async () => new ArrayBuffer(0));
    await expect(
      importExplorerFiles(app, "", [
        { name, size: 0, arrayBuffer } as unknown as File,
      ]),
    ).rejects.toThrow(/filename/i);
    expect(createFile).not.toHaveBeenCalled();
    expect(arrayBuffer).not.toHaveBeenCalled();
  }
  const { app, createFile } = fixture();
  const file = new File([], "large.bin");
  Object.defineProperty(file, "size", { value: 64 * 1024 * 1024 + 1 });
  const read = vi.spyOn(file, "arrayBuffer");
  await expect(importExplorerFiles(app, "", [file])).rejects.toThrow(/64 MiB/);
  expect(read).not.toHaveBeenCalled();
  expect(createFile).not.toHaveBeenCalled();
});

it("propagates exclusive-create collisions without an overwrite retry", async () => {
  const { app, createFile } = fixture();
  const collision = Object.assign(new Error("Destination exists"), {
    code: "EEXIST",
  });
  createFile.mockRejectedValueOnce(collision);
  await expect(
    importExplorerFiles(app, "", [new File(["replacement"], "keep.md")]),
  ).rejects.toBe(collision);
  expect(createFile).toHaveBeenCalledOnce();
});

it("admits the asynchronous byte read through creation before the import settles", async () => {
  const { app, registry, createFile } = fixture();
  let release!: (bytes: ArrayBuffer) => void;
  const reading = new Promise<ArrayBuffer>((done) => {
    release = done;
  });
  const file = new File([], "pending.bin");
  vi.spyOn(file, "arrayBuffer").mockReturnValue(reading);
  const importing = importExplorerFiles(app, "", [file]);
  let settled = false;
  const leaving = importing.then(() => {
    settled = true;
  });
  await Promise.resolve();
  expect(settled).toBe(false);
  expect(registry.track).toHaveBeenCalledOnce();
  expect(createFile).not.toHaveBeenCalled();
  release(new Uint8Array([7, 8]).buffer);
  await importing;
  await leaving;
  expect(settled).toBe(true);
  expect(createFile).toHaveBeenCalledOnce();
});

it("finishes each file's creation before reading the next file", async () => {
  const { app, createFile } = fixture();
  let release!: () => void;
  createFile.mockImplementationOnce(
    () =>
      new Promise<void>((done) => {
        release = done;
      }),
  );
  const first = new File(["first"], "first.md"),
    second = new File(["second"], "second.md");
  const read = vi.spyOn(second, "arrayBuffer");
  const importing = importExplorerFiles(app, "", [first, second]);
  await vi.waitFor(() => expect(createFile).toHaveBeenCalledOnce());
  expect(read).not.toHaveBeenCalled();
  release();
  await importing;
  expect(read).toHaveBeenCalledOnce();
  expect(createFile.mock.calls.map(([path]) => path)).toEqual([
    "first.md",
    "second.md",
  ]);
});
