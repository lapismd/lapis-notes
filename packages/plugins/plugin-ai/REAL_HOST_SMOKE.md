# Real AI host smoke tests

These lanes use real authenticated agents and are intentionally manual. The
automated test suite continues to use Fake/in-memory runtimes and never needs a
paid subscription.

## Seeded workspace

Both lanes use `tmp/ai-real-host/workspace`. It contains a deterministic note,
`src/fixture.ts`, the AI settings, and an AI chat leaf. Conversation source
files remain under that folder's `.lapis/agents/sessions` directory between
runs. Pass `--reset` only when you intentionally want to remove that ignored
smoke data and recreate the fixture.

Before UI testing, the production runtime and transport can be checked with:

```sh
pnpm ai:smoke:probe:codex-acp
pnpm ai:smoke:probe:cursor-acp
pnpm ai:smoke:probe:codex-native
```

Each explicit command starts an isolated loopback host and an in-memory Lapis
vault over the same deterministic note content. It requires the selected agent
to invoke `notes_search`, `read`, and approved `edit` through the
real stdio MCP shim, then closes that binding, switches to the next supported
agent lane, and verifies the new binding receives the same six descriptors and
can invoke `notes_list` plus `read`. The existing provider-native edit and
question checks remain in the lane. These probes use authenticated agents; they
are never part of `pnpm test` or CI.

## Codex ACP and Cursor ACP in Storybook

Run:

```sh
pnpm ai:smoke:storybook
```

The supervisor seeds the agent workspace, starts a loopback host on a free
port, injects a one-run token into Storybook without logging or writing it, and
opens the existing `Plugins/AI/Live Host` setup on the configured Storybook
port. Storybook itself still never starts a host. Stopping the supervisor stops
both processes.

In the Live Host story, run this checklist first with Codex ACP and then use the
Agent submenu to repeat it with Cursor ACP:

1. Ask the agent to call `notes_search` for `bridge-search-token`, then
   `read` for `Notes/Agent Smoke.md`. Verify both calls identify
   `lapis-tools`, remain under `Notes`, and the response reaches
   `lapis-smoke-ready` without exposing a bridge credential.
2. Ask `edit` to replace `status: draft` with `status: reviewed` in
   `Notes/Patch Target.md`. Verify the drawer shows the scoped path, before and
   after diff, and Allow once / Allow for this session / Deny. Allow once and
   verify one completed tool lifecycle and the atomic file change.
3. Switch agents and ask for `notes_list` followed by `read`. Verify the
   new binding exposes the same six logical file tools, the old binding is not
   resumed, and the conversation scope remains `Notes`. Restore the patch
   target to `status: draft` before the second full pass.
4. Send “Inspect `src/fixture.ts` and explain the current `smokeValue`. Show the
   command and output you used.” Verify the tool disclosure points right when
   closed and down when open, and displays the actual command/input and output.
5. Send “Change `smokeValue` to 42 and explain the edit.” Verify the permission
   request appears in the drawer; allow once and verify the completed tool and
   response. Restore 41 before switching agents so the second run is identical.
6. Ask the agent to request a choice between two labels before continuing when
   that runtime advertises questions. Verify the question drawer and answer
   flow; unsupported question capability must degrade to ordinary agent text.
7. Start a multi-step inspection and cancel it. Verify the working indicator,
   cancellation row, and Retry action without an automatic resend.
8. Reload the story. Verify the local transcript, agent divider, completed
   thinking summary, tools, approval decision label, and usage render before
   native resume. Continue the conversation once. The `Plugins/AI/Live Host`
   ReloadResume play seeds the same `lapis-ai-story:` storage key and asserts
   transcript, agent divider, and usage before resume without sending a prompt.
   This step remains the live confirmation.
9. Stop and restart the launcher during a turn. Verify the turn becomes visibly
   interrupted and Retry is offered. A submitted prompt must never be replayed
   automatically after host loss.

## Codex Native in Deno desktop

Run:

```sh
pnpm ai:smoke:desktop
```

The lane uses Turbo's cache for package prerequisites, opens the same seeded
folder as the native vault and agent `cwd`, and starts Deno desktop with Codex
Native selected. Repeat steps 1–8 above, including the native approval drawer.
Codex's `request_user_input` tool is only advertised by its Plan collaboration
mode; the plugin's Default-mode native chat therefore returns an ordinary
capability message for step 4. The structured request and drawer mapping remain
covered by deterministic protocol and Storybook tests without changing every
native chat into a planning-only session. Close and relaunch the command to
verify the portable conversation renders before `thread/resume` and can
continue.

## Diagnostics

- The UI error at the top of the composer is the primary runtime diagnostic;
  it must not be hidden behind the thinking control.
- Inspect `.lapis/agents/sessions/<id>/metadata.yaml`, `agents.jsonl`, and
  `transcript.jsonl` after each lane. They must not contain environment maps,
  credentials, question answers, raw thinking deltas, or absolute workspace
  paths.
- `pnpm test:ai:smoke-harness` validates seed preservation and reset
  confinement without launching or charging an agent.
- The lower-level manual attach remains available with `pnpm ai-host serve`,
  but it is not required for either seeded smoke lane.
