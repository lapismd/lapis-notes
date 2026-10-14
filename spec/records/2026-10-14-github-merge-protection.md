# GitHub merge protection — 2026-10-14

The user requested required passing tests after Plugins PR 8 merged with failed
Storybook checks. Plugins, Design Core and Registry previously had no classic
main protection. Notes already required its aggregate `validate` check.

All protected repositories require PRs, current base-branch integration and
observed GitHub Actions checks bound to application id 15368. Administrators
must satisfy the same rules. Existing review requirements are preserved.
New protections require resolved conversations and disable force pushes/deletion.
No extra human review count is introduced.

| Repository                   | Required checks                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| lapis-plugins                | All nine CI jobs, including Storybook interactions and aggregate validation             |
| lapis-notes                  | All twelve CI jobs, including Storybook, Web and both native packaged platforms         |
| design-core                  | All eleven governance, quality, unit, browser, Storybook, audit and validation jobs     |
| plugin-registry              | Complete `checks` job                                                                   |
| ai-controller                | `validate`                                                                              |
| agent-redaction              | `validate`                                                                              |
| mira-mde                     | Specification/release intent, package/repository gates and Storybook/browser acceptance |
| storybook-addon-visual-delta | Specification, package/unit and all three browser acceptance jobs                       |
| nostr-auth                   | Repository and 2-of-3 smoke checks                                                      |
| nostr-relay                  | Format/unit/specification/patch, Docker integration and candidate image/scan jobs       |
| lapis-ci                     | Candidate image validation                                                              |

Settings are read back from GitHub after each update. Required names are taken
from actual CI runs, not inferred from workflow filenames. Workflow source
confirms PR triggers and test execution. Before/after responses are retained
locally under `/tmp/lapis-branch-protection-20261014` for recovery.

AI Host, Terminal Host and Spec Validator currently expose release workflows
rather than PR CI. Community exposes specification publication only; the org
profile has scheduled metadata refresh; the private sandbox has no active
workflow. These repositories need separate PR-validation work before test-based
merge gates can be configured. This settings change does not start releases,
reactivate parked Community, or alter source packages.
