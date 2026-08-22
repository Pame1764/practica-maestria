# Etapa 1: Build de React con Vite
# ==========================================
# ETAPA 1 - CONSTRUIR FRONTEND
# ==========================================
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# ==========================================
# ETAPA 2 - SERVIDOR DE PRODUCCIÓN
# ==========================================
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]