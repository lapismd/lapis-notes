# Deno Desktop Parity Blockers

This chapter is the canonical register of work that still prevents the Deno
desktop host from replacing Electron. The governing requirements remain in
[Deno Desktop Host](./desktop-deno-host.md); this register records the current
boundary, owning source, and evidence needed to close each blocker.

## Promotion rule

Deno remains a parity-track host while any blocker below is open. Promotion
requires the complete macOS and Linux packaged matrix after the runtime
boundaries are available; source checks or cross-built artifact inspection do
not satisfy that gate.

## Terminal runtime

Governing requirements: LN-DENO-008, LN-DENO-016, and LN-DENO-023.

Current boundary:

- Deno truthfully reports `terminal-runtime` unavailable while still loading
  the portable Terminal plugin.
- Electron embeds the public `@lapismd/terminal-host` service, whose current
  runtime entry imports `node-pty` and Node process and buffer contracts.
- Deno has no native `desktop_terminal_session_*` bridge or owned PTY lifecycle.

Exit evidence:

- `@lapismd/terminal-host` exposes a portable injected PTY boundary, or Deno
  supplies a public-boundary adapter with create, list, write, resize, stop,
  output, exit, restore, and shutdown behavior.
- The Deno capability registry advertises the runtime only after command,
  event, resize, failure, and teardown tests pass.
- Packaged macOS and Linux acceptance opens an interactive terminal, resizes
  it, observes output, and closes it without leaking a PTY or host process.

## Community plugin sidecar

Governing requirements: LN-DENO-006, LN-DENO-008, and LN-DENO-016.

Current boundary:

- Deno truthfully reports `plugin-sidecar` unavailable. Its verified
  same-origin plugin asset route does not evaluate or activate plugin code.
- Electron owns prepare, evaluate, activate, deactivate, broker, restart, and
  shutdown operations through its child-process sidecar.
- Deno keeps community plugins disabled until an equivalent public host
  boundary exists.

Exit evidence:

- A public, host-neutral plugin execution contract replaces the Electron-main
  private implementation boundary and retains the governed capability broker.
- Deno owns process creation, authenticated requests, timeouts, restart,
  activation, deactivation, and shutdown without importing Electron modules.
- Packaged acceptance installs, enables, activates, exercises, disables, and
  removes a fixture plugin while preserving vault containment and diagnostics.

## Workspace popouts

Governing requirements: LN-DENO-021 and LN-DENO-023.

Current boundary:

- External HTTP and HTTPS links already route to the system browser and other
  privileged new-window targets are rejected.
- Design Core's default popout host calls browser `window.open` synchronously
  and expects the returned DOM `Window` and `Document` for the detached tree.
- Deno permits the blank-window request but does not install a native adapter
  or provide real packaged popout acceptance.

Exit evidence:

- Design Core exposes, or Deno supplies through its public `popoutHost`
  contract, a desktop adapter that returns a usable owner document without
  weakening external-link isolation.
- Popout focus, close, overlays, commands, styles, and session teardown work in
  a real Deno window on macOS and Linux.
- Packaged acceptance moves a workspace leaf to a popout, interacts with it,
  closes it, and proves no orphan leaf or privileged window remains.

## Linux and complete packaged matrix

Governing requirements: LN-DENO-022 and LN-DENO-023.

Current boundary:

- Versioned macOS app and ZIP packaging, macOS packaged smoke, Linux x64
  AppImage and tar creation, and Linux artifact inspection pass.
- Linux runtime startup and vault acceptance still require a Linux builder.
- The current saved-vault smoke covers plugin restoration, Turso WASM,
  isolation, language diagnostics, file watching, verified assets, agents,
  later-launch URLs, focus, and ordered close. First selection, cancellation,
  reopening, missing-vault fallback, switching, real popouts, terminal, and
  community-plugin lifecycles remain outside that smoke.

Exit evidence:

- A Linux builder runs the packaged AppImage or tar executable through startup,
  vault restoration, capability, URL, external-link, and clean-close acceptance.
- macOS and Linux both pass first selection, cancellation, reopening,
  missing-vault fallback, vault switching, layout restoration, notifications
  where supported, and the terminal, plugin, and popout scenarios above.
- The final matrix records unsupported platform behavior as an explicit
  unavailable capability rather than a silent no-op, then the promotion gate
  can be reviewed.

## Closure order

Terminal, community plugins, and popouts provide missing runtime behavior. The
complete packaged matrix follows those changes and is the final evidence gate;
artifact production alone cannot close it.
