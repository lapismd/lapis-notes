# Lapis Notes specification

This is the canonical contract for the Lapis Notes runtime, retained UI, workspace adapter, application profile, and Deno and browser hosts. Extracted plugins are owned by the sibling `lapis-plugins` repository and consumed through public packages.

## Reading order

Start with Architecture and Packages, then follow the owning runtime, host, workspace, or plugin-integration topic. Verification records evidence and status; Specification Governance defines authoring and change checks.

## Authority

1. Requirements under `spec/src/`
2. Published interfaces and conforming implementation
3. Storybook examples and verification evidence
4. Onboarding and workflow documentation

Storybook and mdBook render the same canonical Markdown. Completed implementation context lives in `spec/records/`; outstanding work lives in the canonical backlog.
