# API Package Spec

Canonical rendered spec: [Packages](../../spec/src/packages.md) and
[Architecture](../../spec/src/architecture.md).

## Purpose

`@lapis-notes/api` is the shared runtime kernel. It owns the application service
container, vault and database abstractions, workspace model, view hierarchy,
plugin runtime, command/keymap system, metadata cache, search-query parser,
settings/configuration primitives, event helpers, and editor abstractions.

Host applications and plugins are out of scope for this minimal monorepo until
tracked in root `MIGRATION.md` and specified under `spec/src/`.
