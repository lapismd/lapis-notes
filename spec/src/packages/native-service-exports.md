# Packages / Native service exports

`@lapis-notes/api/native-turns` and
`@lapis-notes/api/native-history-index` export generated DTOs and admitted ports.
Their package export maps follow [LN-PKG-005](./releases-and-exports.md#ln-pkg-005);
registry and publication policy remains in [Releases and exports](./releases-and-exports.md).

Turns retain explicit continuation cursors, feature enable/disable and native
fence/drain policy. Indexed History retains bounded immutable start, status,
query and context operations.

The source-only queue port adds bounded accept/read/Stop/cancel and explicit
cold resume under [LN-CORE-032](../architecture/rust-queue-admission.md#ln-core-032),
preserving captures and receipts while excluding private operator snapshots.
Queue resume revalidates the exact current native predecessor.

The participant port adds exact authored/delivery records and acceptance-scoped
Stop/native-request cancel under
[LN-CORE-042](../architecture/rust-participants.md#ln-core-042). Optional complete
selected-profile snapshots, bounded read-only profile projection and exact-request
receipt discovery follow
[LN-CORE-046](../architecture/rust-participants.md#ln-core-046) through
[LN-CORE-048](../architecture/rust-participants.md#ln-core-048). Existing raw
requests and metadata-absent hosts retain their current behavior.

These ports grant no executable, physical-path, replay or renderer scheduling
authority. Source and actual host qualification remain separately recorded;
exports do not imply final publication, default cutover or installed-provider
acceptance.
