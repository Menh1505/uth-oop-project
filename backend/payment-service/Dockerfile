# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install pnpm (dùng corepack cho chuẩn, hoặc npm -g cũng được)
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy package files (NHỚ có pnpm-lock.yaml)
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev deps for building)
RUN pnpm install --frozen-lockfile

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src ./src

# Build
RUN pnpm run build

# Remove dev dependencies to reduce image size
RUN pnpm prune --prod

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3008

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S payment-service -u 1001
USER payment-service

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: 3008, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) { console.log('Healthy'); process.exit(0); } \
      else { console.log('Unhealthy'); process.exit(1); } \
    }); \
    req.on('error', () => { console.log('Error'); process.exit(1); }); \
    req.end();"

# Start the application
CMD ["pnpm", "start"]
