FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S recommendation -u 1001

# Change ownership
RUN chown -R recommendation:nodejs /app
USER recommendation

# Expose port
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3007/health || exit 1

# Start the application
CMD ["npm", "start"]