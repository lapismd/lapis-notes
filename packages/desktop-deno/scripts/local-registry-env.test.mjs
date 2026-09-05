import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { resolveDesktopLocalRegistryEnvironment } from "./local-registry-env.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "lapis-local-registry-"));
  const packageRoot = path.join(root, "lapis-notes/packages/desktop-deno");
  const fixturePath = path.join(
    root,
    "lapis-community/.local/registry-fixture/fixture.env",
  );
  await mkdir(path.dirname(fixturePath), { recursive: true });
  await writeFile(
    fixturePath,
    `REGISTRY_CURATOR_PUBKEYS=${"a".repeat(64)}\nREGISTRY_PUBLISHER_PUBKEYS=${"b".repeat(64)}\n`,
  );
  return { packageRoot };
}

describe("Deno desktop local registry environment", () => {
  it("discovers the Community Docker fixture for registry and Community data", async () => {
    const { packageRoot } = await fixture();

    await expect(
      resolveDesktopLocalRegistryEnvironment({}, packageRoot),
    ).resolves.toEqual({
      values: {
        VITE_LAPIS_NOSTR_REGISTRY_RELAYS: "ws://registry.localhost:8281",
        VITE_LAPIS_NOSTR_CURATOR_PUBKEYS: "a".repeat(64),
        VITE_LAPIS_NOSTR_INSTALL_QUORUM: "1",
        VITE_LAPIS_NOSTR_BLOSSOM_URL: "http://127.0.0.1:8090",
      },
      source: "local-fixture",
      relayUrl: "ws://registry.localhost:8281",
    });
  });

  it("keeps an explicitly configured registry instead of mixing identities", async () => {
    const { packageRoot } = await fixture();

    await expect(
      resolveDesktopLocalRegistryEnvironment(
        { VITE_LAPIS_NOSTR_REGISTRY_RELAYS: "wss://relay.example" },
        packageRoot,
      ),
    ).resolves.toEqual({ values: {}, source: "configured" });
  });

  it("honors a custom local Docker relay port", async () => {
    const { packageRoot } = await fixture();

    const result = await resolveDesktopLocalRegistryEnvironment(
      { LAPIS_RELAY_PORT: "8381", REGISTRY_FIXTURE_PORT: "8190" },
      packageRoot,
    );

    expect(result.relayUrl).toBe("ws://registry.localhost:8381");
    expect(result.values.VITE_LAPIS_NOSTR_BLOSSOM_URL).toBe(
      "http://127.0.0.1:8190",
    );
  });
});
