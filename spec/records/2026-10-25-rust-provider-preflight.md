# Actual provider transport preflight

Status: two native transport boundaries pass; R2.3 application acceptance remains
Working. No production implementation or host default changes in this slice.

## Exact target and scope

The new opt-in target runs an actual Codex ACP turn through the existing native
Rust HTTP host with two isolated vaults, an isolated profile and an ephemeral
owner password and bearer token. It uses an operator-owned agent installation,
not browser-supplied executable/environment fields. Only a nonce-only read-only
prompt is sent; no file/tool write is requested.

```sh
LAPIS_SERVER_PROVIDER_TEST=1 \
LAPIS_SERVER_TEST_AGENTS_CONFIG="$PWD/.local/qualification/provider-agents.json" \
node --test --test-concurrency=1 scripts/qualification/hosted-provider.test.mjs
```

`LAPIS_SERVER_TEST_BINARY` optionally selects the native Rust executable; the
default is `.local/rust-core-target/debug/lapis-server`. `LAPIS_SERVER_TEST_TARGET`
and `LAPIS_SERVER_TEST_MODEL` default to `codex` and `gpt-5.6-sol`. The JSON file
uses the existing operator `AgentConfig` contract. It remains ignored and no
credentials or user profile are transferred to Docker. The test skips unless
explicitly enabled. Actual-provider tests are not portable browser/catalog gates.

## Before and after

Two initial harness startup attempts fail closed: the first omitted required
owner bootstrap for the fresh profile; the second used `127.0.0.1` instead of
`localhost` for the explicit insecure-cookie origin. The fixture now supplies
the same isolated bootstrap and localhost contract as retained browser tests.
No authentication restriction is weakened and no production fix is needed.

The exploratory scenario passes. The exact checked-in leaf then passes **one
case, zero failures**, in 7.50 seconds. It proves durable acceptance, deletion of
the last viewing client while the record is Running, completion without that
client, exact response readback and another vault's inability to read the turn.
The process stops normally. A cold native process retains the exact record and
portable transcript; submitting the same request identity returns the same
record without changing the transcript hash.

Receipt: `.local/core-hosted-provider-SWV0hf/receipt.json`.
Request: `ea04a0ba-6a2f-4c4e-ae47-ca23a708a3cb`.
Accepted at 17:32:50.852 UTC, detached Running at 17:32:50.860, completed at
17:32:55.885, and cold/idempotent retained at 17:32:57.409 on 2026-10-25.
Transcript SHA-256:
`6b0f970ad053f4275f904391a18737c9fa3c0957c154574e37bc829bf49ed620`.
Existing native server executable SHA-256:
`e8bfe221b7bec9130a0541f0989a1117ca3f9e5706f7549fc50e5d8e1f769e90`.
These checks do not claim a rebuild or admission of the pending UI dependency
cohort.

The corresponding actual Tauri/Core transport test passes one case in 33.15
seconds; [Desktop E-CORE-024](../../../lapis-desktop/spec/src/history/E-CORE-024.md)
retains its exact binary, command and receipt separately.

## Retained-screen default option gap

A separate actual-provider probe sends exactly the current native chat observer's
options (`mode: ask`, model unset). It has **one failure**:
`native_mode_not_admitted`, before provider prompt dispatch. Codex advertises
`read-only`, not `ask`; the source observer currently sends the same literal mode
for every target. This is an existing staged R2 integration gap, independent of
the Docker/Design Core dependency intake. The native launch/configuration guard
correctly refuses the unsupported mode.

The failed probe is retained as
`.local/qualification/core-hosted-provider-default-options.mjs` and its isolated
receipt. R2.3 remains Working until native host policy preserves the intended
read-only product mode through the installed provider's declared configuration,
then both retained-screen application journeys pass. Do not fix this by dropping
the requested mode or silently accepting a provider's broader default.

## Remaining gate

R2.3 still requires actual providers through the retained application screens,
detach and cold recovery in both hosts. These direct transport tests do not
mount a chat view or replace those application checks. They do not qualify the
provider matrix, app tools, Linux delivery, signing or distribution. Renderer AI
and Node serving remain the defaults. The new source test's formatting, skip
path and final specification checks are recorded with the slice commit.
