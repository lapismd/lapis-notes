import { afterEach, expect, it, vi } from "vitest";
import { MetadataCache } from "../cache.svelte";
import { EventDispatcher } from "../events";
import { MemoryAppDatabase } from "../storage/app-database";
import { TFile } from "../storage/fs";
import { NoopTelemetryService } from "../telemetry";
import { md5 } from "../utils";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

async function fixture() {
  const adapter = new InMemoryDataAdapter();
  const text = "# Native source\n";
  await adapter.write("Note.md", text);
  const database = new MemoryAppDatabase("native-observation-order");
  await database.open();
  let file: TFile | null = null;
  const vault = Object.assign(new EventDispatcher(), {
    adapter,
    getFileByPath: (path: string) => (file?.path === path ? file.copy() : null),
    getFiles: () => (file ? [file] : []),
    iterateFiles: function* () {
      if (file) yield file;
    },
    getMarkdownFiles: () => (file ? [file] : []),
    read: (target: TFile) => adapter.read(target.path),
    cachedRead: (target: TFile) => adapter.read(target.path),
  });
  const call = vi.fn(async () => ({
    status: {
      passes: 1,
      indexed: 1,
      deleted: 0,
      pending: 0,
      error: null,
      active: false,
      processed: 1,
      total: 1,
      phase: "idle",
    },
    contribution: null,
  }));
  const app = {
    plugins: { plugins: new Map() },
    session: { backgroundIndexing: { call } },
    appDatabase: database,
    vault,
    telemetry: new NoopTelemetryService(),
    notifications: {
      withProgress: async (
        _options: unknown,
        run: (progress: { report(): void }) => unknown,
      ) => run({ report() {} }),
      notify: vi.fn(),
    },
  };
  const cache = new MetadataCache(app as any);
  const processor = { read: vi.fn(() => ({})), write: () => "" };
  cache.addProcessor("md", processor);
  cleanups.push(async () => {
    await cache.dispose();
    await database.close();
  });
  await cache.load();
  call.mockClear();
  const changed = vi.fn();
  const indexed = vi.fn();
  cache.on("changed", changed);
  cache.on("index-changed", indexed);
  const publish = async (source = text, title = "native") => {
    const metadata = { frontmatter: { title } };
    await database.upsertIndexedFile({
      file: {
        path: "Note.md",
        normalizedPath: "Note.md",
        extension: "md",
        indexed: true,
        mtime: 1,
        size: source.length,
        hash: md5(source),
      },
      metadata: {
        path: "Note.md",
        hash: md5(source),
        parserVersion: "native-test",
        metadata,
      },
      links: [],
      tags: [],
      properties: [],
    });
    await vi.waitFor(() => expect(indexed).toHaveBeenCalled());
    indexed.mockClear();
    return metadata;
  };
  return {
    adapter,
    database,
    cache,
    vault,
    call,
    processor,
    changed,
    indexed,
    publish,
    show: () =>
      (file = new TFile(
        "Note.md",
        { ctime: 0, mtime: 1, size: text.length },
        null,
      )),
    text,
  };
}

it("delivers a committed native row when Vault create arrives later without publishing", async () => {
  const f = await fixture();
  const metadata = await f.publish();
  expect(f.changed).not.toHaveBeenCalled();
  const writes = vi.spyOn(f.database, "upsertIndexedFile");
  const file = f.show();
  f.vault.emit("all", "create", file);
  await vi.waitFor(() =>
    expect(f.changed).toHaveBeenCalledWith(file, f.text, metadata),
  );
  expect(f.cache.getCache(file.path)).toEqual(metadata);
  expect(writes).not.toHaveBeenCalled();
  expect(f.processor.read).not.toHaveBeenCalled();
  expect(f.call).not.toHaveBeenCalled();
});

it("still delivers when Vault create precedes the committed native row", async () => {
  const f = await fixture();
  const read = vi.spyOn(f.database, "getIndexedFile");
  const file = f.show();
  f.vault.emit("all", "create", file);
  if (read.mock.results[0]) await read.mock.results[0].value;
  const metadata = await f.publish();
  await vi.waitFor(() =>
    expect(f.changed).toHaveBeenCalledWith(file, f.text, metadata),
  );
  expect(f.processor.read).not.toHaveBeenCalled();
});

it("re-observes modify when committed metadata was delivered before readable source bytes", async () => {
  const f = await fixture();
  const file = f.show();
  const updated = "# Changed native source\n";
  const metadata = await f.publish(updated, "updated");
  expect(f.changed).not.toHaveBeenCalled();
  await f.adapter.write(file.path, updated);
  f.vault.emit("all", "modify", file);
  await vi.waitFor(() =>
    expect(f.changed).toHaveBeenCalledWith(file, updated, metadata),
  );
  expect(f.changed).toHaveBeenCalledTimes(1);
  expect(f.processor.read).not.toHaveBeenCalled();
});

it("does not deliver stale metadata when source bytes still differ", async () => {
  const f = await fixture();
  await f.publish();
  const updated = "# Newer source bytes\n";
  await f.adapter.write("Note.md", updated);
  const file = f.show();
  f.vault.emit("all", "create", file);
  const metadata = await f.publish(updated, "current");
  await vi.waitFor(() =>
    expect(f.changed).toHaveBeenCalledWith(file, updated, metadata),
  );
  expect(
    f.changed.mock.calls.every(
      ([, source, cache]) =>
        source === updated && cache.frontmatter.title === "current",
    ),
  ).toBe(true);
});

it("re-observes a committed rename after the Vault file identity moves", async () => {
  const f = await fixture();
  const file = f.show();
  const metadata = await f.publish();
  f.changed.mockClear();
  await f.adapter.rename("Note.md", "Moved.md");
  await f.database.renameIndexedFile("Note.md", "Moved.md");
  await vi.waitFor(() => expect(f.indexed).toHaveBeenCalled());
  file.path = "Moved.md";
  f.vault.emit("rename", file, "Note.md");
  await vi.waitFor(() =>
    expect(f.changed).toHaveBeenCalledWith(file, f.text, metadata),
  );
  expect(f.cache.getCache("Moved.md")).toEqual(metadata);
  expect(f.cache.getCache("Note.md")).toBeNull();
  expect(f.processor.read).not.toHaveBeenCalled();
});

it("does not deliver a pending facade read after App detach", async () => {
  const f = await fixture();
  await f.publish();
  const file = f.show();
  let finish!: (value: string) => void;
  const read = vi.spyOn(f.vault, "read").mockImplementation(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  f.vault.emit("all", "create", file);
  await vi.waitFor(() => expect(read).toHaveBeenCalledOnce());
  await f.cache.dispose();
  finish(f.text);
  await read.mock.results[0].value;
  expect(f.changed).not.toHaveBeenCalled();
});
