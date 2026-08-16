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

Each explicit command starts an isolated loopback host, discovers provider
models, reads the seeded note through the real agent, handles any one-run
permission request inside the fixture, requires a successful completion with
`lapis-smoke-ready`, and shuts down. These probes use the authenticated agents;
they are never part of `pnpm test` or CI.

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

1. Send “Read `Notes/Agent Smoke.md` and return only its expected answer
   token.” Verify streaming text reaches `lapis-smoke-ready`, thinking appears
   while work is active, and no usage/session bookkeeping becomes a chat row.
2. Send “Inspect `src/fixture.ts` and explain the current `smokeValue`. Show the
   command and output you used.” Verify the tool disclosure points right when
   closed and down when open, and displays the actual command/input and output.
3. Send “Change `smokeValue` to 42 and explain the edit.” Verify the permission
   request appears in the drawer; allow once and verify the completed tool and
   response. Restore 41 before switching agents so the second run is identical.
4. Ask the agent to request a choice between two labels before continuing when
   that runtime advertises questions. Verify the question drawer and answer
   flow; unsupported question capability must degrade to ordinary agent text.
5. Start a multi-step inspection and cancel it. Verify the working indicator,
   cancellation row, and Retry action without an automatic resend.
6. Reload the story. Verify the local transcript, agent divider, completed
   thinking summary, tools, approval decision label, and usage render before
   native resume. Continue the conversation once.
7. Stop and restart the launcher during a turn. Verify the turn becomes visibly
   interrupted and Retry is offered. A submitted prompt must never be replayed
   automatically after host loss.

## Codex Native in Electron

Run:

```sh
pnpm ai:smoke:desktop
```

The lane uses Turbo's cache for package prerequisites, opens the same seeded
folder as the native vault and agent `cwd`, and starts Electron with Codex
Native selected. Repeat steps 1–6 above, including the native approval drawer.
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
