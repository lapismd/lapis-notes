# App Profile and framework cohort publication

The checked release source is merged main
`ccca08e9d13fe283fe957bb220234b92cb057abe`. Its approved GitHub Release workflow
`43745647019` completes successfully on attempt two after the package-specific
App Profile trusted publisher is renewed.

The initial attempt passes exact-main validation and publishes API 0.6.4,
UI 0.2.1 and Workspace 0.4.6 on `next`, then App Profile publication fails with
`ENEEDAUTH`. App Profile already exists at 0.1.0; a first-publication bootstrap
is unnecessary. The authenticated npm settings page shows its existing
`lapismd/lapis-notes`, `release.yml`, `npm-production` connection as expired.

The user authenticates with their security key and explicitly confirms creating
the prepared replacement authorization. The exact same repository/workflow and
environment are selected, with direct npm publish and staged publication
permission; dist-tag administration remains disabled. Package publishing-access
settings remain unchanged. npm initially reports pending validation.

The approved failed-job rerun skips the three existing versions and publishes
App Profile 0.2.0 with GitHub provenance (Sigstore log index 3908835671).
Registry consumer verification passes and all four GitHub releases are created
on 15 November 2026 at 19:27 UTC. The complete workflow succeeds. Registry
metadata independently exposes each version and its integrity; App Profile
retains `latest: 0.1.0`, `next: 0.2.0`, as selected by the release manifest.
This receipt does not promote dist-tags or republish existing versions.

| Package     | Version | npm integrity                                                                                     |
| ----------- | ------- | ------------------------------------------------------------------------------------------------- |
| API         | 0.6.4   | `sha512-1kWZKFeKSX54moc6PMQLDve1ZMwAn76+LRdWQikTJiSvHkD9Ahym9hgSOwKnGcLCoHTfyObsvEDd98MAHY7nBQ==` |
| UI          | 0.2.1   | `sha512-jluN0IuqzdHd95U48YRL5Gmt475Sw/Tw3BjgC9KY2uXDu4lJYnNv0sQ2yjvSI/AdCBv+tG1Az1gOaL83eI5Q2g==` |
| Workspace   | 0.4.6   | `sha512-FW2wSwsq3jPjVKfIKHreQMkBtZsjO3wY5tTJneMZPgyphSxH6OvUFCD87Np51oK71hhJJxDhkEZ5Zaxz/5LPyQ==` |
| App Profile | 0.2.0   | `sha512-0CBsF6M6RJgzRfKG38tIIybv/V3kunnGP+LzgonKPP2QGhIJqsNCbgyRY77HFLcUS7O+TwVrssOggd9G7eW48g==` |

Release: <https://github.com/lapismd/lapis-notes/releases/tag/app-profile%400.2.0>.
Workflow: <https://github.com/lapismd/lapis-notes/actions/runs/43745647019>.

History's optional native synchronization observer is a separately versioned
Plugins change. Profile still consumes History ^0.4.0; adopting its next minor
requires a subsequent qualified Profile release. Server/Desktop registry intake,
OS custody, cold native/browser transport and application releases remain
independent gates. This publication does not close them.
