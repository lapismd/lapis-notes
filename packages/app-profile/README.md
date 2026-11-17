# Lapis Notes application profile

Shared application composition for Lapis Notes hosts. The package owns the four
optional core plugins, plugin settings and browser, native Chat observation, and
the complete Notes workspace session. Hosts own credentials, storage, transport,
permissions and platform lifecycle.

Import `NotesWorkspaceSession` and its props/imperative handle from
`@lapis-notes/app-profile/workspace-session`. Supply an owned `VaultSession`,
profile, runtime, vault navigation callbacks, and optional native Chat/Repository
factories. Browser-only policy is injected through `NotesWorkspaceHost`.

The session loads vault/configuration/plugins/layout in order, provides Retry,
mounts the public `WorkspaceShell`, and protects registered writers before
persisting or closing. Call and await `dispose()` before replacing its session.
A refused leave retains the live application and permits an explicit retry.
A host may supply `host.dispose(app)` to close attachments after the session;
the compatibility lease remains installed until that awaited cleanup succeeds.

The native Repository type surface includes the released History SDK dependency;
hosts still supply every native reader and transport.

Other public entries are the default profile, `plugin-host-build`, `native-chat`
and `native-repository`. Every entry resolves built package output.

Hosts using `plugin-host-build` must declare Vite in their own build tooling.
App Profile keeps Vite as a development dependency; installing the application
profile does not require a Vite runtime peer.
