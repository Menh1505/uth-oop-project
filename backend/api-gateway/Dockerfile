FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/dist ./dist/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gateway -u 1001

# Change ownership of the app directory
RUN chown -R gateway:nodejs /app
USER gateway

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]