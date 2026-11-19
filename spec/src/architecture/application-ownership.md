# Architecture / Application ownership

The optional native Sync service under LN-PKG-188 through LN-PKG-190 belongs to
the owning App and admitted VaultSession. Plugin leases receive provider-bound
observations and replies only; protocol algorithms, durable work, scheduling,
filesystem capabilities and native cleanup policy remain outside the renderer.
App leave fences and drains accepted Sync calls before entering the session's
writer guard under LN-PKG-193. Preparation retains observation and the same
leases for refused-leave recovery; disposal awaits transport detachment under
LN-PKG-189 without closing native-owned durable work.

Under LN-PLUG-112, the App that changes canonical plugin data owns its
compatibility-mirror writes. An App observing external configuration reloads
does not acquire another native writer for the same mirrored data.

The App owns its file-artwork registry under LN-PLUG-123. Plugin-owned SVGs and
packs use explicit App identity and unload cleanup; legacy global icons remain
an explicit compatibility fallback. Explorer receives that App's resolver,
without creating another global registry or activating views to paint rows.

Core `files.exclude` under LN-PKG-185 is owned by the App configuration and
Vault listing projection; no plugin is required. Explicit resource access and
App ownership under LN-ARCH-054 remain unchanged when the Workspace settings
list edits this same core configuration value.

Tauri plugin execution derives from the owning App vault session. The native bridge runtime supplies compatibility context only when that App has no session; legacy capability labels cannot select Electron execution (LN-PLUG-114).

App host restrictions under LN-PLUG-113 remain constructor-owned and are not
part of renderer-safe public properties. Notes API supplies the generic boundary;
the Web host alone selects its desktop-only plugin identities.

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

## LN-ARCH-060 — API: own the transport-neutral application tool registry, domain

<a id="ln-arch-060"></a>

**Requirement.** API MUST own the transport-neutral application tool registry, and domain plugins MUST own their tool implementations. Concrete AI consumers MUST own policy and approvals, while `@lapismd/ai-host` owns MCP transport. API, Search, and Markdown MUST NOT import MCP, ACP, acpx, or vendor agent SDKs. Authenticated remote transport MUST leave execution and note content in the owning App.

## LN-ARCH-074 — Core startup, MetadataCache, and Search: emit transport-neutral spans, measurements, and lifecycle events

<a id="ln-arch-074"></a>

**Requirement.** Core startup, MetadataCache, and Search MAY emit transport-neutral spans, measurements, and lifecycle events through the App telemetry contract. Normal hosts MUST retain `NoopTelemetryService`; exporters, structured-log relays, service identities, and shutdown flushing MUST remain private to explicitly enabled host integrations.

## LN-ARCH-083 — App: own AI memory services, durable vault records

<a id="ln-arch-083"></a>

**Requirement.** The App MUST own AI memory services, durable vault records, derived AppDatabase state, recall policy, and consolidation scheduling. ACP agents and models MAY consume or propose memory through transport-neutral contracts but MUST NOT own its identity, scope, persistence, trust, or lifecycle.

## LN-ARCH-084 — App-owned conversation transcript: remain canonical across agent and model changes

<a id="ln-arch-084"></a>

**Requirement.** The App-owned conversation transcript MUST remain canonical across agent and model changes. Native sessions are resumable projections tracked by append-only verified cursors; providers receive only typed transcript context and MUST NOT exchange opaque state. Background summaries MAY optimize projection but MUST NOT replace transcript evidence.

## LN-ARCH-097 — Node server host: use tRPC for its typed JSON control

<a id="ln-arch-097"></a>

**Requirement.** The Node server host MUST use tRPC for its typed JSON control plane and tracked subscriptions while direct Fetch routes retain streamed file and asset semantics, including bounded same-origin delivery of official plugin release bundles. Its browser boundary MUST translate Lapis virtual-root paths without weakening managed-route validation and MUST discard stale event cursors before reconnecting after resync. Public API contracts MUST describe remote transport without depending on tRPC types.

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

The App-owned install progress queue under LN-PLUG-075 serializes overlapping
UI install work without sharing cancellation tokens across requests or Apps.
The unchanged SyncHost startup reuses scanned identities under LN-DB-047.

The App-owned content watch and Vault discovery exclude the installed-plugin directory from recursive content scans. Plugin assets remain accessible through their owning adapters.

## Retired distribution admission

LN-PLUG-137 is enforced in the API's verified installer, before installation
writes. The original shared-AI artifact origin can refuse a legacy no-endpoint
catalog before network IO; verified source coordinates cover mirrors, portable
bundles and adapter-verified payloads before their files or records are written.
Host plugin identity and saved data remain outside that refusal: the same `ai`
identity can belong to bundled/native or unrelated third-party implementations.
This does not transfer native lifecycle or storage authority into the registry,
and does not remove installed state, settings, conversations or memory.
