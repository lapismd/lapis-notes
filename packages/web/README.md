# @lapis-notes/web

Browser and installable PWA consumer for the shared Lapis Notes workspace.
The host owns browser-vault selection, Turso cross-tab coordination, PWA
lifecycle, and the four authorized core plugins.

Source provenance: `/Users/stevejuma/code/lapis-notes/packages/web` at legacy
commit `8ec68e18`.

```sh
pnpm dev:web
pnpm build:web
pnpm test:web:e2e
```

AI and Terminal are native desktop features. This host rejects their retained
installed identities even when older manifests claim Web compatibility. Saved
plugin data and layout remain; obsolete dedicated service tokens are removed
after configuration loads. No service URL/token settings or environment
attachment remain in the Web application.
