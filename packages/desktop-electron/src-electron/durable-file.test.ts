import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { appendTextFileDurable, writeTextFileAtomic } from "./durable-file";

const temporaryDirectories: string[] = [];

function createTemporaryDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "lapis-durable-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("durable desktop text files", () => {
  it("atomically replaces text without leaving a same-directory temporary file", () => {
    const directory = createTemporaryDirectory();
    const filePath = path.join(directory, "nested", "metadata.yaml");

    writeTextFileAtomic(filePath, "first");
    writeTextFileAtomic(filePath, "second");

    expect(fs.readFileSync(filePath, "utf8")).toBe("second");
    expect(fs.readdirSync(path.dirname(filePath))).toEqual(["metadata.yaml"]);
  });

  it("creates and appends text without replacing the destination", () => {
    const directory = createTemporaryDirectory();
    const filePath = path.join(directory, "nested", "transcript.jsonl");

    appendTextFileDurable(filePath, "one\n");
    appendTextFileDurable(filePath, "two\n");

    expect(fs.readFileSync(filePath, "utf8")).toBe("one\ntwo\n");
  });
});
