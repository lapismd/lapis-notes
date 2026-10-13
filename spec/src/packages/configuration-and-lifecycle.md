# Packages / Configuration and lifecycle

The private application profile owns plugin App URL registration, while
Workspace's public navigator accepts an optional selected release version.
The profile and hosts consume that generic navigator under
[LN-PLUG-106](../plugin-model/app-ownership.md#ln-plug-106); no registry-specific
archive transport or trust key enters the application link.

## LN-PKG-050 — @lapis-notes/lapis-plugin-cv-roles: expose Storybook interaction and static-build scripts.

<a id="ln-pkg-050"></a>

**Requirement.** `@lapis-notes/lapis-plugin-cv-roles` MUST expose Storybook interaction and static-build scripts. Its package build MUST emit portable declarations without linked sibling implementation paths.

## LN-PKG-052 — @lapis-notes/lapis-plugin-cv-roles: own the adapted legacy Applications components

<a id="ln-pkg-052"></a>

**Requirement.** `@lapis-notes/lapis-plugin-cv-roles` MUST own the adapted legacy Applications components and native CSS in its source tree. It MUST NOT retain a runtime or build dependency on `/Users/stevejuma/code/cv`, `@cvstudio/*`, or legacy Tasks and AI modules.

## LN-PKG-055 — @lapis-notes/api: publicly export search-document provider types

<a id="ln-pkg-055"></a>

**Requirement.** `@lapis-notes/api` MUST publicly export search-document provider types and the registry used by separately versioned first-party plugins without requiring an import from `@lapis-notes/search`.

## LN-PKG-126 — @lapis-notes/ai: own cross-agent transcript projection, binding cursor reduction

<a id="ln-pkg-126"></a>

**Requirement.** `@lapis-notes/ai` MUST own cross-agent transcript projection, binding cursor reduction, switch/configuration audit records, and optional background handoff summaries. `@lapismd/ai-host` and desktop adapters MAY configure or resume native sessions through versioned transport methods, but MUST NOT copy opaque runtime state, author handoff transcript messages, select durable binding state, or become conversation authority.

## LN-PKG-083 — Independent Word Count package ownership

<a id="ln-pkg-083"></a>

**Requirement.** `@lapis-notes/wordcount` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on `@lapis-notes/api` and MUST NOT depend on `@lapis-notes/ui`.

## LN-PKG-089 — Independent Spell Check package ownership

<a id="ln-pkg-089"></a>

**Requirement.** `@lapis-notes/spellcheck` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on the API and `harper.js` without importing Design Core presentation or `@lapis-notes/ui`.

## LN-PKG-099 — Independent Bookmarks package ownership

<a id="ln-pkg-099"></a>

**Requirement.** `@lapis-notes/bookmarks` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on API and Design Core, MUST NOT depend on `@lapis-notes/ui`, and MUST persist `{ items }` through `.obsidian/bookmarks.json`.

## LN-PKG-103 — Portable Docs plugin dependencies

<a id="ln-pkg-103"></a>

**Requirement.** `@lapis-notes/lapis-plugin-docs` MUST NOT depend on `/Users/stevejuma/code/cv` or `@cvstudio/*` at runtime or build time. Coding practice host services MUST remain out of the Core Docs package.

## LN-PKG-104 — @lapis-notes/api: own a daily-document provider registry, the desktop

<a id="ln-pkg-104"></a>

**Requirement.** `@lapis-notes/api` MUST own a daily-document provider registry, the desktop and web hosts MUST register the shared default provider before configuration loads, and generated settings MUST persist `dailyNotes.folder` and Luxon `dailyNotes.dateFormat` with defaults `daily` and `yyyy-MM-dd`. The default provider MUST locate canonical `type: daily-note` plus `date: YYYY-MM-DD` front matter before deriving a path, MUST fail visibly on duplicate dates or occupied generated paths, and MUST never move an existing note after configuration changes.
