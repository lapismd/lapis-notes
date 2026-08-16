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

| ID           | Deliverable                                                                          | Depends on                               | Status      | Validation evidence | Jujutsu change |
| ------------ | ------------------------------------------------------------------------------------ | ---------------------------------------- | ----------- | ------------------- | -------------- |
| AI-LOCAL-001 | Canonical specification and verification requirements                                | —                                        | Done        | `pnpm spec:check`   | `54c2c43f`     |
| AI-LOCAL-002 | Crash-safe vault writes, native append, active-file contract, hidden `.lapis` paths  | AI-LOCAL-001                             | Done        | API 126 tests; desktop 14; Explorer 5; AI mention 5; focused type checks | Pending |
| AI-LOCAL-003 | Conversation schemas, scope resolver, transcript projection, vault and memory stores | AI-LOCAL-002                             | Not started | Pending             | Pending        |
| AI-LOCAL-004 | Controller integration, offline restore, history, new/archive/delete lifecycle       | AI-LOCAL-003                             | Not started | Pending             | Pending        |
| AI-LOCAL-005 | Agent bindings, turn-boundary switching, context handoff, usage restoration          | AI-LOCAL-004                             | Not started | Pending             | Pending        |
| AI-LOCAL-006 | Derived AppDatabase indexing and all-conversation history search                     | AI-LOCAL-003                             | Not started | Pending             | Pending        |
| AI-LOCAL-007 | Sequenced agent-runtime protocol v2, replay buffer, reconnect and deduplication      | AI-LOCAL-003                             | Not started | Pending             | Pending        |
| AI-LOCAL-008 | Storybook scenarios and persistent Live Host vault data                              | AI-LOCAL-004, AI-LOCAL-005, AI-LOCAL-006 | Not started | Pending             | Pending        |
| AI-LOCAL-009 | Seeded real-host smoke launchers and manual Codex/Cursor/native checklist            | AI-LOCAL-007, AI-LOCAL-008               | Not started | Pending             | Pending        |
| AI-LOCAL-010 | Focused, consumer, Storybook, E2E, spec, check, and Turbo build gates                | AI-LOCAL-002–009                         | Not started | Pending             | Pending        |

## Acceptance checklist

- [ ] Scope-local source files remain readable without AppDatabase or an agent host.
- [ ] Root, nested, explicit, renamed, moved, copied, archived, and deleted scopes are covered.
- [ ] Reopen paints transcript, agent attribution, and usage before runtime resume.
- [ ] Switching agents retains one conversation and never misattributes late events.
- [ ] Search can be deleted and rebuilt solely from conversation files.
- [ ] Replay cannot duplicate durable transcript entries or silently resend a turn.
- [ ] Secrets, environment maps, raw protocol payloads, and question answers are not durable.
- [ ] Automated tests require no paid agent subscription.

## Completion notes

Update each row with exact commands/results and its Jujutsu change after the
slice is committed. Leave this file at the root until a separate archival
change moves any remaining operational notes into the canonical specification.
