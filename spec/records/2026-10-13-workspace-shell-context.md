# Archived implementation context: Workspace Shell

Presentation-only relocation from `workspace-shell.md`. Current requirements remain canonical.

Workspace 0.1.1 carries the static registry management contracts and consumes
API and UI 0.1.1 peers. Release validation preserves the same App-owned shell
and plugin-management interaction and accessibility requirements.

Dependency acceptance now uses published Design Core `0.3.2` and Mira `0.0.3` through portable npm ranges. Source ownership and public contracts remain
unchanged; local overrides for these released packages are retired.
