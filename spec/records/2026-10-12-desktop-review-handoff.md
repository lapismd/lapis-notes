# Desktop review and remaining release gates

The API schema migration is committed separately in Notes, Plugins, and the
static registry. Community remains parked and excluded. This review does not
authorize publication, production signing, deployment, or release activation.

The desktop review preserves `.local/desktop-static-matrix/vault` and its
existing notes. The twelve local plugin candidates comprise three bundled
plugins (Source Editor, Markdown, and Search) and nine signed optional bundles;
File Explorer remains the fourth bundled default. The optional bundles were
installed through the API's `VerifiedPluginInstaller`, with the acceptance
fixture's public Ed25519 trust keys and SHA256 checks. Existing plugin data was
preserved. Configuration backups and installation evidence are under
`.local/api-schema-migration/`.

The ordinary Deno 2.9.5 native HMR launch failed twice before renderer startup:
`@lapismd/ai-controller/managed` was reported as absent from the runtime import
map. The declared desktop `deno.json` mapping and installed npm export exist.
A freshly compiled CEF application from the same source starts successfully,
proxies the current Vite renderer, and opens the review vault. Native HMR is
not used for this review. The underlying HMR resolution defect is unresolved;
this result does not establish a source fix.

The review workspace renders the restored History panel, AI and Graph ribbon
entries, Bookmarks, and Word Count. One functional startup diagnostic remains:
Markdown Lint reports a duplicate registration while loading from
`.obsidian/plugins/lapis-markdown-lint`: `Plugin id lapis-markdown-lint is already registered`.
The registration ordering or duplicate owner remains unqualified. The candidate
is installed and enabled, but successful installation must not be reported as
a clean runtime startup.
No assertion, error reporting, or release gate was weakened.

Live npm checks on 2026-10-12 return E404 for API, UI, Workspace, and File
Explorer 0.1.1. `npm whoami` succeeds for `stevejuma`, superseding the earlier
unauthenticated result; publication permission and approval are not implied.

Release remains pending:

- Resolve and qualify the newly observed native HMR and Markdown Lint startup
  failures, or obtain explicit acceptance of a documented exclusion.
- Obtain approval and publish the four framework prerequisite packages.
- Refresh portable npm lockfiles in Plugins and the registry, then qualify
  frozen installs and consumers without temporary tarball hooks.
- Bind final plugin artifacts to committed source, qualify release workflows,
  and perform approved npm and release-asset publication.
- Sign the production V2 catalog, configure its trust root and release gates,
  and perform the approved static registry cutover/deployment. The production
  `generated/v2/index.sig` is still absent.

Community and the Nostr/relay registry are deferred work, not release
prerequisites. Visual review remains pending separately; no baseline changed.
