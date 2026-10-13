# Packages / Host and plugin integration

## LN-PKG-002 — @lapis-notes/api: depend on @lapis-notes/ui as a peer

<a id="ln-pkg-002"></a>

**Requirement.** `@lapis-notes/api` MUST depend on `@lapis-notes/ui` as a peer for shared UI primitives used by kernel components.

## LN-PKG-003 — Pruned retained UI exports

<a id="ln-pkg-003"></a>

**Requirement.** `@lapis-notes/ui` MUST export only the pruned surface required by api (plus documented transitive dependencies).

## LN-PKG-046 — Private @lapis-notes/web version 2026.6.3: live at packages/web and expose dev, build

<a id="ln-pkg-046"></a>

**Requirement.** Private `@lapis-notes/web` version `2026.6.3` MUST live at `packages/web` and expose `dev`, `build`, `check`, and `test` scripts.

## LN-PKG-065 — @lapis-notes/bases filter groups: preserve the initial predicate when adding another

<a id="ln-pkg-065"></a>

**Requirement.** `@lapis-notes/bases` filter groups MUST preserve the initial predicate when adding another row and compose nested Design Core Select portals without package-local stacking overrides. The built package MUST retain these filter interaction semantics.

## LN-PKG-114 — Private desktop package: expose local LGTM and telemetry development commands

<a id="ln-pkg-114"></a>

**Requirement.** The private desktop package MUST expose local LGTM and telemetry development commands. Root commands MUST delegate to that package, while ordinary development, build, package, test, and distribution commands remain telemetry-disabled.

## LN-PKG-115 — @lapis-notes/api: export its telemetry contract through @lapis-notes/api/telemetry. Browser

<a id="ln-pkg-115"></a>

**Requirement.** `@lapis-notes/api` MUST export its telemetry contract through `@lapis-notes/api/telemetry`. Browser OpenTelemetry SDK dependencies MUST remain private to `@lapis-notes/desktop-deno` and load only after explicit telemetry enablement.

## LN-PKG-120 — @lapis-notes/graph: own deterministic entrance layout, Obsidian-range camera

<a id="ln-pkg-120"></a>

**Requirement.** `@lapis-notes/graph` MUST own deterministic entrance layout, Obsidian-range camera and force transforms, degree-normalized D3 simulation, zoom-stable geometry, direct screen-pixel links, paint culling, exponential emphasis, reduced motion, semantic roles, and bounded telemetry. It MUST NOT add another renderer dependency.

## LN-PKG-125 — @lapis-notes/ai: own in-memory turn projection and terminal conversation

<a id="ln-pkg-125"></a>

**Requirement.** `@lapis-notes/ai` MUST own in-memory turn projection and terminal conversation checkpoints. `@lapismd/ai-controller` MUST own later-task start, prompt, and journal delivery. `@lapis-notes/desktop-deno` MUST expose only an authenticated controller connection. Durable conversation authority MUST remain in AI, and native transports MUST NOT write transcript state.

## LN-PKG-149 — API host catalogue: expose declared Svelte browser runtime contracts under

<a id="ln-pkg-149"></a>

**Requirement.** The API host catalogue MUST expose declared Svelte browser runtime contracts under compiler-versioned specifiers. API and host builds MUST use that exact Svelte peer version. Hosts MUST provide those entries through their own module graph. Raw private imports and unavailable ABI versions MUST remain rejected.

## LN-PKG-075 — Root real-agent smoke scripts: remain thin supervisors over the standalone AI

<a id="ln-pkg-075"></a>

**Requirement.** Root real-agent smoke scripts MUST remain thin supervisors over the standalone AI controller, its public client, Storybook, Deno desktop, and Turbo. Seed creation and reset confinement MUST remain deterministic and testable without starting an agent, while the manual checklist stays with `@lapis-notes/ai`.

## LN-PKG-096 — @lapis-notes/api: own skill-source and composer slash-command registration. @lapis-notes/ai

<a id="ln-pkg-096"></a>

**Requirement.** `@lapis-notes/api` MUST own skill-source and composer slash-command registration. `@lapis-notes/ai` MUST own discovery, snapshots, skill tools, and the composer router. Those APIs MUST NOT expose MCP, ACP, or vendor runtime types.
