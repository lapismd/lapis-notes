# Private profile published chat floors

The private application profile now requests published Agent UI `^0.2.0`,
History `^0.2.0`, and Design Core `^0.7.4`. The profile stays private at
`0.0.0`. The API package stays `0.2.3`. No public API, static plugin
selection, routing, lifecycle, or trust contract changes.

The mapped architecture, package, plugin-model, web-host, and Deno-host
chapters record those floors in the same change as the profile manifest and
lockfile. This record does not publish a package.

Validation passed natively under Node 24.10.0/pnpm 10.34.5:

- Prettier left the six documentation files unchanged.
- `pnpm spec:first --base main@codex-https --head @`: two protected files and
  five mapped canonical chapters.
- `pnpm spec:validate`: 11 validators, 194 chapters, 1567 requirements.
- `pnpm check:specification-docs`: 194 specification mirrors.
- `pnpm release:intent` for the profile, lockfile, and documentation paths.
- `pnpm spec:build` wrote the HTML book.
