# Desktop bootstrap renderer acceptance

The macOS host creates a visible overlay window after adopting Deno's bootstrap
window. Automatic bootstrap navigation previously loaded the same app document,
allowing a hidden renderer to open the vault and consume queued application URLs.
The bootstrap entry is now inert; the visible window uses a distinct renderer URL.
Framed hosts and asset/About routes retain their existing behavior.

Verification on 2026-10-12 in `lapis-notes-static-v2`:

- `pnpm --filter @lapis-notes/desktop-deno exec vitest run src-deno/window-chrome.test.ts`:
  one regression failed before the repair; all five tests pass after it.
- `pnpm --filter @lapis-notes/desktop-deno check`: passes without warnings.
- `pnpm --filter @lapis-notes/desktop-deno test`: 218 pass; one existing integration skip.
- `pnpm --filter @lapis-notes/desktop-deno package:app`: fresh local macOS arm64
  package passes, with ad-hoc signing and notarization skipped.
- First `pnpm --filter @lapis-notes/desktop-deno test:packaged` against that package:
  passes workspace readiness, URL handoff, controller/tool registration, native
  services, and renderer-coordinated clean exit without refreshing.
- `pnpm spec:check`: passes.

This is local macOS acceptance. Linux packaged acceptance and production
publication/signing remain separate release work.
