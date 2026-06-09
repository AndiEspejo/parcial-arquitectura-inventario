# =============================================================================
# Multi-stage Dockerfile — Warehouse Inventory API
# Stage 1 (build): compiles TypeScript → dist/
# Stage 2 (runtime): node:20-alpine with only production deps + dist/
# =============================================================================

# --------------- Stage 1: build -----------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install all dependencies (including devDependencies for tsc)
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# --------------- Stage 2: runtime ---------------------------------------------
FROM node:20-alpine AS runtime

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and docs (OpenAPI YAML loaded at runtime)
COPY --from=build /app/dist ./dist
COPY docs/ ./docs/

# Drop to non-root user
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
