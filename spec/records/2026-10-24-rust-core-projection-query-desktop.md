# Desktop compatibility for native projection queries

Date: 2026-10-24. Desktop `26989b92`, Notes native source `5deb28b0`.
Source query qualification remains in the independent
[native intake record](2026-10-24-rust-core-projection-queries.md); retained
Memory/Turso and Storybook evidence remains in the
[reference record](2026-10-24-projection-query-reference.md).

Desktop E-CORE-007 qualifies the dependency graph with its existing database
adapter. The exact locked service target initially refuses the old graph before
runtime cases, because Core now requires ICU 2.4 and two direct dependencies.
The consumer lock now retains the thirteen ICU 2.4 packages and their four
required supporting updates. Unrelated resolver-proposed version/edge changes
were restored. No package identities were added or removed.

Consumer qualification:

- Exact `core_file_service`: **two passed / zero failed**.
- Complete Rust suite: **230 passed / zero failed**.
- Strict normal and `e2e` Clippy: both pass.
- Canonical specification: **four lanes** pass; progress validates **45 tasks**
  and **272 evidence records**. Changed-document formatting passes.

Commands, initial failures and logs are recorded in Desktop E-CORE-007 and its
`.local/core-db-projection-query-*` logs. The known compact-unwind linker warning
is unchanged. No app windows were launched, and no application was installed or
restarted.

AI remains clean at `6548afe0`; Terminal at `d7e0a7cd`. JJ Store's current
committed revision is `95d46e44`; its native crates/Cargo inputs are unchanged
from `47a73e13`. Its unrelated uncommitted documentation is preserved.

E-CORE-005 remains the complete Rust/three-cold-native qualification for Notes
`67a57aa9`. This new result qualifies Rust dependency/service compatibility with
`5deb28b0`; it does not widen WebView/UI/OS, provider, Linux or distribution
gates. Database-adapter adoption, task/cross-domain composition, remaining
catalogue methods and the original R1.3/R3 completion gates remain open.
