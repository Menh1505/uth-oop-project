FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm i --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

EXPOSE 3004
CMD ["node", "dist/server.js"]
