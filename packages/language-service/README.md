# @lapis-notes/language-service

Provider-neutral Markdown language services for Lapis applications.

The package exposes browser-worker and native-host adapters without owning
workspace presentation, vault navigation, or application policy.

## Public surface

- `@lapis-notes/language-service`
- `@lapis-notes/language-service/markdown`
- `@lapis-notes/language-service/markdownlint/runtime`

## Usage

```ts
import { createMarkdownLanguageServiceProvider } from "@lapis-notes/language-service/markdown";
```

Install `@lapis-notes/api` from npm with a compatible version.

## Common scripts

```sh
pnpm --filter @lapis-notes/language-service build
pnpm --filter @lapis-notes/language-service check
pnpm --filter @lapis-notes/language-service test
```
