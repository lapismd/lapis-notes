# ARCH — Part 2 verification

<!-- prettier-ignore -->
| ID | Chapter | Status | Evidence |
| --- | --- | --- | --- |
| LN-ARCH-083 | [architecture](../architecture/application-ownership.md#ln-arch-083) | Implemented | Plugin construction, public-export, adapter, App-tool, and restricted-session tests keep durable memory in the App while ACP/native agents receive only provider-neutral context blocks, search tools, and bounded proposals. |
| LN-ARCH-096 | [architecture, packages, server-deno-host](../architecture/host-boundaries.md#ln-arch-096) | Implemented | Host-services Deno checks and 29 kernel tests plus 177 desktop tests verify shared filesystem, watch, resource, plugin-asset, language, and database-worker kernels while desktop retains window events, folder selection, and lifecycle policy. |
| LN-ARCH-097 | [architecture, server-deno-host](../architecture/application-ownership.md#ln-arch-097) | Implemented | Server type checks, browser transport regressions, router generation and role tests, and the real Deno.serve smoke verify virtual-root translation and resumable tRPC control alongside strict direct authenticated file bytes, conditional writes, and stable error mapping. |
