# Portable host services

Private, runtime-independent path, native AppDatabase worker and Markdown
language-service kernels shared by the Node server and Deno compatibility
exports. Authentication, HTTP routing, vault admission and host lifecycle stay
with each host.

Build with `pnpm --filter @lapis-notes/host-services build`. Node consumes built
ESM; Deno consumes the same TypeScript source through the `deno` export condition.
Use the declared package subpaths rather than private source imports.
