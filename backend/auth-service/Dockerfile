FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps 2>&1 && npm cache clean --force

# Copy source code
COPY . .

# Build
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
