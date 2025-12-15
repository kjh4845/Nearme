# build stage
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_URL
ARG VITE_KAKAO_MAP_KEY
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_KAKAO_MAP_KEY=${VITE_KAKAO_MAP_KEY}

COPY package*.json ./
RUN npm ci
COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public
RUN npm run build

# run stage
FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
