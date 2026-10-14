# syntax=docker/dockerfile:1.7

ARG LAPIS_CI_IMAGE=ghcr.io/lapismd/lapis-ci@sha256:91341a81cc9306eed818c4c433cd29ed11d2ea64c703f32685391befe0eca503

FROM ${LAPIS_CI_IMAGE} AS fetch
WORKDIR /dependency-context
COPY . .
RUN pnpm fetch --frozen-lockfile

FROM ${LAPIS_CI_IMAGE}
LABEL org.opencontainers.image.title="Lapis Notes CI dependencies" \
      org.opencontainers.image.description="Lockfile-specific pnpm store for Lapis Notes validation" \
      org.opencontainers.image.source="https://github.com/lapismd/lapis-notes" \
      org.opencontainers.image.licenses="Apache-2.0"
COPY --from=fetch /pnpm/store /pnpm/store
WORKDIR /workspace
