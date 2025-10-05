# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY web-admin/package*.json ./web-admin/

# Install dependencies
RUN npm ci && \
    cd web-admin && \
    npm ci

# Copy source code
COPY web-admin/ ./web-admin/

# Build application
WORKDIR /app/web-admin
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built application
COPY --from=builder /app/web-admin/build /usr/share/nginx/html

# Copy nginx configuration
COPY deployment/nginx/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
