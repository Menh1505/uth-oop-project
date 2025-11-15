FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
# Install all dependencies (including dev for TypeScript compilation)
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3004

CMD ["npm", "start"]