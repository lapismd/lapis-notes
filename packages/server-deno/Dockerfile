# syntax=docker/dockerfile:1.7

FROM node:24.13-bookworm-slim AS web-build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
COPY . .
RUN pnpm install --frozen-lockfile --ignore-pnpmfile --ignore-scripts --filter @lapis-notes/web...
RUN pnpm --filter @lapis-notes/web build:server

FROM denoland/deno:2.9.5 AS deno-deps
ENV DENO_DIR=/deno-dir
WORKDIR /app
COPY packages/api ./packages/api
COPY packages/deno-host-services ./packages/deno-host-services
COPY packages/language-service ./packages/language-service
COPY packages/server-deno ./packages/server-deno
RUN deno cache --node-modules-dir=auto --sloppy-imports packages/server-deno/src/main.ts

FROM denoland/deno:2.9.5
ENV DENO_DIR=/deno-dir \
    NODE_ENV=production \
    LAPIS_SERVER_DATA_ROOT=/data \
    LAPIS_SERVER_STATIC_ROOT=/app/static \
    LAPIS_SERVER_HOST=0.0.0.0 \
    LAPIS_SERVER_PORT=8787
WORKDIR /app
COPY --from=deno-deps /deno-dir /deno-dir
COPY --from=deno-deps /app/packages /app/packages
COPY --from=web-build /workspace/packages/web/dist-server /app/static
USER root
RUN mkdir -p /data && chown deno:deno /data
USER deno
EXPOSE 8787
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["deno", "run", "--no-check", "--no-prompt", "--allow-net=127.0.0.1:8787", "data:application/typescript,const%20response%3Dawait%20fetch(%22http%3A%2F%2F127.0.0.1%3A8787%2Freadyz%22)%3Bif(!response.ok)Deno.exit(1)%3B"]
CMD ["deno", "run", "--no-check", "--no-prompt", "--sloppy-imports", "--unstable-no-legacy-abort", "--allow-read=/app,/data,/run/secrets,/deno-dir,/usr/bin/ldd", "--allow-write=/data", "--allow-net=0.0.0.0:8787", "--allow-env=LAPIS_SERVER_BOOTSTRAP_USERNAME,LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE,LAPIS_SERVER_DATA_ROOT,LAPIS_SERVER_STATIC_ROOT,LAPIS_SERVER_HOST,LAPIS_SERVER_PORT,LAPIS_SERVER_ORIGIN,LAPIS_SERVER_INSECURE_COOKIE,LAPIS_SERVER_TRUST_PROXY,LAPIS_SERVER_BUILD_ID,NAPI_RS_NATIVE_LIBRARY_PATH,NAPI_RS_FORCE_WASI,NAPI_RS_ENFORCE_VERSION_CHECK,LOG,NODE_ENV", "--allow-ffi=/deno-dir,/app/packages/server-deno/node_modules", "/app/packages/server-deno/src/main.ts"]
