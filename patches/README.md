# Dependency lifecycle patches

The tracked pnpm patch applies the same temporary Bits UI lifecycle correction
used by the first-party plugin monorepo.

- Link Preview cancels its deferred selection probe when its root closes or is
  destroyed.
- Scroll Area replaces its uncancellable resize debounce with a cancellable
  timer cleared when the shared scrollbar state is destroyed.
- Dismissible Layer cancels its deferred listener activation before reading
  reference and behavior boxes after teardown.

Both callbacks otherwise read Svelte derived state after the owning effect has
been destroyed and emit `derived_inert`. Remove the patch only after the
resolved Bits UI version contains equivalent teardown behavior and both the
focused regression and complete Storybook interaction suite pass without it.
