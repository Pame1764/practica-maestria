# Etapa 1: Build de React con Vite
FROM node:24-alpine AS builder

WORKDIR /app

# Definir la URL pública del backend para la etapa de compilación
ENV VITE_API_URL=https://proyecto-integrador-backend-production-92c1.up.railway.app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Servidor Web Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 5173; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]