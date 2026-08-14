import { describe, expect, it, vi } from "vitest";
import { SerializedWriteQueue } from "./serialized-write-queue";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("SerializedWriteQueue", () => {
  it("serializes writes and coalesces queued values to the latest document", async () => {
    const first = deferred();
    const written: string[] = [];
    const write = vi.fn(async (value: string) => {
      written.push(value);
      if (value === "first") {
        await first.promise;
      }
    });
    const queue = new SerializedWriteQueue(write);

    queue.enqueue("first");
    queue.enqueue("second");
    queue.enqueue("latest");

    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    first.resolve();
    await queue.flush();

    expect(written).toEqual(["first", "latest"]);
  });

  it("flushes the latest pending value before resolving", async () => {
    const write = vi.fn(async (_value: string) => {});
    const queue = new SerializedWriteQueue(write);

    queue.enqueue("saved");
    await queue.flush();

    expect(write).toHaveBeenLastCalledWith("saved");
  });
});
