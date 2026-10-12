import assert from "node:assert/strict";
import test from "node:test";

import {
  buildContainerArgs,
  hasCompleteRemoteCache,
  nativeLinuxPlatform,
} from "./lib/ci-container.mjs";

const options = {
  root: "/repo",
  image: "ghcr.io/lapismd/lapis-notes-ci@sha256:abc",
  lockfileSha256: "1".repeat(64),
  packageDirectories: ["workspace", "api"],
  platform: "linux/arm64",
};

test("local container uses native Linux architecture", () => {
  assert.equal(nativeLinuxPlatform("arm64"), "linux/arm64");
  assert.equal(nativeLinuxPlatform("x64"), "linux/amd64");
});

test("remote cache is enabled only with all four settings", () => {
  assert.equal(hasCompleteRemoteCache({ TURBO_TOKEN: "token" }), false);
  assert.equal(
    hasCompleteRemoteCache({
      TURBO_API: "https://cache.example",
      TURBO_TEAM: "lapismd",
      TURBO_TOKEN: "token",
      TURBO_REMOTE_CACHE_SIGNATURE_KEY: "signature",
    }),
    true,
  );
});

test("container forwards remote-cache names without embedding values", () => {
  const args = buildContainerArgs({ ...options, remoteCache: true });
  assert.ok(args.includes("TURBO_TOKEN"));
  assert.equal(
    args.some((arg) => arg.includes("signature-value")),
    false,
  );
  assert.ok(
    args.includes(
      "lapis-notes-api-node-modules-1111111111111111:/workspace/packages/api/node_modules",
    ),
  );
});

test("container omits remote names for a secretless run", () => {
  const args = buildContainerArgs({ ...options, remoteCache: false });
  assert.equal(args.includes("TURBO_TOKEN"), false);
});
