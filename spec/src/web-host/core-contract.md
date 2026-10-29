# Web Host / Browser integration

The staged Rust-only delivery journey serves the unchanged built Web application
through [CORE054–057](../architecture/rust-hosted-delivery.md), with the native
process owning the public origin and no Vite preview process. Existing login,
chooser, editor persistence and cold restart remain the actual consumer gate.

The Rust admitted client exposes generated native turn calls over the existing
versioned, authenticated transport. Closing that client detaches observations;
accepted native work continues. Submission errors retain their uncertainty
without automatic retry or fallback. The staged Rust profile registers the shared application-profile AI observer
as the optional `ai` identity. Its existing Agent screens read native state and
portable files; they never construct the previous browser transcript writer.
Feature disable drains the native owner, while hosted session detach/logout
only releases the client. Standalone browser and Node profiles retain their
existing restrictions. Application/provider qualification remains R2.2/R2.3.

The Rust-hosted queue adapter uses that same admitted HTTP client for accept,
read, Stop, cancel and explicit resume under [LN-CORE-036/037](../architecture/rust-queue-admission.md#ln-core-036).
Operator-declared `queue_selection` metadata travels through trusted target
discovery, retaining its saved recipient/token and ACP choices. The shared
constructor freezes the current declared mode; opaque runtime IDs and labels
never reconstruct attribution or provider identity. Lost acceptance replies are
observed by their exact identity without resubmission. Cold queues remain paused
until an explicit action; passive client teardown cannot take their ownership.
R4.1 host/provider acceptance remains separate from the completed R2 foundation.
Its opt-in actual-provider queue target uses private copied operator configuration,
read-only mode and unrequested model/thinking. It exercises real queued work,
passive detach, Stop cleanup and exact-head cold resume through this same screen.

The Rust browser journey exercises an operator-configured native worker through
the production chat composer. History uses the right sidebar and keeps its view
when opening an exact existing main conversation. Draft creation and restored
selection never dispatch prompts; portable metadata supplies saved titles.

The public web production build and typecheck do not compile the hosted Rust client.
lapis-server owns that client and its generated protocol binding
([LN-CORE-070](../architecture/rust-hosted-delivery.md#ln-core-070)).
The explicit `server-rust` profile is not part of this package's production
build. Its hosted screen, admitted HTTP client IDs, omitted PWA startup and
browser storage retain separate lapis-server evidence.
The retained chooser's managed-vault actions use the Rust host's advertised
capability and opaque IDs. [Managed-vault intake](../architecture/rust-managed-vaults.md)
qualifies Create/Rename/Archive/Restore separately from transfer and installation.
Its generated transfer capability enables those existing folder/ZIP and download
controls against the selected Rust host, with cookie-authenticated readonly
export and Origin/CSRF-protected uploads. Installed delivery reuses the public asset contract and admitted Rust client
URLs; installation transactions and recovery retain R6.

R1.3.11 retains the App-owned vault-change lifecycle before exposing a ready Web
workspace. That existing service projects internal rename/move into open editors;
normal disposal and failed-startup retry drain it before the workspace host.
PWA, Node and Rust sessions share this lifecycle. Native unattended indexing
remains R3; this does not introduce another watcher or scheduler implementation.

The Design Core dependency refresh consumes released `0.5.0` CSS, fonts and
components through public exports. Existing application ownership, host
behavior and plugin activation remain unchanged.

Complete CI browser acceptance under LN-PKG-161 includes the real server-host
editing, sharing and restart scenario. Its private bootstrap fixture is seeded
for the container user and retains the original browser assertions and deadlines.
That scenario runs in the dedicated Node server browser config; the PWA config
continues to execute its complete independent browser suite. Both jobs remain
blocking, and server acceptance checks a read-only Node 24 container with no Deno
executable before editing and retained-volume restart.

The PWA runner excludes both hosted fixture families. The dedicated Rust runner
owns all Rust shell and file-action cases; those cases require a separately
built Rust renderer and service rather than the PWA build.

Browser acceptance invokes the CLI entry declared by the Web package's pinned
`@playwright/test` dependency. PWA and hosted runners use that same installed
module as their tests/configuration, avoiding a stale or hoisted `playwright`
shim from a different package version.

## LN-WEB-032 — Retired Terminal connection settings

<a id="ln-web-032"></a>

**Requirement.** The Web host MUST NOT register terminal-host URL or token fields. After configuration loads it MUST remove the obsolete dedicated `web.terminalHost.token` secret without deleting Terminal plugin data or unrelated configuration.

## LN-WEB-034 — Packaged WASM and Svelte source

<a id="ln-web-034"></a>

**Requirement.** Web Vite MUST retain `*.wasm` assets and exclude Harper plus registry-installed Design Core Svelte source from dependency optimization. Component CSS MUST remain in its compiled Svelte module. The retired Ghostty integration MUST NOT remain a Web dependency or optimizer exclusion.

## LN-WEB-024 — Retired AI connection settings

<a id="ln-web-024"></a>

**Requirement.** The Web host MUST NOT register agent URL or token fields or prefill them from environment values. After configuration loads it MUST remove the obsolete dedicated `web.agentRuntime.token` secret while preserving conversations, plugin data and unrelated configuration.

## LN-WEB-045 — Source Editor startup order

<a id="ln-web-045"></a>

**Requirement.** The web host MUST register the default-enabled `@lapis-notes/source-editor` before Markdown so text, JSON, YAML, and YML files use the same source associations as desktop without transferring Markdown ownership.

## LN-WEB-046 — Production web build: provide an explicit 8 GiB Node heap

<a id="ln-web-046"></a>

**Requirement.** The production web build MUST provide an explicit 8 GiB Node heap budget so the registry-backed Design Core and Mira graph completes chunk rendering under the root package build.

Vault-local settings and installed-plugin assets use the shared `.lapis`
default through the public API path contract under LN-ARCH-140 and LN-PKG-165.

Hosted participant chat uses the existing admitted native client and typed
profile/receipt projection under [LN-CORE-046](../architecture/rust-participants.md#ln-core-046)
through [LN-CORE-048](../architecture/rust-participants.md#ln-core-048). Logical
recipients never become executable targets; absent metadata retains R2 idle sends.

Native chat layout capture preserves saved conversation/scope before mount;
only an observed new draft clears the saved conversation. This retains existing
view state through native metadata/History/Tasks boot without creating a writer
or resubmitting accepted work. The pre-mount regression reproduces0/1 and passes
after the view-owned repair; final combined hosted acceptance remains R7.
