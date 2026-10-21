import { strict as assert } from "node:assert";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { NativeCompanion } from "./companion.ts";

const execute = promisify(execFile);
const root = await mkdtemp(join(tmpdir(), "lapis-native-smoke-"));
let child: NativeCompanion | undefined;
try {
  const vaults = [randomUUID(), randomUUID()];
  for (const vault of vaults) {
    const content = join(root, "vaults", vault, "content");
    await mkdir(content, { recursive: true });
    const jj = (args: string[]) =>
      execute(
        "jj",
        [
          "--no-pager",
          "--config",
          "user.name='Fixture'",
          "--config",
          "user.email='fixture@invalid'",
          ...args,
        ],
        {
          cwd: content,
          env: {
            ...process.env,
            JJ_CONFIG: "/dev/null",
            GIT_CONFIG_NOSYSTEM: "1",
            GIT_CONFIG_GLOBAL: "/dev/null",
          },
        },
      );
    await jj(["git", "init", "--colocate"]);
    await writeFile(join(content, "note.md"), `Vault ${vault}\n`);
    await jj(["describe", "-m", "Native bridge smoke"]);
  }
  child = await NativeCompanion.start({
    executable: fileURLToPath(
      new URL(
        "../../../server-native/target/debug/lapis-notes-native",
        import.meta.url,
      ),
    ),
    dataRoot: root,
  });
  for (const vault of vaults) {
    assert.equal(
      await child.request({
        method: "bind",
        scope: "owner-session",
        vault,
        generation: 1,
        source: "original",
      }),
      "bound",
    );
    const output = await child.request({
      method: "history",
      scope: "owner-session",
      operation: "heads",
      frame: JSON.stringify({ version: 1, data: { vault } }),
    });
    const frame = JSON.parse(output) as {
      version: number;
      data: { heads: string[] };
    };
    assert.equal(frame.version, 1);
    assert.equal(frame.data.heads.length, 1);
    await assert.rejects(
      child.request({
        method: "history",
        scope: "other-session",
        operation: "heads",
        frame: JSON.stringify({ version: 1, data: { vault } }),
      }),
    );
  }
  assert.equal(
    await child.request({ method: "revoke", scope: "owner-session" }),
    "revoked",
  );
  assert.deepEqual(await child.close(), { graceful: true });
  console.log(
    "Native Node-to-Rust smoke passed: two real vaults, isolated scopes and confirmed shutdown",
  );
} finally {
  await child?.close();
  await rm(root, { recursive: true, force: true });
}
