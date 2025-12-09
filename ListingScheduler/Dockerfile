FROM node:20-alpine AS base

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# DEPENDENCIES 
FROM base AS deps

WORKDIR /app

# Copy package files
COPY ListingScheduler/package.json ./

# Install dependencies
RUN pnpm install

# BUILD 
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./

# Copy source code
COPY ListingScheduler/src ./src
COPY ListingScheduler/tsconfig.json ./
COPY ListingScheduler/crontab ./crontab

# Build TypeScript
RUN pnpm build

# PRODUCTION 
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/crontab ./crontab

USER appuser

ENV NODE_ENV=production

CMD ["node", "dist/worker.js"]
