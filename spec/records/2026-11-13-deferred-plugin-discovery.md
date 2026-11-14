# Discoverable dormant plugins

The user requested completion of Notebook activation and any other activation
work needed for faster startup, including pushing and releasing the owner
changes. Existing publication and CI gates remain. This source slice implements
LN-PLUG-127/128 so deferral preserves existing ribbon and Markdown pane actions.
It does not change host vault policy, background-service ownership or grant
additional permissions.

## Exact regression

```sh
node scripts/validation.mjs run test --filter=@lapis-notes/api --task-args -- src/lib/__tests__/plugin-manager.test.ts -t 'keeps deferred plugin discovery'
```

Both cases fail before implementation: an unknown discovery contribution forces
runtime evaluation during boot. They pass after typed indexing and disposable
installation. The complete affected PluginManager, contribution registry and
discovery lifetime family passes 99 cases, including captured-target retirement,
changed files, runtime placeholder replacement and late callback fencing.
An initial command without the required Turbo `--task-args` marker failed before
collecting tests; that invocation is retained and is not regression evidence.

The contribution records reference only their owner's declared commands.
Ribbon invocation uses an owner-qualified activation event; Markdown actions
check their captured leaf/file before activation and again before execution.
Activation retires discovery placeholders before installing runtime controls,
preserving stable ribbon identities and preventing duplicate menu providers.
Disablement disposes both controls and fences callbacks retained by an old menu.

Focused source check passes with zero Svelte errors or warnings and successful
TypeScript checks. Public positive/negative declaration coverage is included.
Full package qualification passes 1,785 API tests and 2,131 package tests, all
16 check and test tasks, and all nine builds with public declaration/publint
checks. The focused two-family cold catalog passes 53 cases; the complete
four-shard cold interaction/accessibility lane passes 276 (102/70/47/57).
The existing hosted LN-CAT-121 quarantine remains unchanged and is not a pass.
Canonical validation and development archive qualification now pass.
The first canonical run
identified missing architecture/workspace cross-references; those mapped
chapters now describe the discovery lifecycle and captured-target ownership.

Receipts under `.local/deferred-discovery/`:

- Exact before: `lapis-notes-validation-75ccd376-214c-417f-9448-84dc48a4101e`.
- Exact after: `lapis-notes-validation-900fcf55-9dce-46c5-bbef-ae0893b81ffe`.
- Complete affected family: `lapis-notes-validation-d7ee47b7-c062-4bd4-88de-13c9c0ce821f`.
- Source check: `lapis-notes-validation-6f5e35fd-f7db-4fbb-96b2-fd16b0d919aa`.
- Full check/test/build: `lapis-notes-validation-5fa290b0-40a0-4ae7-8a44-3dad36cae614`.
- Focused cold catalog: `lapis-notes-validation-256b34b0-6fdf-43ce-a6bf-eaec9a6f972f`.
- Complete cold catalog: `lapis-notes-validation-a1476802-8722-407f-bc7f-cf11f2f46407`.
- Final canonical check: `lapis-notes-validation-cbeb3cc3-c4d7-4924-aeb5-3c08b78efb93`.
- Development archive build/pack: `lapis-notes-validation-aadffc2d-9c61-45fa-8db7-b5ff185f3445`.

The five development archives originate from clean empty source `cbb2e92b`,
whose package tree matches committed `948e198d`. All inventory SHA-256 hashes
were independently verified. API archive SHA-256 is
`7529b0666fef61c01adb41f38ebba7c9e5713f33fdd0055ed493bdd13b9b9bac`;
its public declarations expose both discovery contributions and its runtime
contains the installer and PluginManager integration. This modified API 0.3.1
is a development candidate only and MUST NOT overwrite the published version.
Full archive evidence is `.local/deferred-discovery/consumer-pack-verification.json`.

## Owner and delivery boundaries

Graph and Canvas require ribbon declarations before their enabled runtime can
be deferred safely. Slides and Transcripts need retained Markdown menu actions.
Notebook and binary file handlers need file, command, restored-view and embed
demand. Their owner manifests, installed cold acceptance, normal-registry
publication and Server/Desktop adoption remain separate gates.

Search indexing, History capture, AI memory ingestion, Bookmarks rename
maintenance, and editor-wide status/diagnostic services cannot be made dormant
indiscriminately. Their activation decisions must preserve configured background
work. Community and Sync remain parked. No production site or user vault is used.

The coherent renderer intake also requires Mira 0.2.0 and the matching wrapper
cohort, plus Design Core's Mira dependency update. Released Design Core 0.13.0
and API 0.3.1 still depend on Mira 0.1.5; owner updates and final registry graph
verification are required before claiming a single-version consumer delivery.
