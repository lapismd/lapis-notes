import { expect, it, vi } from "vitest";
import { FileEditingSessionRegistry } from "../file-editing-sessions";

async function failure(callback: unknown, cleanup: unknown): Promise<unknown> {
  const registry = new FileEditingSessionRegistry();
  registry.register("note.md", {
    dirty: false,
    async flush() {},
    async protect() {
      return () => {
        throw cleanup;
      };
    },
  });
  return registry
    .guard("note.md", async () => {
      throw callback;
    })
    .catch((error: unknown) => error);
}

it("preserves one identical failure reported by both admission and cleanup", async () => {
  const error = Object.assign(new Error("handoff failed"), {
    code: "ECONFLICT",
  });
  expect(await failure(error, error)).toBe(error);
});

it("aggregates independent errors even when their messages match", async () => {
  const callback = new Error("handoff failed");
  const cleanup = new Error("handoff failed");
  const error = await failure(callback, cleanup);
  expect(error).toBeInstanceOf(AggregateError);
  expect((error as AggregateError).errors).toEqual([callback, cleanup]);
});

it("aggregates primitive failures even when their values match", async () => {
  const error = await failure("handoff failed", "handoff failed");
  expect(error).toBeInstanceOf(AggregateError);
  expect((error as AggregateError).errors).toEqual([
    "handoff failed",
    "handoff failed",
  ]);
});

it("preserves shared rejection multiplicity across independent writer admissions", async () => {
  const registry = new FileEditingSessionRegistry();
  const shared = new Error("active turn");
  const rejection = Promise.reject(shared);
  void rejection.catch(() => {});
  const protect = vi.fn(() => rejection);
  for (let index = 0; index < 3; index++)
    registry.register(`writer-${index}.md`, {
      dirty: false,
      async flush() {},
      protect,
    });
  const mutate = vi.fn(async () => {});
  const error = await registry.guard(undefined, mutate).catch((value) => value);
  expect(error).toBeInstanceOf(AggregateError);
  expect((error as AggregateError).errors).toEqual([shared, shared, shared]);
  expect(protect).toHaveBeenCalledTimes(3);
  expect(mutate).not.toHaveBeenCalled();
});

it("removes only propagated cleanup leaves while preserving primary multiplicity", async () => {
  const shared = new Error("handoff failed");
  const primary = new AggregateError([shared, shared], "writer admission");
  const cleanup = new AggregateError([shared], "release propagation");
  expect(await failure(primary, cleanup)).toBe(primary);
});

it("retains independent nested cleanup failures, multiplicity and cause", async () => {
  const shared = new Error("handoff failed");
  const primary = new AggregateError([shared, shared], "writer admission");
  const independent = new Error("release failed");
  const cause = new Error("cleanup owner");
  const cleanup = new AggregateError(
    [shared, independent, independent],
    "release propagation",
    { cause },
  );
  const error = (await failure(primary, cleanup)) as AggregateError;
  expect(error.errors[0]).toBe(primary);
  const retained = error.errors[1] as AggregateError;
  expect(retained).toBeInstanceOf(AggregateError);
  expect(retained.errors).toEqual([independent, independent]);
  expect(retained.message).toBe(cleanup.message);
  expect(retained.cause).toBe(cause);
});
