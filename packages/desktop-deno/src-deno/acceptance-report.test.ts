import { expect, it, vi } from "vitest";
import { writeAcceptanceReport } from "./acceptance-report";

it("publishes a complete report only after writing finishes", async () => {
  const files = new Map<string, string>();
  let finish!: () => void;
  const writing = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const fileSystem = {
    writeTextFile: vi.fn(async (file: string, text: string) => {
      files.set(file, "");
      await writing;
      files.set(file, text);
    }),
    rename: vi.fn(async (from: string, to: string) => {
      files.set(to, files.get(from)!);
      files.delete(from);
    }),
    remove: vi.fn(async (file: string) => {
      files.delete(file);
    }),
  };
  const pending = writeAcceptanceReport(
    "/report.json",
    { ok: true },
    fileSystem,
  );
  await vi.waitFor(() =>
    expect(fileSystem.writeTextFile).toHaveBeenCalledOnce(),
  );
  expect(files.has("/report.json")).toBe(false);
  finish();
  await pending;
  expect(JSON.parse(files.get("/report.json")!)).toEqual({ ok: true });
  expect([...files.keys()]).toEqual(["/report.json"]);
});
