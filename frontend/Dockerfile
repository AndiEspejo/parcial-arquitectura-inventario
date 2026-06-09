# ---------------------------------------------------------------------------
# Stage 1 — Build the React SPA with Vite
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 — Serve the static dist with nginx
# ---------------------------------------------------------------------------
FROM nginx:alpine AS runtime

# Remove default nginx site config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config (handles SPA routing + reverse proxy to API)
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy the Vite build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
