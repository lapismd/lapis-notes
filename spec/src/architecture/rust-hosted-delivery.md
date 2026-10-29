# Architecture / Rust hosted runtime delivery

R7 replaces the Node application server while retaining the current built Web
application and existing native authority. Ordinary hosted entrypoints select
Rust with native metadata, History and Tasks together. Container delivery,
retired transport removal and complete cutover retain separate evidence.
It introduces no replacement screen or JavaScript application runtime.
`WorkspaceShell` stays in `@lapis-notes/workspace`. The hosted screen and
server acceptance live in the lapis-server specification.

Static delivery, compiled startup, and the public image identity moved to the
lapis-server specification at <https://lapismd.github.io/lapis-server/>.
This chapter keeps shared observation and the boundary that Notes does not
build that image.

## LN-CORE-069 — Native hosted defaults

<a id="ln-core-069"></a>

**Requirement.** Hosted entrypoints MUST select the compiled Rust server and
existing native-profile Web
application. They MUST NOT start the Node application server or fall back to it.
Standalone local/offline Web MUST retain its separate browser implementation.
Missing native inputs MUST fail explicitly without silently changing ownership.

## LN-CORE-070 — Reproducible native runtime image

<a id="ln-core-070"></a>

**Requirement.** Notes MUST NOT build the hosted server image, compile the hosted Rust client, or run server acceptance. The image identity, listen port, data volume, and readiness URL live only in the lapis-server specification.

The public web package does not import the hosted protocol binding.

## LN-CORE-066 — Admitted database observation

<a id="ln-core-066"></a>

**Requirement.** Hosted database observation MUST use the native bounded commit
channel through an authenticated, versioned stream scoped to one admitted client,
vault and generation. It MUST preserve committed change domains, paths and
revisions without creating another writer or requiring a renderer scheduler.
Foreign or stale scope and future cursors MUST be rejected before streaming.

## LN-CORE-067 — Bounded stream recovery

<a id="ln-core-067"></a>

**Requirement.** Observation streams MUST bound concurrent readers and frame
bytes. Initial connection, reconnection and lag MUST provide an explicit current
reset rather than replaying writes or claiming missing history. Hosted readers
MUST validate bounded frames, reconnect with their last admitted revision, and
stop on permanent authentication, protocol or scope failures.

## LN-CORE-068 — Passive observation lifetime

<a id="ln-core-068"></a>

**Requirement.** Observation MUST revalidate principal and native admission before
frames and while idle. Revocation, detach, vault close and shutdown MUST retire
the stream; removing the last listener or closing its view MUST abort the browser
reader. Observers MUST hold no work lease that prevents native drain, and must
never resume prompts or uncertain effects.
