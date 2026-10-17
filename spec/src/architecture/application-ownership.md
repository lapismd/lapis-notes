# Architecture / Application ownership

Sync-host identity reconciliation completes before its observed file-event queue
commits changes. App-owned startup and teardown share that ordered readiness
boundary (LN-DB-047); native hosts do not bypass or retry rejected readiness.

Desktop recovery presentation under LN-PKG-175 receives descriptions and
callbacks from the session owner. It cannot discover App state, restart a host
or persist recovery configuration independently.

The app-profile `plugins` URL action is scoped to its owning App under
[LN-PLUG-106](../plugin-model/app-ownership.md#ln-plug-106). Native and Web
hosts retain transport delivery; verified catalog selection and installation
remain in the existing App distribution and Plugins view boundaries.
Requested release names resolve only from indexed own entries under
[LN-PLUG-107](../plugin-model/editor-contributions.md#ln-plug-107).
The profile dismisses its own Settings after successful URL navigation under
[LN-PLUG-109](../plugin-model/app-ownership.md#ln-plug-109).

The explicitly owned App also supplies the file-operation admission registry.
Conditional-host plugin data, runtime choices and file creation join it before
IO. Hosts drain admitted operations and App Shell transitions before entering
the global writer guard and releasing views, plugins or the vault session.

## LN-ARCH-034 — App-database selection: use an API-owned provider contract. Production hosts

<a id="ln-arch-034"></a>

**Requirement.** App-database selection MUST use an API-owned provider contract. Production hosts MUST register Turso providers without retaining SQLite compatibility or non-Turso fallback paths, while Search and workspace consumers MUST depend only on generic `AppDatabase` capabilities. Direct Turso teardown MUST retain driver ownership after failure and drain accepted mutations before successful release, as specified by LN-DB-056.

## LN-ARCH-054 — App-linked runtime objects: resolve App through explicit injection, workspace ownership

<a id="ln-arch-054"></a>

**Requirement.** App-linked runtime objects MUST resolve App through explicit injection, workspace ownership, or Svelte context. `globalThis.app` MAY remain only as a host-installed compatibility fallback, and constructing an App MUST NOT mutate global state.

## LN-ARCH-056 — AI History: remain an AI-owned, placement-neutral Explorer-style tree composed

<a id="ln-arch-056"></a>

**Requirement.** AI History MUST remain an AI-owned, placement-neutral Explorer-style tree composed from public shared primitives. Its SearchFilterBar search field and trailing actions MUST stay centered in the panel. Host replay and native agent state MUST remain bounded, non-canonical, and safe to lose without automatically repeating a side-effecting turn. Chrome actions MUST keep a visible hover fill, and New chat MUST use the dimmed folder-context path.

## LN-ARCH-060 — API: own the transport-neutral application tool registry, domain

<a id="ln-arch-060"></a>

**Requirement.** API MUST own the transport-neutral application tool registry, domain plugins MUST own their tool implementations, AI MUST own policy and approvals, and `@lapismd/ai-host` MUST own MCP transport. API, Search, Markdown, and portable AI code MUST NOT import MCP, ACP, acpx, or vendor agent SDKs. Authenticated remote transport MUST leave execution and note content in the owning App.

## LN-ARCH-063 — @lapis-notes/ai: render assistant chat Markdown through @lapis-notes/markdown/embed. That

<a id="ln-arch-063"></a>

**Requirement.** `@lapis-notes/ai` MUST render assistant chat Markdown through `@lapis-notes/markdown/embed`. That helper MUST apply the App's default Mira editor extensions. AI MUST NOT add a plugin-local Markdown renderer. Chat MUST keep the embed preview surface transparent and MUST NOT nest a vertical scroller inside the bubble.

## LN-ARCH-068 — Deno: supervise the standalone lapis-ai-controller service and expose

<a id="ln-arch-068"></a>

**Requirement.** Deno MUST supervise the standalone `lapis-ai-controller` service and expose its authenticated connection through native IPC. The AI plugin MUST consume the shared controller client. Lapis MUST retain vault storage, App authorization, tool execution and host shutdown ownership.

## LN-ARCH-070 — Deno single-instance ownership: use an exclusive application-data lock and authenticated

<a id="ln-arch-070"></a>

**Requirement.** Deno single-instance ownership MUST use an exclusive application-data lock and authenticated local handoff. The native host MUST retain URL arguments until a subscribed renderer takes them; only the ready App URL registry MAY interpret their application action.

## LN-ARCH-074 — Core startup, MetadataCache, and Search: emit transport-neutral spans, measurements, and lifecycle events

<a id="ln-arch-074"></a>

**Requirement.** Core startup, MetadataCache, and Search MAY emit transport-neutral spans, measurements, and lifecycle events through the App telemetry contract. Normal hosts MUST retain `NoopTelemetryService`; exporters, structured-log relays, service identities, and shutdown flushing MUST remain private to explicitly enabled Deno desktop development. Embedded AI and terminal boundaries MUST remain instrumentation scopes of the desktop service rather than separate services.

## LN-ARCH-083 — App: own AI memory services, durable vault records

<a id="ln-arch-083"></a>

**Requirement.** The App MUST own AI memory services, durable vault records, derived AppDatabase state, recall policy, and consolidation scheduling. ACP agents and models MAY consume or propose memory through transport-neutral contracts but MUST NOT own its identity, scope, persistence, trust, or lifecycle.

## LN-ARCH-084 — App-owned conversation transcript: remain canonical across agent and model changes

<a id="ln-arch-084"></a>

**Requirement.** The App-owned conversation transcript MUST remain canonical across agent and model changes. Native sessions are resumable projections tracked by append-only verified cursors; providers receive only typed transcript context and MUST NOT exchange opaque state. Background summaries MAY optimize projection but MUST NOT replace transcript evidence.

## LN-ARCH-097 — Deno server host: use tRPC for its typed JSON control

<a id="ln-arch-097"></a>

**Requirement.** The Deno server host MUST use tRPC for its typed JSON control plane and tracked subscriptions while direct Fetch routes retain streamed file and asset semantics, including bounded same-origin delivery of official plugin release bundles. Its browser boundary MUST translate Lapis virtual-root paths without weakening managed-route validation and MUST discard stale event cursors before reconnecting after resync. Public API contracts MUST describe remote transport without depending on tRPC types.

## LN-ARCH-100 — Signed Nostr events and content-addressed manifests: supply plugin catalog and release evidence

<a id="ln-arch-100"></a>

**Requirement.** Signed Nostr events and content-addressed manifests MAY supply plugin catalog and release evidence through a transport adapter, but relays MUST remain transport rather than trust roots. Pinned curator keys, exact publisher authorization, exact release approval, artifact integrity, and install relay quorum remain prerequisites. Official and community plugins MUST use the same adapter and verification path; source enablement and curator policy express provenance and trust tier.

## LN-ARCH-102 — Portable offline .lapis-plugin: contain only release.nostr.json and the exact hash-bound

<a id="ln-arch-102"></a>

**Requirement.** The portable offline `.lapis-plugin` MUST contain only `release.nostr.json` and the exact hash-bound `payload.zip`; its outer archive is not authoritative because it contains the proof. Offline verification MUST terminate at an app-configured curator key and persist the authenticated inner-payload digest plus a current-revocation warning. Only successful revalidation of that exact release and digest through an install-ready live source may clear the warning.

## LN-ARCH-103 — When Nostr registry discovery is enabled, App: compose the Community NIP-29 source and shared

<a id="ln-arch-103"></a>

**Requirement.** When Nostr registry discovery is enabled, App Profile MUST compose the Community NIP-29 source and shared proof verifier with API's transport-neutral adapter. Web and desktop sessions MUST share that composition and dispose the owned source after distribution teardown. While relay discovery is deferred, the concrete binding MUST remain outside active static-profile imports, build, and tests.

Plugin registration preserves unadopted compatibility data under LN-PLUG-112.
Its later adoption and explicit canonical removal retain existing App-owned
writers, configuration serialization and host teardown responsibilities.
