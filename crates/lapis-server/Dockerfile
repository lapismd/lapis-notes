# syntax=docker/dockerfile:1.7
FROM rust:1.99.0-bookworm AS native
RUN apt-get update && apt-get install -y --no-install-recommends cmake clang pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY . /work/
WORKDIR /work/lapis-notes
ENV CARGO_BUILD_JOBS=2
RUN --mount=type=cache,id=lapis-server-rust-cargo,target=/usr/local/cargo/registry \
    --mount=type=cache,id=lapis-server-rust-git,target=/usr/local/cargo/git \
    --mount=type=cache,id=lapis-server-rust-release,target=/work/lapis-notes/.local/rust-core-target \
    cargo build --release --locked -p lapis-server && cp .local/rust-core-target/release/lapis-server /lapis-server

FROM node:24.15.0-bookworm-slim AS web
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
COPY . /work/
WORKDIR /work/lapis-notes
ENV NODE_OPTIONS=--max-old-space-size=8192 GOMAXPROCS=2 UV_THREADPOOL_SIZE=2
ENV VITE_LAPIS_NATIVE_METADATA=1 VITE_LAPIS_NATIVE_HISTORY=1 VITE_LAPIS_NATIVE_TASKS=1
RUN --mount=type=cache,id=lapis-server-rust-pnpm,target=/cache/pnpm node scripts/server-container/install.mjs /work/.qualification
RUN pnpm exec turbo run build --filter=@lapis-notes/app-profile... --concurrency=2 && pnpm --filter @lapis-notes/web build:rust-server

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl git libstdc++6 libssl3 && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 1993 lapis && useradd --uid 1993 --gid 1993 --home-dir /data --shell /usr/sbin/nologin lapis \
    && mkdir -p /app /data && chown lapis:lapis /data
COPY --from=native /lapis-server /app/lapis-server
COPY --from=web /work/lapis-notes/packages/web/dist-rust-server /app/static
RUN chmod -R a-w /app
ENV LAPIS_SERVER_DATA_ROOT=/data LAPIS_SERVER_STATIC_ROOT=/app/static LAPIS_SERVER_NATIVE_HISTORY=1
USER lapis
WORKDIR /app
EXPOSE 8787
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 CMD ["curl", "--fail", "--silent", "http://127.0.0.1:8787/readyz"]
ENTRYPOINT ["/app/lapis-server"]
CMD ["/run/lapis/config.json", "0.0.0.0:8787"]
