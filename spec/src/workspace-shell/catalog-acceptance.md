# Workspace Shell / Catalog acceptance

<!-- dependency-intake:framework-registry:start -->

Current registry dependency coordinates; qualification remains separate.

<!-- prettier-ignore -->
| Manifest | Dependency | Range | Locked version |
| --- | --- | --- | --- |
| `package.json` (devDependencies) | `@lapismd/design-core` | `^0.13.6` | `0.13.6` |
| `packages/api/package.json` (dependencies) | `@lapismd/design-core` | `^0.13.6` | `0.13.6` |
| `packages/api/package.json` (peerDependencies) | `@lapismd/design-core` | `^0.8.0 \|\| ^0.9.0 \|\| ^0.10.0 \|\| ^0.12.0 \|\| ^0.13.0` | Peer support |
| `packages/app-profile/package.json` (dependencies) | `@lapismd/design-core` | `^0.13.6` | `0.13.6` |
| `packages/file-explorer/package.json` (dependencies) | `@lapismd/design-core` | `^0.7.0 \|\| ^0.8.0 \|\| ^0.9.0 \|\| ^0.10.0 \|\| ^0.12.0 \|\| ^0.13.0` | `0.13.6` |
| `packages/ui/package.json` (dependencies) | `@lapismd/design-core` | `^0.13.6` | `0.13.6` |
| `packages/ui/package.json` (peerDependencies) | `@lapismd/design-core` | `^0.7.0 \|\| ^0.8.0 \|\| ^0.9.0 \|\| ^0.10.0 \|\| ^0.12.0 \|\| ^0.13.0` | Peer support |
| `packages/web/package.json` (dependencies) | `@lapismd/design-core` | `^0.13.6` | `0.13.6` |
| `packages/workspace/package.json` (dependencies) | `@lapismd/design-core` | `^0.13.6` | `0.13.6` |

Manifest, peer and integrity facts SHA256: `b7dc009c8b45eb05c91d3b123bb25b20d152bc61f0299c98dbdcad9e7f34d8e7`.

<!-- dependency-intake:framework-registry:end -->

Problems editor-demo acceptance under LN-WS-034/037 drains corrected edits and
fixture restoration through the editor writer. Spellcheck also verifies vault
content and absence of a retained file conflict before the story completes.

## LN-WS-010 — New workspace stories: include interaction and accessibility assertions, including theme-sensitive

<a id="ln-ws-010"></a>

**Requirement.** New workspace stories MUST include interaction and accessibility assertions, including theme-sensitive hover contrast for shell actions on sidebar-coloured surfaces and floating-window headers; they MUST carry `visual-pending` and ship nested-import Visual Delta baselines without rewriting existing API baselines.

## LN-WS-024 — Authored shell MDX: identify every scenario and render its canonical

<a id="ln-ws-024"></a>

**Requirement.** Authored shell MDX MUST identify every scenario and render its canonical Storybook description immediately before the corresponding canvas.

LN-CORE-027 editing recovery stories boot a real App and persisted shell, then
exercise the existing Problems collection/menu. Claim counts and local issue
changes remain ephemeral diagnostics; they do not become layout state or a
second file persistence owner.

The Mira 0.2 dependency intake preserves the released Design Core 0.13.2
workspace composition. Catalog qualification retains its existing functional,
interaction, accessibility and cold-start gates.
