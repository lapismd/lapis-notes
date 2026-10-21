import { afterEach, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { NativeCompanion } from "./companion.ts";

const roots: string[] = [];
const children: NativeCompanion[] = [];
afterEach(async () => {
  await Promise.all(children.splice(0).map((child) => child.close()));
  await Promise.all(
    roots.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "lapis-supervision-"));
  roots.push(root);
  const child = await NativeCompanion.start({
    executable: process.execPath,
    args: [fileURLToPath(new URL("./test-fixture.mjs", import.meta.url))],
    dataRoot: root,
    requestTimeoutMs: 300,
  });
  children.push(child);
  return child;
}
it("retains exact inner text and awaits acknowledged native shutdown", async () => {
  const child = await fixture();
  const frame = '{"version":1,"data":{"value":18446744073709551615}}';
  expect(
    await child.request({
      method: "history",
      scope: "session",
      operation: "echo",
      frame,
    }),
  ).toBe(frame);
  expect(await child.close()).toEqual({ graceful: true });
  expect(await child.close()).toEqual({ graceful: true });
  await expect(child.request({ method: "ping" })).rejects.toThrow();
});
it("rejects outstanding and queued work after exit without replay", async () => {
  const child = await fixture();
  const first = child.request({
    method: "history",
    scope: "session",
    operation: "exit",
    frame: "{}",
  });
  const queued = child.request({ method: "ping" });
  const outcomes = await Promise.allSettled([first, queued]);
  expect(outcomes.map((result) => result.status)).toEqual([
    "rejected",
    "rejected",
  ]);
  expect(await child.close()).toEqual({ graceful: false });
});
it("retires the process after an uncertain timed-out response", async () => {
  const child = await fixture();
  await expect(
    child.request({
      method: "history",
      scope: "session",
      operation: "hang",
      frame: "{}",
    }),
  ).rejects.toThrow(/uncertain/i);
  await expect(child.request({ method: "ping" })).rejects.toThrow();
  expect(await child.close()).toEqual({ graceful: false });
});
it("refuses invalid response identities instead of accepting unrelated work", async () => {
  const child = await fixture();
  await expect(
    child.request({
      method: "history",
      scope: "session",
      operation: "wrong-id",
      frame: "{}",
    }),
  ).rejects.toThrow(/response/i);
  expect(await child.close()).toEqual({ graceful: false });
});
