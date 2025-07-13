# Multi-stage build para Static CMS
FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    && rm -rf /var/cache/apk/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY .env.example .env

# Instalar dependencias
RUN npm ci --only=production

# Etapa de desarrollo
FROM base AS development

# Instalar dependencias de desarrollo
RUN npm ci

# Copiar código fuente
COPY . .

# Exponer puertos
EXPOSE 3000 3001

# Comando de desarrollo
CMD ["npm", "run", "dev"]

# Etapa de build del frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/panel_admin

# Copiar archivos del panel de administración
COPY panel_admin/package*.json ./
RUN npm ci

COPY panel_admin/ ./
RUN npm run build

# Etapa de producción
FROM base AS production

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S staticcms -u 1001

# Copiar aplicación construida
COPY --from=frontend-build /app/panel_admin/dist ./public/admin
COPY api/ ./api/
COPY template/ ./template/
COPY public/ ./public/

# Configurar permisos
RUN chown -R staticcms:nodejs /app
USER staticcms

# Crear directorios necesarios
RUN mkdir -p /app/api/logs /app/api/uploads /app/api/data

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de producción
CMD ["node", "api/src/app.js"] 