# AI Plugin / Application integration

## LN-AI-045 — Storybook: Do not start lapis-ai-controller as a sidecar

<a id="ln-ai-045"></a>

**Requirement.** Storybook MUST NOT start `lapis-ai-controller` as a sidecar. Live attach MAY use a configured URL and token after the user starts the service. Default stories MUST stay Fake.
