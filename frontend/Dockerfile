# Etapa 1: Build de la aplicación
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Servidor web ligero para producción
FROM nginx:alpine

# Copiar los archivos compilados al directorio de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de Nginx para manejar rutas de React (SPA)
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