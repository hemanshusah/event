# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/api-gateway/package*.json ./backend/api-gateway/

# Install dependencies
RUN npm ci --only=production && \
    cd backend/api-gateway && \
    npm ci --only=production

# Copy source code
COPY backend/api-gateway/ ./backend/api-gateway/

# Build application
WORKDIR /app/backend/api-gateway
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/backend/api-gateway/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/api-gateway/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend/api-gateway/package*.json ./

# Copy database schemas
COPY --chown=nodejs:nodejs database/ ./database/

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "dist/server.js"]
