# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src ./src

# Install TypeScript globally and build
RUN npm install -g typescript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm ci --only=production

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
CMD ["npm", "start"]