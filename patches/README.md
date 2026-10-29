# Dependency patches

These tracked pnpm patches restore two published-package repairs for registry
installs. Remove each patch after the published version contains the same
behavior and the complete Storybook interaction suite passes without it.

- `bits-ui@2.20.2` cancels Link Preview's deferred selection probe when its
  root closes or is destroyed. The probe otherwise reads Svelte derived state
  after teardown and emits `derived_inert`.
- `@lapis-notes/bases@0.1.4` names the Select triggers that plugins source
  already names. Combobox buttons do not take their accessible name from
  visible text, so axe `button-name` fails without these labels.
