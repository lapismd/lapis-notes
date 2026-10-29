# Desktop review for shared Rust services

Reviewed 2026-10-23 against Desktop `40a5d97c` (default workspace), Notes
`e159faad` and committed hosted-services `593abc65`. The hosted-services working
change `vlvosxvo` remains unfinished and is not the implementation baseline.

## Recent desktop changes

- M15.1 now consumes complete public `@lapismd/agent-ui` and
  `@lapismd/repository-ui` screens. Existing Notes view registrations remain.
  Rust service work must replace underlying adapters, not these screens.
- The shared-screen work retains host Markdown hooks, file/agent links, exact
  first-send recovery and private drafts. A captured provider error must remain
  correlated with its original attempted send and newly created conversation.
- Durable queue serialization now preserves explicit provider-default effort.
  Rust configuration and queue ports must retain omission versus saved values.
- Workspace host disposal joins asynchronous projection while views are live,
  captures exact live state, awaits shell cleanup, then retires plugins. Shared
  services must preserve dirty buffers and pinned history through that barrier.
- Imports retain native capture feedback. Shared history cards retain author
  actions, explicit navigation and the original operation/revision identities.

## Remaining coupling

Desktop `AiApplication`, `AiMaintenance`, `MemoryMaintenanceScheduler` and
`ConversationIndexCoordinator` still own work through renderer App lifetime.
The native tool bridge still invokes JavaScript App-tool registrations.
Metadata cache/projection reconciliation and history-index scheduling also have
client owners. Native imports, Compute, backups and terminal engines already
exist; their reusable engines and host lifetime need separate treatment.

Window policy, credential admission, native menu/chrome and renderer document
state remain host/client concerns. Their presence in Tauri or TypeScript does
not by itself indicate misplaced service ownership.

## Qualification inherited, not repeated or waived

Desktop E-SHARED-007 records integration into the main workspaces: 19 archive
hashes/70 routes, seven teardown cases and three cold review stories passed.
One complete dark-desktop AI/repository mode passed 440 cases before integration.
Its record retains incomplete matrix, ordinary bundle and static-catalog gates;
M15.1 remains In progress. These results do not complete the four-mode matrix,
original provider/tool/Compute gates or visual approval.

The current source audit is read-only; it does not reproduce a new functional
failure. The extraction's before/after target is the existing native vault
suite, including conditional writes, crash staging, traversal/symlinks, watches,
admission, resources and signed plugin assets. Its evidence will record actual
commands and results separately from this review.

## Implementation decision

Start from the qualified default workspaces as required by the shared-screen
integration contract. Extract the existing vault file engine into Notes-owned
Rust code and update Desktop callers directly. Retain desktop profiles, menus,
resources and system-action policy. No compatibility re-export or copied vault
implementation remains at the old location.

R1.1 qualifies this shared engine and its desktop consumer only. Service-owned
vault/client lifetimes, HTTP authentication and UI read/edit acceptance remain
R1.2/R1.3. The plan must not count an engine extraction as completed hosted use.
