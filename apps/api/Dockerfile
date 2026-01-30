# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build
RUN pnpm --filter @bullish-clash/shared build
RUN pnpm --filter @bullish-clash/api build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy drizzle config and schema for migrations
COPY --from=builder /app/apps/api/drizzle.config.ts ./apps/api/
COPY --from=builder /app/apps/api/src/database ./apps/api/src/database

# Install production dependencies only
# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Install drizzle-kit globally for migrations
RUN npm install -g drizzle-kit

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
