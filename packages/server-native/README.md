# Private Notes native companion

Node owns authentication, membership and HTTP. This private executable has one
supervised parent connection over a mode-0600 Unix socket in a mode-0700
directory. It exposes no TCP listener. Parent disconnect drains history workers;
a lost reply is never retried automatically.

The host admits opaque caller/vault scopes before sending version-one inner
history frames as text. Every operation uses `jj-history-service`. Source
identity witnesses are adapted from Desktop `8990cb57`,
`src-tauri/src/repository/source.rs`; Notes owns the managed-root policy.
Original history uses `content/.jj/repo`; external backup uses `history/repo`
with its native `vault.json` binding. Reads never initialize either source.
Mutable indexes remain disposable and separate from persistent history.

Run `pnpm server:native -- test --locked` for real temporary repository tests.
The development build uses sibling JJ Store source; extraction baseline
`f58b9363` is required. There is no public crate or npm release in this slice.
Browser routing, backup and restore remain H03.
