# Architecture / Admitted native History reader

The R3.2.3.5 intake reuses `jj-history-service` and the retained Repository
screen. Core owns one bounded reader executor per selected vault; HTTP and
workspace views are transport and observation adapters. This slice reads the
managed backup source only. Original-source selection and guarded restore remain
[R3.2.3.6](rust-history-parity.md); optional legacy revision capture is Deferred.

## LN-CORE-016 — Immutable admitted Repository reads

<a id="ln-core-016"></a>

**Requirement.** Native Repository reads MUST reuse `jj-history-service` and its version-one text frames.
Admission MUST derive the live client, vault, generation and physical managed
backup source. Reads MUST NOT capture, initialize, recover or reconcile a
repository. Missing history MUST return empty heads; replaced or unavailable
sources MUST fail closed.

Source validation retains Desktop's manifest, directory and type-file witnesses,
using the current installed layout from `BackupStorage`. A source replacement
cannot revive an old handle. Cache paths remain installation-owned and outside
vault contents. Immutable operation, commit and complete path identities remain
unchanged. Existing generic limits bound preparations, handles, content and queries.

## LN-CORE-017 — Native read scope lifetime

<a id="ln-core-017"></a>

**Requirement.** The native reader MUST bound accepted requests and own their
execution independently of HTTP waiters. Client retirement MUST immediately
fence admission and drain its preparations, reads and handles, including when
another request retains the Client. Vault close MUST join the reader before
returning success. Failed final capture MUST retain the original reader for an
explicit repaired close.

The native read queue serializes admission and scope revocation. Accepted work
uses the existing vault drain leases. Passive observer detach neither stops
backup nor disables indexing. Per-client scope revocation cannot close another
client's handles. Core owns executor cleanup even when a caller abandons its
response. Native close remains a blocking operation run outside host executors.

## LN-CORE-018 — Shared lossless History boundary

<a id="ln-core-018"></a>

**Requirement.** History adapters MUST preserve the public lossless SDK and
bounded version-one request and response text. They MUST NOT parse successful
inner frames through ordinary JavaScript JSON, copy the query engine or replace
native query diagnostics with generic I/O failures. Hosted read errors MUST
retain actionable native diagnostic fields without exposing filesystem authority.

The web host consumes published `@lapismd/jj-history` at `~0.1.0`. Notes Cargo
still uses jj-store crate paths because that repository has no crate tag.
Publishable API and plugin manifests keep portable registry ranges.
