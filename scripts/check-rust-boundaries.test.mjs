import assert from "node:assert/strict";
import { test } from "node:test";
import {
  auditDependencies,
  auditRustSources,
} from "./check-rust-boundaries.mjs";

test("permits native library policy and separately bounded test fixtures", () => {
  assert.deepEqual(
    auditRustSources([
      ["crates/lapis-app-core/Cargo.toml", '[dependencies]\ncap-std = "4"'],
      ["crates/lapis-app-core/src/vault/mod.rs", "use cap_std::fs::Dir;"],
      ["crates/lapis-app-core/tests/vault.rs", "assert!(true);\n".repeat(400)],
    ]),
    [],
  );
});
test("rejects transport dependencies and source references", () => {
  const errors = auditRustSources([
    [
      "crates/lapis-app-core/Cargo.toml",
      "[dependencies]\ntauri.workspace = true\n",
    ],
    ["crates/lapis-app-core/src/lib.rs", "use axum::Router;"],
  ]);
  assert.equal(errors.length, 2);
  assert.ok(errors.every((error) => error.includes("LN-CORE-001")));
});
test("distinguishes bare browser names from ordinary Rust struct fields", () => {
  for (const source of [
    "let text = partial.daily.document.text;",
    "let text = partial.daily . document . text;",
    "let field = payload.window.value;",
    "let field = payload.globalThis.value;",
    "let local = mydocument.value;",
  ]) {
    assert.deepEqual(
      auditRustSources([["crates/lapis-app-core/src/lib.rs", source]]),
      [],
      source,
    );
  }
  for (const source of [
    "window.location;",
    "document.body;",
    "globalThis.app;",
    "let value = document.body;",
    "globalThis.document.body;",
  ]) {
    assert.equal(
      auditRustSources([["crates/lapis-app-core/src/lib.rs", source]]).length,
      1,
      source,
    );
  }
});
test("rejects oversized source and host implementation routing", () => {
  const errors = auditRustSources([
    ["crates/lapis-app-core/src/lib.rs", "pub fn policy() {}\n".repeat(301)],
    ["crates/lapis-app-core/src/vault.rs", 'include!("../../desktop.rs");'],
  ]);
  assert.equal(errors.length, 2);
});

test("checks Cargo dependency identities even when aliases or target tables hide them", () => {
  const errors = auditDependencies([
    {
      name: "lapis-app-core",
      dependencies: [
        { name: "tauri", rename: "native" },
        { name: "lapis-desktop" },
        { name: "cap-std" },
      ],
    },
    { name: "lapis-server", dependencies: [{ name: "axum" }] },
  ]);
  assert.equal(errors.length, 2);
  assert.ok(errors.some((error) => error.includes("tauri")));
  assert.ok(errors.some((error) => error.includes("lapis-desktop")));
});

test("protocol cannot acquire core, host or aliased transport dependencies", () => {
  const errors = auditDependencies([
    {
      name: "lapis-app-protocol",
      dependencies: [
        { name: "axum", rename: "web" },
        { name: "lapis-app-core" },
      ],
    },
  ]);
  assert.equal(errors.length, 2);
});
