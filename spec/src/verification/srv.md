# SRV verification

Server-only requirements moved to the lapis-server specification:
<https://lapismd.github.io/lapis-server/>.
The rows below are the shared client requirements Notes still owns.

<!-- prettier-ignore -->
| ID | Chapter | Status | Evidence |
| --- | --- | --- | --- |
| LN-SRV-010 | [web-host](../web-host/hosted-client.md#ln-srv-010) | Planned | Remote adapter conformance covers successful process writes, one callback invocation, ETag conflict, and typed conflict errors. |
| LN-SRV-016 | [web-host](../web-host/hosted-client.md#ln-srv-016) | Implemented | Browser transport regression tests cover virtual-root stat, list, directory, rename, copy, removal, and trash requests while direct-route path validation remains server-owned. |
| LN-SRV-019 | [web-host](../web-host/hosted-client.md#ln-srv-019) | Implemented | Web composition keeps Nostr relay access in the client-side source adapter and adds no server registry endpoint, persistence, curator, or proxy. |
