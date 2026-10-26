import { expect, it, vi } from "vitest";
import type { Handle, HistoryClient } from "@lapismd/jj-history";
import { createHostedRepository } from "./services";

function fixture() {
  const handle = "prepared-handle" as Handle;
  const reader = {
    heads: vi.fn(async () => ({ heads: [] })),
    open: vi.fn(async () => handle),
    close: vi.fn(async (_handle: Handle) => {}),
    status: vi.fn(async () => ({ state: "ready" })),
    read: vi.fn(),
    blame: vi.fn(),
  };
  return {
    handle,
    reader,
    services: createHostedRepository(reader as unknown as HistoryClient),
  };
}

it("fences new reads and drains an accepted open before closing its handle", async () => {
  const f = fixture();
  let release!: (handle: Handle) => void;
  f.reader.open.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const opening = f.services.reader.open("operation");
  await vi.waitFor(() => expect(f.reader.open).toHaveBeenCalledOnce());
  const closing = f.services.close("close");
  await expect(f.services.reader.heads()).rejects.toThrow("closed");
  expect(f.reader.close).not.toHaveBeenCalled();
  release(f.handle);
  await opening;
  await closing;
  expect(f.reader.close).toHaveBeenCalledExactlyOnceWith(f.handle);
});

it("retains failed handle cleanup for an explicit close retry", async () => {
  const f = fixture();
  await f.services.reader.open("operation");
  f.reader.close.mockRejectedValueOnce(new Error("Unconfirmed close"));
  await expect(f.services.close("close")).rejects.toThrow("Unconfirmed");
  await f.services.close("close");
  expect(f.reader.close).toHaveBeenCalledTimes(2);
  expect(f.reader.open).toHaveBeenCalledOnce();
});

it("closing one workspace neither stops backup nor closes another workspace's handles", async () => {
  const first = fixture(),
    second = fixture();
  await first.services.reader.open("first");
  await second.services.reader.open("second");
  await first.services.close("reload");
  expect(second.reader.close).not.toHaveBeenCalled();
  expect(first.services.backup).toBeUndefined();
  await second.services.reader.heads();
  await second.services.close("close");
});
