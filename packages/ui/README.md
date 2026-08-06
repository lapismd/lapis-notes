# @lapis-notes/ui

Shared Svelte design system for Lapis Notes. This package wraps Bits UI, paneforge,
`svelte-sonner`, and related headless primitives in Tailwind-styled components that the workspace
shell and plugins can share without pulling domain logic into the UI layer.

## Common Scripts

```sh
pnpm --filter @lapis-notes/ui dev
pnpm --filter @lapis-notes/ui build
pnpm --filter @lapis-notes/ui check
```

## References

- [Package spec](spec.md)
- [Canonical spec](../../spec/src/20-packages/ui/index.md)
