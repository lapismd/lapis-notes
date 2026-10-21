import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { bootstrapFirstUser, verifyPassword } from "./auth.ts";
import { ControlDatabase } from "./control-database.ts";

const temporary: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporary
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("control database", () => {
  it("bootstraps once and models vault ownership independently per user", async () => {
    const directory = await mkdtemp(join(tmpdir(), "lapis-control-"));
    temporary.push(directory);
    const passwordFile = join(directory, "bootstrap-password");
    await writeFile(passwordFile, "correct horse battery staple\n", {
      mode: 0o600,
    });
    const control = await ControlDatabase.open(
      join(directory, "control.turso"),
    );
    try {
      const env = {
        LAPIS_SERVER_BOOTSTRAP_USERNAME: "owner",
        LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE: passwordFile,
      };
      await expect(bootstrapFirstUser(control, env, 1_000)).resolves.toBe(true);
      await expect(bootstrapFirstUser(control, env, 2_000)).resolves.toBe(
        false,
      );
      const owner = await control.findUser("OWNER");
      expect(owner).toBeDefined();
      await expect(
        verifyPassword("correct horse battery staple", owner!.passwordHash),
      ).resolves.toBe(true);

      const secondUserId = crypto.randomUUID();
      await control.createUser({
        id: secondUserId,
        username: "second",
        passwordHash: owner!.passwordHash,
        now: 3_000,
      });
      const vaultId = crypto.randomUUID();
      await control.createVault({
        id: vaultId,
        name: "Owner vault",
        ownerId: owner!.id,
        now: 4_000,
      });
      await expect(control.membership(vaultId, owner!.id)).resolves.toBe(
        "owner",
      );
      await expect(
        control.membership(vaultId, secondUserId),
      ).resolves.toBeUndefined();
      await expect(control.listVaults(secondUserId)).resolves.toEqual([]);
    } finally {
      await control.close();
    }
  }, 30_000);
});
