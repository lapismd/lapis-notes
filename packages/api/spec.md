# API Package Spec

Canonical rendered spec: [Packages](../../spec/src/packages.md) and
[Architecture](../../spec/src/architecture.md).

Start with [App and services](../../spec/src/packages/app-and-services.md),
[Vault and storage](../../spec/src/packages/vault-and-storage.md), or
[Editor APIs](../../spec/src/packages/editor-apis.md) for the owning contract.

## Purpose

`@lapis-notes/api` is the shared runtime kernel. It owns the application service
container, vault and database abstractions, workspace model, view hierarchy,
plugin runtime, command/keymap system, metadata cache, search-query parser,
settings/configuration primitives, event helpers, and editor abstractions.

Host policy belongs to the desktop, web, and server topics. Independently
versioned plugins remain governed by their owning repositories; their Lapis
integration requirements live under `spec/src/plugins/`.
