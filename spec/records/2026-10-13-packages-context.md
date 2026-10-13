# Archived implementation context: Packages

Presentation-only relocation from `packages.md`. Current requirements remain canonical.

The generated `changeset-release/main` PR skips repeated source-change and
release-intent gates under LN-GOV-047. Its version and changelog mutations come
from source commits that already passed those gates. Every validation lane in
LN-PKG-142 still runs, and release-intent unit tests inject their branch context
instead of inheriting the current CI branch.

Dependency acceptance now uses published Design Core `0.3.2` and Mira `0.0.3` through portable npm ranges. Source ownership and public contracts remain
unchanged; local overrides for these released packages are retired.
Shared specification tooling resolves `@lapismd/spec-validator@0.1.4` from npm.
