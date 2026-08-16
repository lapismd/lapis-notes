# Local-First AI Conversations Implementation

This temporary root artifact tracks the implementation of the local-first AI
conversation plan. Canonical behavior lives in `spec/src`; this file records
delivery order, progress, validation evidence, and Jujutsu changes until the
work is explicitly archived.

## Decisions

- Conversation source data lives under
  `<scope>/.lapis/agents/sessions/<conversation-uuid>/`.
- Scope precedence is explicit folder, most recently active note parent, then
  vault root. Scope never walks upward to discover another `.lapis` directory.
- The filesystem is authoritative. AppDatabase search data and host replay
  buffers are derived and disposable.
- Existing plugin-data `sessions` values are unsupported but remain inert and
  preserved when settings are saved.
- Only completed provider thinking summaries are durable. Visible tool input
  and bounded output are durable after redaction.
- Settings are defaults for new conversations. Composer changes switch the
  current conversation at a turn boundary.
- UUIDv4 is used through `crypto.randomUUID()` because this repository has no
  established UUIDv7 facility.

## Status values

`Not started`, `In progress`, `Blocked`, `Done`.

## Tasks

| ID           | Deliverable                                                                          | Depends on                               | Status      | Validation evidence                                                                                | Jujutsu change |
| ------------ | ------------------------------------------------------------------------------------ | ---------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------- | -------------- |
| AI-LOCAL-001 | Canonical specification and verification requirements                                | —                                        | Done        | `pnpm spec:check`                                                                                  | `wxxrwsvu`     |
| AI-LOCAL-002 | Crash-safe vault writes, native append, active-file contract, hidden `.lapis` paths  | AI-LOCAL-001                             | Done        | API 126 tests; desktop 14; Explorer 5; AI mention 5; focused type checks                           | `wxxrwsvu`     |
| AI-LOCAL-003 | Conversation schemas, scope resolver, transcript projection, vault and memory stores | AI-LOCAL-002                             | Done        | AI 91 tests; AI/API type checks; `pnpm spec:first`                                                 | `zstskrvt`     |
| AI-LOCAL-004 | Controller integration, offline restore, history, new/archive/delete lifecycle       | AI-LOCAL-003                             | Done        | AI controller/locator/plugin 19 tests; AI Svelte and type checks; full AI package gate             | `knnqtulz`     |
| AI-LOCAL-005 | Agent bindings, turn-boundary switching, context handoff, usage restoration          | AI-LOCAL-004                             | Done        | AI controller/time/projection focused tests; AI full test/check/build; `pnpm spec:first`           | `spuvyrmz`     |
| AI-LOCAL-006 | Derived AppDatabase indexing and all-conversation history search                     | AI-LOCAL-003                             | Done        | API memory/Turso/desktop/browser filtering; Search Manager; AI index/rebuild tests; package checks | `qszxmplx`     |
| AI-LOCAL-007 | Sequenced agent-runtime protocol v2, replay buffer, reconnect and deduplication      | AI-LOCAL-003                             | Done        | AI host 28 tests; reconnect/permission replay; host-restart gap; AI provenance checks              | `qvvrsuyq`     |
| AI-LOCAL-008 | Storybook scenarios and persistent Live Host vault data                              | AI-LOCAL-004, AI-LOCAL-005, AI-LOCAL-006 | Done        | AI 114 tests; 11 combined Storybook tests; six placements/axe; static Storybook build; spec gate   | `ynmkuytm`     |
| AI-LOCAL-009 | Seeded real-host smoke launchers and manual Codex/Cursor/native checklist            | AI-LOCAL-007, AI-LOCAL-008               | Done        | Harness 3; Storybook/Electron supervisors; real Codex ACP 7 models, Cursor ACP 35, native 7 with response/tools/write; native approval; cached prerequisite 72 ms | `wpvqwrys`     |
| AI-LOCAL-010 | Focused, consumer, Storybook, E2E, spec, check, and Turbo build gates                | AI-LOCAL-002–009                         | Not started | Pending                                                                                            | Pending        |

## Acceptance checklist

- [x] Scope-local source files remain readable without AppDatabase or an agent host.
- [x] Root, nested, explicit, renamed, moved, copied, archived, and deleted scopes are covered.
- [x] Reopen paints transcript, agent attribution, and usage before runtime resume.
- [x] Switching agents retains one conversation and never misattributes late events.
- [x] Search can be deleted and rebuilt solely from conversation files.
- [x] Replay cannot duplicate durable transcript entries or silently resend a turn.
- [x] Secrets, environment maps, raw protocol payloads, and question answers are not durable.
- [x] Automated tests require no paid agent subscription.

## Completion notes

Update each row with exact commands/results and its Jujutsu change after the
slice is committed. Leave this file at the root until a separate archival
change moves any remaining operational notes into the canonical specification.
