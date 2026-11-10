# syntax=docker/dockerfile:1
# Build context: repository root. Public Expo values are baked into the JS bundle.
FROM node:22-slim AS build
RUN npm install -g pnpm@9.15.4
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY patches ./patches
COPY packages ./packages
COPY apps/mobile ./apps/mobile
RUN pnpm install --frozen-lockfile --ignore-scripts
ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_CATALOG_URL
ARG EXPO_PUBLIC_AUTH_REDIRECT_URL
ENV BRAND=lucro-caseiro EXPO_PUBLIC_BRAND=lucro-caseiro CI=1
RUN test -n "$EXPO_PUBLIC_API_URL" && test -n "$EXPO_PUBLIC_SUPABASE_URL" && test -n "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
RUN pnpm --filter @lucro-caseiro/mobile build

FROM node:22-slim AS runtime
WORKDIR /repo/apps/mobile
ENV NODE_ENV=production PORT=8083
COPY --from=build --chown=node:node /repo/apps/mobile/dist/lucro-caseiro ./dist/lucro-caseiro
COPY --from=build --chown=node:node /repo/apps/mobile/scripts/serve-pwa.mjs ./scripts/serve-pwa.mjs
USER node
EXPOSE 8083
CMD ["node", "scripts/serve-pwa.mjs", "lucro-caseiro"]
