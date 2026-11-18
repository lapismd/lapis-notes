# CLI registration host binding repair

Owner: UI. Requirements: LN-WS-107, LN-UI-017, LN-PKG-005 and LN-CAT-118.
The approved retired-AI guard intake exposed a published UI 0.2.4 runtime error
in Desktop's production General → Advanced surface. Its raw custom-field host
lookup loses identity when standard rendering copies or proxies the descriptor.
The [machine receipt](2026-11-18-cli-field-host-binding.json) retains exact
snapshots, commands, images, resources, results and raw-report hashes.

## Private repair and lifetime

The registration owns a stable private component closure. Before mounting its
private child, the closure verifies that the original controller still owns that
exact registration. It then supplies the host explicitly. A copied descriptor
retains its component; a disposed or superseded saved component cannot mount and
recover host IO. Same-ID registrations on separate controllers retain separate
ports. A stale disposer cannot remove a replacement registration.

All existing helper functions and maps remain. Public CLI signatures, exports,
installation/download/access behavior and settings persistence stay unchanged.
No Core, API, host-service, Language Service, native, manifest, lock or workflow
source changes are included. The patch Changeset records future UI release
intent without publishing or changing the package version.

## Regressions and retained failures

- Exact owner CLI unit target: before **2 failures and 2 passes**, after
  **4 passes**, including copied/proxied descriptors and saved-component
  disposal/replacement. The full UI package passes **19 tests in 4 files**,
  strict Svelte/TypeScript checks with zero errors/warnings, normal public build
  and publint; all three package tasks execute freshly.
- The real declarative controller story reproduces the same binding error:
  **1 failure, 6 unselected cases**. After repair it passes its interactions and
  strict axe checks. The complete CLI family then passes all **7 cases**.
- The final frozen catalog passes **240 cases across 58 runtime files** in four
  cold invocations: **96 + 50 + 41 + 53**, with no reported failures/errors/skips.
  Its declared static inventory contains 59 families. The two existing
  LinkPreviewAcceptance cases remain excluded by the unchanged user-approved
  configuration and are not counted as passing. Notes' hosted browser quarantine
  is unchanged.

The initial unit invocation used an unsupported Turbo argument boundary and
stopped before tests; the corrected command uses the existing `--task-args`
control. An intermediate owner check rejected one inferred private-component
return type; the wrapper now returns its own empty export record, without casts
or a Core change. The first two-controller story exposed fixture landmark axe
violations; the fixture now shows one real settings surface at a time while
retaining both live owners. Static parity correctly rejected an inaccurate
subject and then a missing new-family declaration. The final family declares
its genuine public AppSettingsRoot subject and uses existing FixtureControls.
Every failed attempt remains in the machine receipt; no assertion, timeout,
audit, quarantine or accessibility policy was weakened.

## Owner and consumer boundaries

The actual first-party registration caller is Desktop's `notes-settings.ts`,
owned and disposed by NotesWorkspace. The existing direct public CliSettings
families remain intact. Current Notes Web/frozen-host and Server web sources
contain no registration or `/cli` import; Server's unrelated dirty Terminal work
was preserved and no Server acceptance is claimed.

Full owner `check:all` passes 16 check tasks, 16 test tasks and 9 build tasks,
including 1,840 API tests and the deduplicated 2,204-case package cohort. Its
snapshot precedes the final FixtureControls import/context update. The product
code is unchanged. The complete cold catalog qualifies the final fixture form.

After the frozen catalog completed, the owner change rebased from Notes
`747a8555` to current main `17be0be0`. All ten owner-file hashes and all ten
incoming readiness/workflow/document hashes remained identical. Fresh relevant
fixture/document type checks pass on that base. All **223 release/readiness
controls** pass without failures or skips; the static build and its normal
acceptance pass **5 cases**, retaining **3 configured static-only exclusions**.
Final canonical `spec:check` passes on that base (run `ca6c7edd`). The first
seal retained a missing mapped Packages chapter finding (`5435bc6a`); package
context and the LN-PKG-005 verification row now identify the same repair without
changing the normative export contract or exceeding the chapter's 400-line
limit. Original Desktop consumer acceptance and rendered Autodocs Show Code
review are recorded separately below.

The normal owner consumer-pack lane builds six public package archives. Only
its verified UI archive is selected for the explicit temporary Desktop
validation overlay; the other generated archives are not adopted. The private
fixed UI 0.2.4 candidate has SHA256
`2dafcac8173701265ade22583c517fc582e3c2cbfcbe80fa4cd9f038097a8d5f`, from source
`a8f11e338fbd0a34dd214264e7a48e8e223eaa0b` on `17be0be0`.
Its export map and four root/CLI public declaration files are byte-identical to
the official package. The official npm UI 0.2.4 artifact remains unchanged and
broken at this registration boundary; this private candidate is not a published
replacement. Root review, hosted qualification, UI publication and normal-registry
Desktop adoption retain their gates. No native/provider execution, installed-app
replacement, user-profile access or visual baseline update is included.

## Original Desktop reproduction

Desktop source `662e47aa1bc0aaf06b3d165e7ea4c730ae4885f4` passes the original
CLI workspace case in all four cold desktop/narrow and light/dark presentations
(run `006af14a`): **4 passes**, zero failures, unhandled errors or axe errors.
General → Advanced renders the actual CLI settings; scoped credential creation,
token-file handling, revocation and the final Back to vaults teardown complete.

The published UI baseline (`f9f1da25`, source `d0a0ea13`) had one failing case
and one unhandled host-binding error; the other three modes had not run. Its
preceding readiness-locator attempt (`26efa48e`, source `5f61f46f`) remains a
separate failed attempt. The first private-UI replay (`58a3c48c`, source
`53ee3503`) cleared the runtime error and credential actions, then failed at a
previously unreached final navigation locator. The authorized locator-only
correction identifies the real Current workspace: Catalog vault action and
preserves intended teardown assertions and deadlines. All attempts remain in
the machine receipt.

The passing consumer uses the original five verified private archives plus only
the fixed UI archive identified above; API 0.6.9 and App Profile 0.2.6 remain
normal npm inputs. This proves the repaired built UI boundary under the explicit
temporary validation overlay. The affected CLI and NotesWorkspace families also pass **44 cases** in all four
cold modes (`3194b375`): seven NotesWorkspace and four CLI cases per mode, zero
failures, unhandled errors or axe errors. Wider consumer qualification remains
separately owned; these results do not prove repaired UI publication or final
normal-registry adoption.

## Rendered consumer example

The expanded Show Code disclosure was reviewed in the retained built Autodocs
artifact from source `a8f11e33` (`0c4c5b81`). It contains the public
`registerCliSettings`, `WorkspaceSettingsController`, `onDestroy` and
`@lapis-notes/ui/cli` usage, with no private demo component. The screenshot and
browser report are hashed in the machine receipt. The bounded owned Docker
probe uses the same qualified image, no rebuild or install, and reports zero
page errors. Its single resource-404 console message remains captured.

Two pre-browser global-module discovery attempts and two probes that incorrectly
expected the Show Code disclosure to have a button role remain failed in the
receipt. The final probe uses the observed disclosure text and passes. Product
and authored story source stayed frozen throughout; no baseline or visual
approval changed.
