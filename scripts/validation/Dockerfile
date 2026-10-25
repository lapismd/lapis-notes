FROM rust:1.99.0-slim-bookworm@sha256:2c3a22f0a5533ea2dd5a16627bc841228151faa2d4de2644ac9987e4a2f1f2fa AS rust
FROM denoland/deno:bin-2.9.7@sha256:bc5aa4466e21b6d3021226a85ba2e1911f7c386254d97b9d797903ab74edace2 AS deno
FROM ghcr.io/lapismd/lapis-ci@sha256:91341a81cc9306eed818c4c433cd29ed11d2ea64c703f32685391befe0eca503 AS ui
COPY --from=deno /deno /usr/local/bin/deno
ENV PNPM_HOME=/opt/pnpm PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PATH=/opt/tools:/opt/pnpm:$PATH
RUN test "$(playwright --version)" = 'Version 1.61.1' && playwright install --with-deps chromium webkit
RUN apt-get update && apt-get install -y --no-install-recommends git python3 curl ca-certificates lsof && rm -rf /var/lib/apt/lists/*
COPY install-tools.mjs /opt/install-tools.mjs
RUN node /opt/install-tools.mjs
RUN git config --system user.name 'LapisMD validation' && git config --system user.email 'validation@localhost' && git config --system --add safe.directory '*'
RUN mkdir -p /input /results /work/lapis-notes
WORKDIR /work/lapis-notes

FROM ui AS full
COPY --from=rust /usr/local/cargo /usr/local/cargo
COPY --from=rust /usr/local/rustup /usr/local/rustup
ENV RUSTUP_HOME=/usr/local/rustup CARGO_HOME=/cache/cargo CARGO_BUILD_JOBS=4
ENV PATH=/usr/local/cargo/bin:$PATH
RUN apt-get update && apt-get install -y --no-install-recommends build-essential pkg-config clang cmake protobuf-compiler libssl-dev && rm -rf /var/lib/apt/lists/*
RUN rustup component add rustfmt clippy --toolchain 1.99.0
