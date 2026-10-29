import { expect, it, vi } from "vitest";
import * as editing from "../file-editing-sessions";
import type { TFile } from "../storage/fs";
import type { Vault } from "../storage/vault.svelte";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
function lease() {
  return { release: vi.fn(), saved: vi.fn(), reset: vi.fn() };
}
function fixture(protect = vi.fn(() => Promise.resolve(lease()))) {
  let disk = "external",
    local = "draft";
  const conflicts = new editing.FileTextConflictRegistry();
  const write = vi.fn(
    async (_file: TFile, contents: string, expected: string | null) => {
      if (disk !== expected)
        throw Object.assign(new Error("changed"), { code: "ECONFLICT" });
      disk = contents;
    },
  );
  const vault = {
    read: async () => disk,
    modifyIfUnchanged: write,
  } as unknown as Vault;
  let tail = Promise.resolve();
  const persistence = new editing.FileTextPersistence({
    vault,
    file: { path: "note.md" } as TFile,
    baseline: "original",
    conflicts,
    local: () => local,
    protect,
    serialize(run) {
      const result = tail.then(run);
      tail = result.catch(() => undefined);
      return result;
    },
  });
  return {
    persistence,
    conflicts,
    write,
    disk: () => disk,
    setLocal: (value: string) => {
      local = value;
    },
  };
}

it("exports generic text persistence through the public editing contract", () => {
  expect(editing.FileTextPersistence).toBeTypeOf("function");
});

it("awaits async recovery protection before inspecting or mutating the retained document", async () => {
  const held = deferred<ReturnType<typeof lease>>();
  const protection = lease();
  const protect = vi.fn(() => held.promise);
  const { persistence, conflicts, write, disk } = fixture(protect);
  await expect(persistence.persist("draft")).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  const resolving = conflicts.entries[0].resolve("keep-local");
  expect(protect).toHaveBeenCalledOnce();
  await Promise.resolve();
  expect(write).toHaveBeenCalledTimes(1);
  expect(conflicts.entries).toHaveLength(1);
  held.resolve(protection);
  await resolving;
  expect(disk()).toBe("draft");
  expect(protection.saved).toHaveBeenCalledOnce();
  expect(protection.reset).not.toHaveBeenCalled();
  expect(protection.release).toHaveBeenCalledOnce();
  expect(conflicts.entries).toHaveLength(0);
});

it("rejects a decision superseded while asynchronous protection is pending", async () => {
  const first = lease(),
    second = lease();
  const held = deferred<ReturnType<typeof lease>>();
  const protect = vi
    .fn()
    .mockImplementationOnce(() => held.promise)
    .mockResolvedValueOnce(second);
  const { persistence, conflicts } = fixture(protect);
  await expect(persistence.persist("draft")).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  const conflict = conflicts.entries[0];
  const keep = conflict.resolve("keep-local");
  const refresh = conflict.refresh();
  await refresh;
  held.resolve(first);
  await expect(keep).rejects.toThrow(/changed/i);
  expect(second.saved).not.toHaveBeenCalled();
  expect(second.reset).not.toHaveBeenCalled();
  expect(second.release).toHaveBeenCalledOnce();
  expect(first.saved).not.toHaveBeenCalled();
  expect(first.reset).not.toHaveBeenCalled();
  expect(first.release).toHaveBeenCalledOnce();
  expect(conflicts.entries).toHaveLength(1);
});

it("keeps each concurrent recovery's acknowledgement and release bound to its own lease", async () => {
  const first = lease(),
    second = lease();
  const protect = vi
    .fn()
    .mockResolvedValueOnce(first)
    .mockResolvedValueOnce(second);
  const { persistence, conflicts, disk } = fixture(protect);
  await expect(persistence.persist("draft")).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  const conflict = conflicts.entries[0];
  const keep = conflict.resolve("keep-local");
  const refresh = conflict.refresh();
  const stale = expect(refresh).rejects.toThrow(/changed/i);
  await keep;
  await stale;
  expect(disk()).toBe("draft");
  expect(first.saved).toHaveBeenCalledOnce();
  expect(first.release).toHaveBeenCalledOnce();
  expect(second.saved).not.toHaveBeenCalled();
  expect(second.reset).not.toHaveBeenCalled();
  expect(second.release).toHaveBeenCalledOnce();
});

it("resets only through the accepted recovery lease and permits later conditional saves", async () => {
  const protection = lease();
  const { persistence, conflicts, write, setLocal, disk } = fixture(
    vi.fn(async () => protection),
  );
  await expect(persistence.persist("draft")).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  await conflicts.entries[0].resolve("use-external");
  expect(protection.reset).toHaveBeenCalledExactlyOnceWith("external");
  expect(protection.saved).not.toHaveBeenCalled();
  expect(protection.release).toHaveBeenCalledOnce();
  setLocal("after recovery");
  await persistence.persist("after recovery");
  expect(write.mock.calls.at(-1)?.[2]).toBe("external");
  expect(disk()).toBe("after recovery");
});

it("retains the conflict and performs no recovery write when async admission rejects", async () => {
  const held = deferred<ReturnType<typeof lease>>();
  const { persistence, conflicts, write, disk } = fixture(
    vi.fn(() => held.promise),
  );
  await expect(persistence.persist("draft")).rejects.toMatchObject({
    code: "ECONFLICT",
  });
  const resolving = conflicts.entries[0].resolve("keep-local");
  const failure = new Error("surface did not settle");
  const failed = expect(resolving).rejects.toBe(failure);
  held.reject(failure);
  await failed;
  expect(write).toHaveBeenCalledTimes(1);
  expect(disk()).toBe("external");
  expect(conflicts.entries).toHaveLength(1);
});
