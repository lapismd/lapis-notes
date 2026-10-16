import { expect, it } from "vitest";
import { FileEditingSessionRegistry } from "../file-editing-sessions";

it("admits asynchronous file operations before IO and drains child operations", async () => {
  const registry = new FileEditingSessionRegistry();
  let release!: () => void;
  const held = new Promise<void>((done) => {
    release = done;
  });
  let done = false;
  const operation = registry.track(async () => {
    await held;
    void registry.track(async () => {
      done = true;
    });
  });
  const draining = registry.settleOperations();
  await Promise.resolve();
  expect(done).toBe(false);
  release();
  await Promise.all([operation, draining]);
  expect(done).toBe(true);
});

it("rejects new file operations after disposal without starting IO", async () => {
  const registry = new FileEditingSessionRegistry();
  await registry.dispose();
  let started = false;
  await expect(
    registry.track(async () => {
      started = true;
    }),
  ).rejects.toThrow("closed");
  expect(started).toBe(false);
});
