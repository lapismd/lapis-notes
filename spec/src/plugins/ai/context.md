# AI integration / Context

The external `@lapis-notes/ai` package, shared-controller adapters and duplicate
Notes catalog are retired. Their original context and implementation-specific
requirements are retained in
[the historical archive](../../../archive/2026-11-17-shared-ai-implementation-contracts.md).
They do not describe the current native transport or authorize restoring an old
package, Fake runtime class, controller process or attach settings.

## Current source owners

- Notes App Profile owns `createNativeChatPlugin` under
  `packages/app-profile/src/native-chat`. Hosts inject its typed native authority;
  the profile observes native turns rather than creating a renderer execution
  engine. Shared native participant contracts remain in the architecture topics.
- Desktop owns its retained `AiPlugin`, presentation, settings, conversation and
  memory integration. Its ACP adapter consumes the public `@lapismd/ai` client;
  native admission and execution belong to its Rust host and shared services.
  Desktop's current requirements and coverage ledgers govern that implementation.
- Notes API owns transport-neutral tool, skill-source, composer-command and
  result-view registries, plus Vault-backed file tools using the portable
  `@lapismd/ai-host/file-tools` kernel. Search and other domain plugins own their
  contributions. Removing the shared AI package does not remove those contracts.
- The standalone controller remains for the explicitly excluded consumers. Its
  current contracts belong to that service and do not authorize restoring the
  retired Notes host or replacing Tauri's native implementation.

## Data and acceptance boundaries

Both native plugin compositions retain identity `ai`; that identity is not an
instruction to uninstall or delete saved state. Desktop reads prior disabling
preferences, and its retained plugin can load the former external data file.
Saved settings, conversations and memory remain preservation obligations.
Actual old-external/bundled startup, Safe Mode and cold native acceptance remain
the host's gate; source inspection and copied coverage do not complete it.

Desktop's production `NativeUserAgentsStore` uses admitted native commands.
The deleted shared package's optional Node user-agent store is not a current
renderer dependency. Its old public-export requirement is archived separately
from current user-command behavior and native storage qualification.

The remaining feature topics retain conversation, presentation, tools, memory
and parity concerns pending their caller-aware ownership reconciliation. Old
shared-plugin verification rows are historical source evidence, not proof of
current native or provider qualification. Retiring the 16 obsolete implementation
requirements does not declare that broader audit complete.
