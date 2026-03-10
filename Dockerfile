# Build stage
FROM node:24.14-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source and build (BUILD_SHA from CI = git commit, injected into client + server)
ARG BUILD_SHA
ENV BUILD_SHA=${BUILD_SHA}

COPY . .
RUN npm run build

# Production stage (reuse builder's node_modules, no second npm ci)
FROM node:24.14-alpine AS production

WORKDIR /app

ARG BUILD_SHA
ENV NODE_ENV=production
ENV PORT=3000
ENV BUILD_SHA=${BUILD_SHA}

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["node", "dist/index.js"]
