# Close rejected HTTP/1 upload connections

Date: 2026-10-24. Discovered while widening native projection storage checks.

The first complete native run passed 22 HTTP cases and failed one: the request
after an oversized chunked upload reused a socket that closed with a broken
pipe. The unchanged upload case passed on an isolated rerun. The source returned
an early error without marking that HTTP/1 connection non-reusable, even though
upload bytes could still be in flight.

The existing exact upload test now also asserts `Connection: close` on its 413
response. Before the fix that deterministic assertion fails: zero pass, one
failure, 22 filtered. The file-write HTTP adapter now closes failed HTTP/1
connections while retaining their status and typed error body. HTTP/2 receives
no prohibited connection header. Successful writes retain normal connections.
File staging/publication and writer guards are unchanged.

`pnpm rust:core -- test -p lapis-server --test http_files --locked
streams::transfers::interrupted_and_oversized_uploads_cannot_publish_partial_bytes
-- --exact` passes the strengthened case, including the following detach request.
No automatic request retries, test delays or relaxed assertions were added.

The complete `pnpm test:rust-core` rerun passes 107 Rust cases, including all 23
HTTP cases and both cold server-process cases, plus five boundary regressions.
`pnpm check:rust-core` and `pnpm build:rust-core` pass. Final full-run log:
`.local/rust-db-projections-tests-final.log`.

Logs: `.local/rust-db-projections-tests.log`,
`.local/rust-db-projections-upload-exact.log`,
`.local/rust-upload-connection-{before,after}.log`.
This is a transport regression repair within R1.3. It does not qualify the
hosted shell or broaden native database adoption.
