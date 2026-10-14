import { describe, expect, it, vi } from "vitest";
import { FileEditingSessionRegistry } from "../file-editing-sessions";

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function session(dirty = true) {
  const value = {
    dirty,
    release: vi.fn(),
    flush: vi.fn(async () => {
      value.dirty = false;
    }),
    protect: vi.fn(async () => value.release),
  };
  return value;
}

// This initial regression describes the missing public admission boundary.
describe("File editing sessions", () => {
  it("protects before flushing and holds admission until every save settles", async () => {
    const registry = new FileEditingSessionRegistry();
    const first = session(),
      second = session();
    const saving = deferred(),
      started = deferred();
    first.flush.mockImplementation(async () => {
      started.resolve();
      await saving.promise;
      first.dirty = false;
    });
    registry.register("note.md", first);
    registry.register("note.md", second);
    const mutate = vi.fn(async () => "applied");
    const guarded = registry.guard("note.md", mutate);
    await started.promise;
    expect(first.protect).toHaveBeenCalledTimes(1);
    expect(second.protect).toHaveBeenCalledTimes(1);
    expect(mutate).not.toHaveBeenCalled();
    expect(() => registry.register("./note.md", session())).toThrow(
      /protected/,
    );
    expect(() => registry.register("/note.md", session())).toThrow(/protected/);
    saving.resolve();
    await expect(guarded).resolves.toBe("applied");
    expect(first.release).toHaveBeenCalledTimes(1);
    expect(second.release).toHaveBeenCalledTimes(1);
  });
});

describe("File editing-session lifetime", () => {
  it("deduplicates canonical registrations and retains a detached dirty writer for retry", async () => {
    const registry = new FileEditingSessionRegistry(),
      writer = session();
    const first = registry.register("/folder/./note.md", writer);
    const second = registry.register("folder//note.md", writer);
    first();
    first();
    await registry.flush("folder/note.md");
    expect(writer.flush).toHaveBeenCalledTimes(1);
    writer.dirty = true;
    writer.flush.mockRejectedValueOnce(new Error("offline"));
    second();
    expect(() => registry.register("other.md", writer)).toThrow(/change/);
    await expect(
      registry.guard("folder/note.md", async () => undefined),
    ).rejects.toThrow("offline");
    expect(writer.release).toHaveBeenCalledTimes(1);
    await registry.guard("folder/note.md", async () => undefined);
    expect(writer.flush).toHaveBeenCalledTimes(3);
    await expect(registry.flush()).resolves.toEqual({ flushed: false });
    registry.register("other.md", writer)();
  });

  it("does not admit mutation when a writer reports dirty after flush", async () => {
    const registry = new FileEditingSessionRegistry(),
      writer = session();
    writer.flush.mockImplementation(async () => undefined);
    registry.register("note.md", writer);
    const mutate = vi.fn(async () => undefined);
    await expect(registry.guard("note.md", mutate)).rejects.toThrow(
      /remains dirty/,
    );
    expect(mutate).not.toHaveBeenCalled();
    expect(writer.release).toHaveBeenCalledTimes(1);
  });

  it("drains late protection and releases all sessions before returning an admission failure", async () => {
    const registry = new FileEditingSessionRegistry();
    const failing = session(),
      held = session();
    const entered = deferred(),
      protection = deferred<() => void>();
    failing.protect.mockRejectedValueOnce(new Error("cannot protect"));
    held.protect.mockImplementation(async () => {
      entered.resolve();
      return protection.promise;
    });
    registry.register("note.md", failing);
    registry.register("note.md", held);
    const mutate = vi.fn(async () => undefined),
      finished = vi.fn();
    const run = registry.guard("note.md", mutate).catch(finished);
    await entered.promise;
    await Promise.resolve();
    expect(finished).not.toHaveBeenCalled();
    protection.resolve(held.release);
    await run;
    expect(finished.mock.calls[0]?.[0]).toEqual(new Error("cannot protect"));
    expect(mutate).not.toHaveBeenCalled();
    expect(held.flush).toHaveBeenCalledTimes(1);
    expect(held.release).toHaveBeenCalledTimes(1);
  });

  it("holds acquired protection until every asynchronous release settles, even after callback failure", async () => {
    const registry = new FileEditingSessionRegistry(),
      writer = session();
    const started = deferred(),
      cleanup = deferred();
    writer.release.mockImplementation(async () => {
      started.resolve();
      await cleanup.promise;
    });
    registry.register("note.md", writer);
    const finished = vi.fn();
    const guarded = registry
      .guard("note.md", async () => {
        throw new Error("apply failed");
      })
      .catch(finished);
    await started.promise;
    expect(finished).not.toHaveBeenCalled();
    expect(() => registry.register("note.md", session())).toThrow(/protected/);
    cleanup.resolve();
    await guarded;
    expect(finished.mock.calls[0]?.[0]).toEqual(new Error("apply failed"));
    registry.register("note.md", session())();
  });

  it("withholds subsequent admission while a failed release is retried", async () => {
    const registry = new FileEditingSessionRegistry(),
      writer = session();
    writer.release.mockRejectedValueOnce(new Error("release failed"));
    registry.register("note.md", writer);
    await expect(
      registry.guard("note.md", async () => undefined),
    ).rejects.toThrow("release failed");
    expect(() => registry.register("note.md", session())).toThrow(/protected/);
    const retry = deferred(),
      started = deferred();
    writer.release.mockImplementationOnce(async () => {
      started.resolve();
      await retry.promise;
    });
    const apply = vi.fn(async () => undefined);
    const next = registry.guard("note.md", apply);
    await started.promise;
    expect(apply).not.toHaveBeenCalled();
    retry.resolve();
    await next;
    expect(apply).toHaveBeenCalledTimes(1);
    expect(writer.release).toHaveBeenCalledTimes(3);
    registry.register("note.md", session())();
  });

  it("serializes callbacks while path-specific guards leave other files registerable", async () => {
    const registry = new FileEditingSessionRegistry();
    const firstWriter = session(),
      otherWriter = session();
    registry.register("first.md", firstWriter);
    registry.register("second.md", otherWriter);
    const started = deferred(),
      held = deferred();
    const first = registry.guard("first.md", async () => {
      started.resolve();
      await held.promise;
    });
    await started.promise;
    expect(otherWriter.protect).not.toHaveBeenCalled();
    registry.register("third.md", session())();
    const apply = vi.fn(async () => undefined);
    const second = registry.guard("second.md", apply);
    await Promise.resolve();
    expect(apply).not.toHaveBeenCalled();
    held.resolve();
    await Promise.all([first, second]);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(otherWriter.protect).toHaveBeenCalledTimes(1);
  });

  it("covers every file for recovery and isolates independent application registries", async () => {
    const first = new FileEditingSessionRegistry(),
      second = new FileEditingSessionRegistry();
    const a = session(),
      b = session();
    first.register("a.md", a);
    first.register("b.md", b);
    const started = deferred(),
      held = deferred();
    const guard = first.guard(undefined, async () => {
      started.resolve();
      await held.promise;
    });
    await started.promise;
    expect(a.protect).toHaveBeenCalledTimes(1);
    expect(b.protect).toHaveBeenCalledTimes(1);
    expect(() => first.register("c.md", session())).toThrow(/protected/);
    second.register("a.md", session())();
    await expect(second.guard("a.md", async () => "independent")).resolves.toBe(
      "independent",
    );
    held.resolve();
    await guard;
  });

  it("keeps a detached session bound while protected even after it saves", async () => {
    const registry = new FileEditingSessionRegistry(),
      writer = session();
    const unregister = registry.register("first.md", writer);
    const started = deferred(),
      held = deferred();
    const run = registry.guard("first.md", async () => {
      unregister();
      started.resolve();
      await held.promise;
    });
    await started.promise;
    expect(() => registry.register("second.md", writer)).toThrow(/change/);
    held.resolve();
    await run;
    registry.register("second.md", writer)();
  });

  it("rejects invalid paths and invalid sessions without invoking persistence", async () => {
    const registry = new FileEditingSessionRegistry(),
      writer = session();
    for (const path of [
      "",
      "/",
      "../note.md",
      "folder/../note.md",
      "note\\other.md",
      "note\0.md",
    ])
      expect(() => registry.register(path, writer)).toThrow(/path/);
    expect(() =>
      registry.register("note.md", { ...writer, protect: undefined } as any),
    ).toThrow(/Invalid/);
    expect(writer.flush).not.toHaveBeenCalled();
    expect(writer.protect).not.toHaveBeenCalled();
  });

  it("joins active callbacks and rejects queued or newly admitted work during shutdown", async () => {
    const registry = new FileEditingSessionRegistry(),
      writer = session();
    registry.register("note.md", writer);
    const started = deferred(),
      held = deferred();
    const active = registry.guard("note.md", async () => {
      started.resolve();
      await held.promise;
    });
    await started.promise;
    const queuedApply = vi.fn(async () => undefined);
    const queued = registry
      .guard("note.md", queuedApply)
      .catch((error) => error);
    const closing = registry.dispose();
    expect(registry.dispose()).toBe(closing);
    expect(() => registry.register("other.md", session())).toThrow(/closed/);
    await expect(registry.flush()).rejects.toThrow(/closed/);
    await expect(registry.guard("other.md", queuedApply)).rejects.toThrow(
      /closed/,
    );
    const finished = vi.fn();
    void closing.then(finished);
    await Promise.resolve();
    expect(finished).not.toHaveBeenCalled();
    held.resolve();
    await active;
    await closing;
    expect(await queued).toEqual(
      new Error("File editing-session registry is closed"),
    );
    expect(queuedApply).not.toHaveBeenCalled();
    expect(writer.flush).toHaveBeenCalledTimes(2);
  });

  it("retains failed detached saves for explicitly retried shutdown", async () => {
    const registry = new FileEditingSessionRegistry(),
      writer = session();
    registry.register("note.md", writer)();
    writer.flush.mockRejectedValueOnce(new Error("disk failed"));
    await expect(registry.dispose()).rejects.toThrow("disk failed");
    expect(writer.dirty).toBe(true);
    expect(() => registry.register("other.md", session())).toThrow(/closed/);
    await registry.dispose();
    expect(writer.flush).toHaveBeenCalledTimes(2);
    expect(writer.release).toHaveBeenCalledTimes(2);
  });
});

it("does not admit a callback after shutdown begins during protection", async () => {
  const registry = new FileEditingSessionRegistry(),
    writer = session();
  const started = deferred(),
    protection = deferred<() => void>();
  writer.protect.mockImplementationOnce(async () => {
    started.resolve();
    return protection.promise;
  });
  registry.register("note.md", writer);
  const apply = vi.fn(async () => undefined);
  const run = registry.guard("note.md", apply).catch((error) => error);
  await started.promise;
  const closing = registry.dispose();
  protection.resolve(writer.release);
  expect(await run).toEqual(
    new Error("File editing-session registry is closed"),
  );
  await closing;
  expect(apply).not.toHaveBeenCalled();
});

it("joins public flush work before shutdown protects and retries the remaining writer", async () => {
  const registry = new FileEditingSessionRegistry(),
    writer = session();
  const started = deferred(),
    save = deferred();
  writer.flush.mockImplementationOnce(async () => {
    started.resolve();
    await save.promise;
    writer.dirty = false;
  });
  registry.register("note.md", writer);
  const flushing = registry.flush();
  await started.promise;
  const closing = registry.dispose();
  await Promise.resolve();
  await Promise.resolve();
  expect(writer.protect).not.toHaveBeenCalled();
  save.resolve();
  await flushing;
  await closing;
  expect(writer.protect).toHaveBeenCalledTimes(1);
});

it("reports both callback and cleanup errors after every release settles", async () => {
  const registry = new FileEditingSessionRegistry();
  const a = session(),
    b = session();
  const saveError = new Error("apply"),
    releaseError = new Error("release");
  a.release.mockRejectedValueOnce(releaseError);
  registry.register("note.md", a);
  registry.register("note.md", b);
  try {
    await registry.guard("note.md", async () => {
      throw saveError;
    });
    throw new Error("expected rejection");
  } catch (error) {
    expect(error).toBeInstanceOf(AggregateError);
    expect((error as AggregateError).errors).toEqual([saveError, releaseError]);
  }
  expect(b.release).toHaveBeenCalledTimes(1);
  await registry.dispose();
});

it("waits for every protection acquisition before starting any flush", async () => {
  const registry = new FileEditingSessionRegistry(),
    a = session(),
    b = session();
  const started = deferred(),
    held = deferred<() => void>();
  b.protect.mockImplementation(async () => {
    started.resolve();
    return held.promise;
  });
  registry.register("note.md", a);
  registry.register("note.md", b);
  const run = registry.guard("note.md", async () => undefined);
  await started.promise;
  await Promise.resolve();
  await Promise.resolve();
  const premature = a.flush.mock.calls.length;
  held.resolve(b.release);
  await run;
  expect(premature).toBe(0);
  expect(a.flush).toHaveBeenCalledTimes(1);
});

it("drains every admitted save before returning a flush failure", async () => {
  const registry = new FileEditingSessionRegistry(),
    failing = session(),
    held = session();
  const started = deferred(),
    saving = deferred();
  failing.flush.mockRejectedValueOnce(new Error("save failed"));
  held.flush.mockImplementation(async () => {
    started.resolve();
    await saving.promise;
    held.dirty = false;
  });
  registry.register("note.md", failing);
  registry.register("note.md", held);
  const applied = vi.fn(async () => undefined),
    finished = vi.fn();
  const guarded = registry.guard("note.md", applied).catch(finished);
  await started.promise;
  await Promise.resolve();
  expect(finished).not.toHaveBeenCalled();
  expect(failing.release).not.toHaveBeenCalled();
  saving.resolve();
  await guarded;
  expect(finished.mock.calls[0]?.[0]).toEqual(new Error("save failed"));
  expect(applied).not.toHaveBeenCalled();
  expect(failing.dirty).toBe(true);
  expect(failing.release).toHaveBeenCalledTimes(1);
  expect(held.release).toHaveBeenCalledTimes(1);
});

it("retains a detached writer whose dirty-state getter fails", async () => {
  const registry = new FileEditingSessionRegistry(),
    writer = session();
  const unregister = registry.register("note.md", writer);
  let failing = true;
  Object.defineProperty(writer, "dirty", {
    get: () => {
      if (failing) throw new Error("state failed");
      return false;
    },
  });
  writer.flush.mockImplementation(async () => undefined);
  unregister();
  await expect(registry.flush()).rejects.toThrow("state failed");
  failing = false;
  await expect(registry.flush()).resolves.toEqual({ flushed: true });
  await expect(registry.flush()).resolves.toEqual({ flushed: false });
});

it("retries shutdown cleanup without releasing successful leases twice", async () => {
  const registry = new FileEditingSessionRegistry(),
    a = session(),
    b = session();
  a.release.mockRejectedValueOnce(new Error("cleanup failed"));
  registry.register("a.md", a)();
  registry.register("b.md", b)();
  await expect(registry.dispose()).rejects.toThrow("cleanup failed");
  expect(b.release).toHaveBeenCalledTimes(1);
  await registry.dispose();
  expect(a.release).toHaveBeenCalledTimes(2);
  expect(b.release).toHaveBeenCalledTimes(1);
});

it("drains independent plain flushes after one rejects", async () => {
  const registry = new FileEditingSessionRegistry(),
    a = session(),
    b = session();
  const started = deferred(),
    saving = deferred();
  a.flush.mockRejectedValueOnce(new Error("flush failed"));
  b.flush.mockImplementation(async () => {
    started.resolve();
    await saving.promise;
    b.dirty = false;
  });
  registry.register("a.md", a);
  registry.register("b.md", b);
  const finished = vi.fn();
  const flushing = registry.flush().catch(finished);
  await started.promise;
  await Promise.resolve();
  expect(finished).not.toHaveBeenCalled();
  saving.resolve();
  await flushing;
  expect(finished.mock.calls[0]?.[0]).toEqual(new Error("flush failed"));
});
