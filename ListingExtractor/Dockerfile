FROM node:20-slim AS base

# Install Playwright dependencies for Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# DEPENDENCIES 
FROM base AS deps

WORKDIR /app

# Copy package files
COPY ListingExtractor/package.json ./

# Install dependencies
RUN pnpm install

# Install Playwright browsers
RUN npx playwright install chromium

# BUILD 
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./

# Copy source code
COPY ListingExtractor/src ./src
COPY ListingExtractor/tsconfig.json ./

# Build TypeScript
RUN pnpm build

# PRODUCTION 
FROM base AS runner

WORKDIR /app

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs appuser

# Copy Playwright browsers from deps stage
COPY --from=deps /root/.cache/ms-playwright /home/appuser/.cache/ms-playwright

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Set browser ownership
RUN chown -R appuser:nodejs /home/appuser/.cache

USER appuser

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/home/appuser/.cache/ms-playwright

CMD ["node", "dist/index.js"]
