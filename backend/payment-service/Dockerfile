# Payment Service Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S payment -u 1001

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for TypeScript compilation)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Change ownership to nodejs user
RUN chown -R payment:nodejs /app
USER payment

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]