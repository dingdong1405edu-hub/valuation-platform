FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

# Copy manifests first for better caching
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/ai/package.json packages/ai/
COPY prisma prisma

# Install all workspace deps
RUN pnpm install --no-frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client and build web
RUN pnpm db:generate
RUN pnpm --filter @vp/web build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# At runtime: push schema, then start
CMD ["sh", "-c", "pnpm db:push --skip-generate && pnpm --filter @vp/web start"]
