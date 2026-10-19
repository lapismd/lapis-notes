# syntax=docker/dockerfile:1.7
FROM node:24.15.0-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
COPY . .
RUN --mount=type=cache,id=lapis-server-node-pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-pnpmfile --ignore-scripts --store-dir /pnpm/store
RUN pnpm exec turbo run build --filter=@lapis-notes/server-node... --concurrency=1
RUN pnpm --filter @lapis-notes/host-services test \
    && pnpm --filter @lapis-notes/server-node test \
    && node packages/server-node/dist/server.smoke.js
RUN pnpm --filter @lapis-notes/web build:server
RUN node packages/server-node/runtime-package.mjs /out
RUN --mount=type=cache,id=lapis-server-node-pnpm,target=/pnpm/store \
    cd /out && pnpm install --prod --frozen-lockfile --ignore-pnpmfile --ignore-scripts --store-dir /pnpm/store

FROM node:24.15.0-bookworm-slim AS runtime
ENV NODE_ENV=production LAPIS_SERVER_DATA_ROOT=/data LAPIS_SERVER_STATIC_ROOT=/app/static LAPIS_SERVER_HOST=0.0.0.0 LAPIS_SERVER_PORT=8787
WORKDIR /app
COPY --from=build /out ./
COPY --from=build /workspace/packages/web/dist-server ./static
RUN groupmod -g 1993 node && usermod -u 1993 -g 1993 node \
    && mkdir -p /data && chown node:node /data /home/node && chmod -R a-w /app
USER node
EXPOSE 8787
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD ["node", "--input-type=module", "-e", "const response=await fetch('http://127.0.0.1:8787/readyz');if(!response.ok)process.exit(1)"]
CMD ["node", "dist/main.js"]
