# Backlog / Legacy plugin ports

## Current ownership

The original 2026-10-25 audit compared legacy revision 8ec68e18 with the then
current applications. Its statement that PDF, CSV/TSV and Canvas lacked current
counterparts is superseded: all three have packages and canonical contracts in
lapis-plugins, inspected at source revision 6a9b678a on 2026-10-30. Notebook has
its own staged implementation repository. Source existence, qualification,
publication and host-profile adoption remain separate.

Current feature status belongs to the owning contracts and verification, not a
second Notes port checklist:

- [PDF](https://github.com/lapismd/lapis-plugins/blob/main/spec/src/plugins/pdf/index.md):
  vault file viewer and note embed exist; the owner retains deferred viewer
  settings and real web/native resource qualification.
- [CSV/TSV](https://github.com/lapismd/lapis-plugins/blob/main/spec/src/plugins/csv/index.md):
  table, source and canvas-sheet behavior is specified and implemented in the
  owning package. Remaining capabilities and host qualification follow its
  current requirements, rather than the old first-table proposal.
- [Canvas](https://github.com/lapismd/lapis-plugins/blob/main/spec/src/plugins/canvas/index.md):
  JSON Canvas file views, nodes/connectors, parse/save and read-only note embeds
  exist. Package publication and application-profile adoption remain separate.
- [Notebook](https://github.com/lapismd/lapis-plugin-notebook/blob/main/spec/src/plugins/notebook/index.md):
  the standalone repository owns staged runtime, execution, cancellation,
  persistence and worker/host contracts and its verification table. Its private
  parser, DuckDB/WASM, input, standard-library and worker packages are not new
  Notes workspace intake. Native query services need separate specification.

The historical product order was PDF, CSV/TSV, then Canvas. It is no longer a
list of three unimplemented ports. Notes/Desktop integration must consume the
owners' verified public outputs and qualify their actual host surfaces.

## Remaining proposals

### Telemetry diagnostics

Disposition: optional engineering workstream. The retained API's no-op service
does not provide a real collector. Choose collector and host ownership before
porting diagnostics UI, trace tables, span waterfalls, measurements, settings or
persistence. The source reference is legacy packages/plugins/plugin-telemetry,
with runtime lapis-telemetry and diagnostics view plugin:diagnostics.

### Univer Docs and Sheets

Disposition: deferred until a concrete .lapisdoc or .lapissheet workflow is
requested. The legacy package used runtime lapis-docs and view docs-document.
The current Docs plugin uses that view name for Markdown documents/cards/review,
so a future Univer port must resolve persisted identity overlap and product
naming first. Embedded React/Univer assets, measured startup, focus/theme,
snapshot persistence and visible save recovery require their own contract.

Legacy Univer did not supply Office exchange. DOCX/XLSX/PPTX import/export is
outside its inherited scope; current dedicated file-format plugins are separate
features and must not be described as unimplemented Univer functionality.

### Tasks compatibility

Disposition: selective parity audit of the existing Tasks implementation.
The legacy TaskNotes model, Fizzy workflows and task-specific Bases integration
are candidates for individual additions, not another whole-plugin port. Compare
models/storage and select useful behavior with fixtures before claiming
compatibility. The separately versioned Tasks package owns any implementation.

## Host intake and acceptance

[Package intake](../packages/editor-apis.md#ln-pkg-004) still requires the owning
contract and explicit application authorization. This page does not add a plugin
to a host profile. Notes and Desktop retain routing, vault/persistence admission
and adapters; reusable plugin behavior belongs upstream.

For a selected plugin, qualify verified public exports, real file views and note
embeds, settings, dirty/saved content, resource ownership, disposal, close/reload
and each affected browser/native host. Source Storybook alone cannot qualify
native URLs or distribution. Preserve keyboard, interaction and accessibility
checks; visual baselines and publication keep their separate approval gates.
