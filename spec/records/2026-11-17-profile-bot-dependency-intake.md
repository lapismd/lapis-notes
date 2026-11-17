# Genuine bot dependency intake for App Profile

Coordinator reconciliation43995269512 creates Notes PR146 at
`0f40b081424a2bd74c562a781a2a0c913c1d1e95`, based on main
`f450b46c3845cced5f417bf880070535a99125fe`. It carries the genuine patch
Changeset for the public App Profile and seven registry dependency updates:
root Mira Editor/Mermaid `~0.0.5`, plus Profile Markdown `^0.3.3`, Search
`^0.1.13`, Source Editor `^0.1.12`, Agent UI `^0.2.8` and History `^0.5.1`.
API, Workspace and Design Core ranges are unchanged. No source alias, package
patch, runtime code, plugin identity or host policy changes.

The bot PR's executed CI lanes pass, but that does not qualify its main-range
specification or quarantined browser coverage. Exact native diagnostic
`LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm spec:first --base f450b46c3845cced5f417bf880070535a99125fe --head 0f40b081424a2bd74c562a781a2a0c913c1d1e95`
reports five missing mapped chapters: architecture, packages, plugin model,
Web host and frozen Desktop. Their factual dependency/unchanged-contract
coverage and LN-PKG-132's verification row are repaired together. The frozen
Desktop chapter records absence of a host change; it authorizes no Deno work.

PR146 remains draft while source acceptance is incomplete. A complete cold
`pnpm test:storybook` is running through the standard Docker validation runner.
Its final result remains pending. The existing LN-CAT-121 quarantine was an
explicit earlier user decision, with automatic execution disabled; skipped
coverage is not a pass and this intake does not silently restore that lane.
Main-range spec acceptance, final-head functional checks, actual publication
verification and host adoption remain separate gates.

The repaired main-range `spec:first` comparison now passes with three protected
files and six canonical chapters, reducing the original five missing mappings
to zero. The explicit native specification check passes all configured lanes,
including App ownership, metadata queries and69 governance regression cases.
Formatter checks pass for every changed page; no page exceeds the canonical
line/byte limits. Browser acceptance and final publication are still pending.
