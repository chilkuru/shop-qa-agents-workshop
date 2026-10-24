# Build context is ./shop-platform: the web app depends on ../packages/types.
FROM node:20-alpine AS build
WORKDIR /app

COPY packages/types/package.json packages/types/package-lock.json ./packages/types/
COPY packages/types/src ./packages/types/src

WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/index.html web/tsconfig.json web/vite.config.ts ./
COPY web/src ./src

# Baked in at build time; the browser, not the container, calls the API.
ARG VITE_API_BASE_URL=http://localhost:8081
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
# Client-side routes (/orders, /cart) must fall back to the SPA shell.
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 80
