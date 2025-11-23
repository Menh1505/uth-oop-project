FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install
RUN npm run build

EXPOSE 3003

CMD ["npm", "start"]
