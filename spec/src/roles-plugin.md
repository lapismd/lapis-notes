# Roles Host Integration

Lapis consumes `@lapis-notes/lapis-plugin-cv-roles` as a statically linked,
first-party external plugin. The sibling repository owns Roles and CV domain
behavior and its canonical standalone specification. This chapter owns only
host registration, managed settings, layout recovery, and real-App acceptance.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-CV-010 | Desktop, web, and real-App Storybook hosts MUST register runtime plugin `roles` as `first-party-external`, optional, and enabled by default before metadata and layout restoration. The package rename MUST NOT change view, command, file, or plugin-data IDs. |
| LN-CV-012 | Root Storybook MUST retain an App-backed scenario that registers optional File Explorer and Search beside external Roles, restores explorer, search, role, roles, and CV leaves, and verifies those public view types without importing sibling source paths. |
| LN-ROLE-016 | Desktop and web MUST restore persisted `role`, `roles`, and `cv` leaves when Roles is enabled without forcing Roles into a default layout. Disabled plugin leaves MUST remain persisted missing-view placeholders and recover after re-enable. |
| LN-ROLE-017 | The real-App Roles shell MUST open a persisted `role.md` from File Explorer while its tab is already open, select that existing leaf and rendered tab, show the role surface, restore the CV leaf, and finish with Search collapsed. |
| LN-ROLE-018 | Root Storybook MUST cover exact `role.md` association, aggregate opening, linked CV navigation, visible plugin groups, and disable/re-enable cycles for every optional static plugin. Roles-owned leaves MUST recover through placeholders, and acceptance MUST consume built public exports. |

### LN-CV-012 acceptance details

The App-backed consumer scenario verifies:

- The story MUST boot a real API `App` and `WorkspaceShell`.
- File Explorer and Search MUST come from their public packages and remain optional core plugins.
- Markdown and Markdown Lint MUST remain optional bundled registrations so their lifecycle is exercised with Explorer and Search.
- Roles MUST resolve from the sibling package's built public export with first-party external distribution metadata.
- The external Roles provider MUST make `*.cv.yml` and `*.cv.yaml` semantic content searchable.
- Ordinary YAML files that do not match the CV filename contract MUST remain absent from Search.

### LN-ROLE-017 acceptance details

The existing-tab regression scenario verifies:

- Explorer activation MUST reuse the leaf already displaying the selected `role.md`.
- Both the workspace leaf and visible rendered tab MUST become active.
- The role surface MUST remain visible before CV restoration.
- The final layout MUST have the Search sidebar collapsed.

## Ownership

The external repository owns role documents, CV compilation, Applications,
Activity, Actions, plugin-owned presentation, package Storybook, and the
governed 1280 by 900 visual state. Lapis owns static registration, core-plugin
settings policy, persisted layout recovery, consumer fixtures, and real-App
integration stories. Community installation remains outside this migration.
