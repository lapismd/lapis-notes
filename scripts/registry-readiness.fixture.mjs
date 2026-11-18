// Test-only immutable public source fixture; production never downloads a fallback.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after } from "node:test";
import { pathToFileURL } from "node:url";
import {
  NOTES_READINESS_SOURCE,
  loadNotesReadiness,
} from "./lib/registry-consumer-install.mjs";

const hashes = {
  "registry-readiness.mjs":
    "480cf7d558c4ad0aa7cc31330f5f6cdc9b75d716e8a394304918a17ead68e30c",
  "registry-install-adapters.mjs":
    "4fe144e96ee430da4e500ab1f4798e94fd805b99c778e3c3aa8b72a42b5e233a",
  "registry-install-process.mjs":
    "ca445f151fc65fccab0a0a1dc31aa640f6ee52cfad5c4cb78e6d8f7abd350c88",
  "registry-install-diagnostics.mjs":
    "db5b913d442c4499b6998a9753991bd009766bcc443b8ed84ec38f359aba29e8",
};
let modulePath = process.env.LAPIS_REGISTRY_READINESS_MODULE;
let owned;
if (modulePath) {
  assert(
    path.isAbsolute(modulePath) &&
      path.basename(modulePath) === "registry-readiness.mjs",
  );
} else {
  owned = await mkdtemp(path.join(tmpdir(), "notes-shared-readiness-fixture-"));
  after(() => rm(owned, { recursive: true, force: true }));
  modulePath = path.join(owned, "registry-readiness.mjs");
}
for (const [name, expected] of Object.entries(hashes)) {
  let bytes;
  if (owned) {
    const response = await fetch(
      `https://raw.githubusercontent.com/lapismd/lapis-ci/${NOTES_READINESS_SOURCE}/scripts/${name}`,
      { redirect: "error", signal: AbortSignal.timeout(15000) },
    );
    assert.equal(response.status, 200, "Pinned shared fixture is unavailable");
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      assert(size <= 128 * 1024, "Unbounded shared fixture");
      chunks.push(chunk);
    }
    bytes = Buffer.concat(chunks);
  } else bytes = await readFile(path.join(path.dirname(modulePath), name));
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    expected,
    `Changed pinned fixture ${name}`,
  );
  if (owned) await writeFile(path.join(owned, name), bytes);
}
export const sharedReadiness = await loadNotesReadiness(modulePath);
export const sharedProcesses = await import(
  pathToFileURL(
    path.join(path.dirname(modulePath), "registry-install-process.mjs"),
  ).href
);
