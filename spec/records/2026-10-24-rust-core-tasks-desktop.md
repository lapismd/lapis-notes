# Desktop compatibility for the native task facade

Date: 2026-10-24. Notes source `fa9581f0`; Desktop consumer `889121c6`.
The independent [task source record](2026-10-24-rust-core-tasks.md) qualifies
record/query/graph semantics and staged commit publication. Desktop E-CORE-008
qualifies its existing native consumer against that source, with no database
adapter adoption.

The exact locked service check initially refuses the prior graph: the shared
Core adds one direct Chrono edge. Offline refresh supplies that edge at the
already-selected **0.4.45**. Restore the unrelated proposed generator downgrade
and itertools removal. No versions, package identities or other edges change.

Consumer verification:

- Exact `core_file_service`: **two pass**, zero failed/ignored.
- Complete native Rust suite: **230 pass**, zero failed. The two subprocess
  helper functions remain ignored in direct enumeration and run through their
  parent restart/interruption tests.
- Strict normal and `e2e` Clippy: both pass.
- Canonical specification: **four lanes** pass. Progress retains **45 tasks**
  and now selects **273 evidence records**; changed-document formatting passes.
- Sources are committed at the recorded Notes, AI (`6548afe0`), Terminal
  (`d7e0a7cd`) and JJ Store (`95d46e44`) parents. JJ's native inputs are
  unchanged from `47a73e13`; its working copy is now clean.

Desktop `.local/core-db-tasks-*` logs and E-CORE-008 retain the commands,
initial locked/record-format/progress failures and exact passing reruns.
Standing cache approval permits the checked deletion of **43 obsolete native
test executables (0.666 GiB)**. Newest/current-run executables, libraries,
application binaries and all user data are preserved. The existing compact
unwind linker warning is unchanged.

No app window is opened or installed. This is native dependency compatibility,
not new UI/OS, provider, Linux or hosted qualification. E-CORE-005 retains the
complete Rust/three-cold-native qualification for Notes `67a57aa9`; neither
milestone gates nor visual baselines change. Cross-domain indexed mutations,
remaining memory/Search methods, host intake and original R1.3/R3 gates remain
open. R5 memory scheduling/maintenance is separate from database storage.
