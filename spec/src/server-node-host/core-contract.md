# Hosted Server / Integration contracts

Server integration requirements moved to the lapis-server specification:
<https://lapismd.github.io/lapis-server/>.

Shared browser-client behavior remains in
[the hosted client](../web-host/hosted-client.md). Shared observation streams
remain in
[Rust hosted runtime delivery](../architecture/rust-hosted-delivery.md).

The public generated plugin host module catalog includes CanvasTable, FilterBuilder and ToggleGroup for Notebook. The Node host consumes the same audited catalog and shared Svelte renderer; this intake does not change server routing or application services.
