# ================================================================
# Stage 1: Build production assets
# ================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definitions
COPY package.json package-lock.json* ./

# Install clean dependencies
RUN npm ci || npm install

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# ================================================================
# Stage 2: Production Web Server with Nginx
# ================================================================
FROM nginx:alpine AS runner

# Copy compiled static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
