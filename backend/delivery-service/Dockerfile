# ============================================
# DELIVERY SERVICE DOCKERFILE
# ============================================
# Multi-stage build for production optimization

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies for smaller image
RUN npm ci --only=production --no-audit --no-fund

# Stage 2: Production stage
FROM node:18-alpine AS production

# Add metadata
LABEL maintainer="UTH OOP Project Team"
LABEL service="delivery-service"
LABEL version="1.0.0"
LABEL description="Comprehensive delivery service with real-time tracking"

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S delivery -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=delivery:nodejs /app/dist ./dist
COPY --from=builder --chown=delivery:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=delivery:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads && \
    chown -R delivery:nodejs /app/logs /app/uploads

# Install additional production dependencies if needed
RUN apk add --no-cache \
    curl \
    tini \
    && rm -rf /var/cache/apk/*

# Switch to non-root user
USER delivery

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3004/health || exit 1

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/server.js"]

# ============================================
# DEVELOPMENT DOCKERFILE
# ============================================

# Development stage (for docker-compose development)
FROM node:18-alpine AS development

WORKDIR /app

# Install development tools
RUN apk add --no-cache \
    curl \
    git \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads

# Expose port
EXPOSE 3004

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3004/health || exit 1

# Start development server with hot reload
CMD ["npm", "run", "dev"]