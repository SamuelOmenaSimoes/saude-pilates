# Build stage
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

# Install dependencies (lockfile + package.json + patches)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build

# Production stage
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production deps only
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile --prod

# Copy built output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
