import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { imageKey } from "./validation/model.mjs";
import { cachePlan } from "./validation/cache.mjs";

test("JavaScript manifest changes preserve the real tool-image and native cache identities", async () => {
  const { imageInputs } = await import("./validation/images.mjs");
  const directory = await mkdtemp(join(tmpdir(), "lapis-validation-image-"));
  await mkdir(join(directory, "scripts/validation"), { recursive: true });
  const files = {
    "scripts/validation/Dockerfile": "FROM immutable-toolchain",
    "scripts/validation/install-tools.mjs": "const pin = 'verified';",
    "package.json": '{"packageManager":"pnpm@10.34.5"}',
    "pnpm-lock.yaml": "javascript-one",
    "pnpm-workspace.yaml": "packages: []",
  };
  try {
    for (const [path, contents] of Object.entries(files))
      await writeFile(join(directory, path), contents);
    const image = () =>
      imageInputs(directory).then((inputs) =>
        imageKey({ ...inputs, arch: "x86_64", target: "full" }),
      );
    const first = await image();
    const plan = (image, pnpmLock) =>
      cachePlan({
        image,
        workspace: "same-workspace",
        pnpmLock: Buffer.from(pnpmLock),
        cargoLock: Buffer.from("same-core"),
      });
    const before = plan(first, files["pnpm-lock.yaml"]);
    for (const path of [
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
    ]) {
      await writeFile(join(directory, path), "new JavaScript graph");
      assert.equal(await image(), first, `${path} is not a tool build input`);
    }
    const after = plan(await image(), "new JavaScript graph");
    assert.equal(before.keys.native, after.keys.native);
    assert.notEqual(before.keys.javascript, after.keys.javascript);
    for (const path of [
      "scripts/validation/Dockerfile",
      "scripts/validation/install-tools.mjs",
    ]) {
      await writeFile(join(directory, path), "changed immutable tool pin");
      assert.notEqual(await image(), first, `${path} must fence tool images`);
      await writeFile(join(directory, path), files[path]);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
