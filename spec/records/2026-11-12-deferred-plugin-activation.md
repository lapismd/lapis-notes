# Deferred plugin activation qualification

The API previously evaluated one deferred runtime twice when view and command
activation overlapped. `PluginManager` now shares one in-flight activation per
plugin ID, publishes that flight before evaluating code, and releases it after
success or failure. Different plugin IDs retain independent activation. No
public method, event or manifest shape changes in this API slice.

## Exact regression

`pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/plugin-manager.test.ts -t 'coalesces concurrent deferred activation before evaluating the runtime'`

Before: one failure, two evaluations instead of one. After: one pass. The three
focused cases also cover shared failure followed by explicit retry and independent
plugins. The complete PluginManager file passes all 84 cases. Local receipts are
under `.local/plugin-activation/` (`concurrent-before.log`,
`concurrent-after.log`, `focused-after.log`, `plugin-manager-after.log`).

## Wider source gates

The final frozen registry graph passes root check, 2,103 package tests (1,761
API), and build on the remote `omarchy` Docker worker. Check and build include
the retained App ownership, public declaration and package lint gates. Receipt:
`check-all-final.log`, run `lapis-notes-validation-2fbe21d3-a802-4175-b6d3-dbda70686160`.

All 275 cold interaction/accessibility cases pass across four fresh processes:
102 + 70 + 46 + 57. Receipt: `storybook-final.log`, run
`lapis-notes-validation-d6d48725-fbc4-4a0d-af6d-1ea959e29571`.
The existing hosted interaction quarantine remains disabled coverage; these
executed local cases do not relabel it as a hosted pass. No visual baselines,
assertions, timing or budgets changed.

## Registry catalog prerequisite

The first normal-registry catalog run exposed six Search accessible-name
failures and one Search tool-result failure in AI. Its lock still selected
Search 0.1.3. The already published Search 0.1.6 contains the owner fix; the root
development range is now `^0.1.6`, with registry integrity
`sha512-IgXatOmCMAqdg/FIcliUi8qhxrhxwo2L3yISXR9szMy0zTaBpG/K/UKo7MWGfjAiYmjKBucr3AjNN/Xf34FFzQ==`.
All 26 affected Search/AI cases pass unchanged before the full 275-case pass.
The application profile retains its separate dependency selection. The narrow
lock refresh preserves the other direct dependency versions and uses no local
package archives or hooks in the Docker installation.

## Delivery boundary

The API repair needs normal hosted CI, release/provenance qualification and
registry consumer intake. Notebook's manifest and cold activation, Markdown's
directive/embed dispatch, portable asynchronous embed rendering and the actual
Server/Desktop profiles remain separate owner and consumer gates. This record
does not claim faster deployed startup, zero network traffic, production
deployment or completed Notebook delivery.
