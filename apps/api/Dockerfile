# syntax=docker/dockerfile:1
# Build context: repo root (so pnpm workspace resolves correctly)

FROM node:22-slim

RUN npm install -g pnpm@9.15.4

WORKDIR /repo

# Manifests first for layer caching
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY patches ./patches
COPY apps/api/package.json ./apps/api/
COPY packages/brands/package.json ./packages/brands/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/

RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source
COPY apps/api ./apps/api
COPY packages/brands ./packages/brands
COPY packages/contracts ./packages/contracts
COPY packages/database ./packages/database
COPY packages/config ./packages/config
COPY docs/marketing ./docs/marketing

ENV NODE_ENV=production
EXPOSE 3001

WORKDIR /repo/apps/api
USER node
CMD ["pnpm", "start"]
