# Storybook Catalog

Defines documentation navigation, App-owned fixtures, scenario coverage, accessibility checks, and catalog build boundaries.

## Topics

- [Documentation and navigation](storybook-catalog/documentation-and-navigation.md)
- [Build and process](storybook-catalog/build-and-process.md)
- [Catalog policy](storybook-catalog/core-contract.md)
- [Interaction and accessibility](storybook-catalog/interaction-and-accessibility.md)
- [Plugin scenarios](storybook-catalog/plugin-scenarios.md)
- [App-owned fixtures](storybook-catalog/app-owned-fixtures.md)
- [Visual policy](storybook-catalog/visual-policy.md)
- [Context](storybook-catalog/context.md)

Shared file-conflict presentation imports its four retained action/setting icons
through the public icon package. The existing eager dependency inventory includes
those entries so the first cold review cannot trigger Vite re-optimization and
invalidate unrelated in-flight Editing Recovery stories. No startup/reload guard
is relaxed; new review stories retain `visual-pending` metadata.
