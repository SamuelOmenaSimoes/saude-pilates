# Build stage
FROM node:24.14-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Invalidate cache when commit changes (CI passes CACHE_BUST=git sha)
ARG CACHE_BUST
RUN echo "Build from commit: ${CACHE_BUST:-none}"

# Copy source and build
COPY . .
RUN npm run build

# Production stage (reuse builder's node_modules, no second npm ci)
FROM node:24.14-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["node", "dist/index.js"]
