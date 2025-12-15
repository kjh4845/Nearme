FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/app.js"]
